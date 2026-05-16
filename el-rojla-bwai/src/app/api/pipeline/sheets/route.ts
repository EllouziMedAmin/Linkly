import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import { lookupPartner, PIPELINE_CONTEXT } from '@/lib/pipeline-registry';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Google Sheets fetcher ────────────────────────────────────────────────────
// Accepts either a full Google Sheets URL or just the sheet ID.
// Uses the public CSV export endpoint — no API key required if sheet is public.

function extractSheetId(urlOrId: string): string | null {
  const match = urlOrId.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // If it looks like a raw sheet ID (no slashes)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(urlOrId.trim())) return urlOrId.trim();
  return null;
}

async function fetchSheetAsCSV(sheetIdOrUrl: string, gid = '0'): Promise<string> {
  const sheetId = extractSheetId(sheetIdOrUrl);
  if (!sheetId) throw new Error(`Invalid Google Sheets URL or ID: "${sheetIdOrUrl}"`);

  // Public CSV export URL — works on any sheet shared publicly
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(csvUrl, { headers: { 'User-Agent': 'Linkly-Pipeline/1.0' } });

  if (!res.ok) {
    throw new Error(`Google Sheets fetch failed (${res.status}). Ensure the sheet is shared publicly.`);
  }
  return res.text();
}

function parseCSV(raw: string): string {
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return raw;
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(row => {
    const vals = row.split(',').map(v => v.replace(/"/g, '').trim());
    return headers.map((h, i) => `${h}: ${vals[i] ?? ''}`).join('\n');
  }).join('\n\n---\n\n');
}

async function classifyWithGemini(textBlob: string, pipelineContext: string, orgName: string) {
  const prompt = `
    You are the Linkly Universal Classifier.
    Pipeline context: ${pipelineContext}
    Sending organization: ${orgName}

    Classify the following data and extract a standardized entity.

    Tasks:
    1. "source_infrastructure": Specific system that generated this (e.g., "Google Sheets Roster", "Airtable Portfolio DB").
    2. "data_type": "company" or "mentor" or "unknown".
    3. "confidence": 0.0–1.0.
    4. "standardized_entity":
       - name, email (synthesize if missing), role ("company"|"mentor"),
       - friction_capacity (company: 1-10, mentor: 1-30),
       - skills (up to 5), summary (one sentence).
    5. "pipeline_tags": up to 3 descriptive tags.

    Data:
    ---
    ${textBlob}
    ---

    Respond ONLY with valid JSON, no markdown:
    {
      "source_infrastructure": "...",
      "data_type": "company"|"mentor"|"unknown",
      "confidence": 0.95,
      "pipeline_tags": ["..."],
      "standardized_entity": { "name":"...","email":"...","role":"...","friction_capacity":5,"skills":["..."],"summary":"..." }
    }
  `;

  const res = await ai.models.generateContent({ model: 'gemini-3.1-flash-lite', contents: prompt });
  let text = res.text ?? '{}';
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

async function ingestEntity(entity: any, classification: any, pipelineMeta: object) {
  const { data: existing } = await supabase.from('profiles').select('id').eq('email', entity.email).limit(1);
  if (existing && existing.length > 0) {
    return { duplicate: true, entity };
  }
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ role: entity.role, name: entity.name, email: entity.email, friction_capacity: entity.friction_capacity }])
    .select().single();
  if (error) throw new Error('DB write failed: ' + error.message);
  return { duplicate: false, profile: data };
}

// ─── POST /api/pipeline/sheets ────────────────────────────────────────────────
// Body: { sheet_url: "...", gid?: "0" }
// OR: raw CSV body with Content-Type: text/csv

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-linkly-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!apiKey) return NextResponse.json({ error: 'Missing X-Linkly-API-Key header.' }, { status: 401 });

  const partner = lookupPartner(apiKey);
  if (!partner) return NextResponse.json({ error: 'Invalid API key.' }, { status: 403 });

  const ct = request.headers.get('content-type') ?? '';
  let csvText = '';

  if (ct.includes('application/json')) {
    const body = await request.json();
    const sheetUrl = body.sheet_url || body.spreadsheet_url || body.url;
    if (!sheetUrl) return NextResponse.json({ error: 'Provide sheet_url in JSON body.' }, { status: 400 });
    try {
      csvText = await fetchSheetAsCSV(sheetUrl, body.gid ?? '0');
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  } else {
    // Accept raw CSV body directly
    csvText = await request.text();
  }

  if (!csvText.trim()) return NextResponse.json({ error: 'Empty sheet data.' }, { status: 400 });

  const textBlob = parseCSV(csvText);
  const context = PIPELINE_CONTEXT['sheets'];

  console.log(`📊 Sheets Pipeline ← ${partner.orgName}`);

  let classification;
  try {
    classification = await classifyWithGemini(textBlob, context, partner.orgName);
  } catch (e: any) {
    return NextResponse.json({ error: 'Gemini classification failed: ' + e.message }, { status: 500 });
  }

  if (!['company', 'mentor'].includes(classification.standardized_entity?.role)) {
    return NextResponse.json({ success: false, message: 'Could not classify entity.', classification }, { status: 400 });
  }

  const result = await ingestEntity(classification.standardized_entity, classification, { pipeline: 'sheets', org: partner.orgName });

  return NextResponse.json({
    success: !result.duplicate,
    message: result.duplicate
      ? `Entity "${result.entity?.name}" already registered.`
      : `Google Sheets record from ${partner.orgName} ingested.`,
    pipeline: { type: 'sheets', org: partner.orgName },
    data: result.profile ?? null,
    classification,
  }, { status: result.duplicate ? 409 : 200 });
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    pipeline: 'sheets',
    description: 'Fetch and ingest a Google Sheets spreadsheet.',
    usage: {
      json_body: { sheet_url: 'https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit', gid: '0 (optional tab ID)' },
      direct_csv: 'POST raw CSV body with Content-Type: text/csv',
    },
    requirement: 'Sheet must be shared as "Anyone with the link can view".',
  });
}
