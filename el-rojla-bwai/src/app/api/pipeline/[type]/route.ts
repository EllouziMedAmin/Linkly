import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import { lookupPartner, PIPELINE_CONTEXT, PipelineType } from '@/lib/pipeline-registry';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT NORMALIZER (same parsers as /api/ingest)
// ═══════════════════════════════════════════════════════════════════════════════

function parseCSV(raw: string, delim = ','): string {
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return raw;
  const headers = lines[0].split(delim).map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(row => {
    const vals = row.split(delim).map(v => v.replace(/"/g, '').trim());
    return headers.map((h, i) => `${h}: ${vals[i] ?? ''}`).join('\n');
  }).join('\n\n---\n\n');
}

function parseXML(raw: string): string {
  return raw
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!\[CDATA\[(.*?)\]\]>/gis, '$1')
    .replace(/<([^/>\s][^>]*)>/g, '[$1] ')
    .replace(/<\/[^>]+>/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseVCard(raw: string): string {
  return raw.split(/BEGIN:VCARD/i).filter(Boolean).map((card, i) => {
    const lines = card.replace(/END:VCARD/i, '').split('\n').map(l => l.trim()).filter(Boolean)
      .map(line => { const [k, ...r] = line.split(':'); return `${k.split(';')[0]}: ${r.join(':').trim()}`; });
    return `Contact ${i + 1}:\n${lines.join('\n')}`;
  }).join('\n\n---\n\n');
}

async function normalizeBody(request: Request): Promise<{ textBlob: string; detectedFormat: string }> {
  const ct = (request.headers.get('content-type') ?? '').toLowerCase();
  const raw = await request.text();
  const t = raw.trimStart();

  if (ct.includes('application/json') || t.startsWith('{') || t.startsWith('[')) {
    try { return { textBlob: JSON.stringify(JSON.parse(raw), null, 2), detectedFormat: 'JSON' }; } catch {}
  }
  if (ct.includes('text/csv') || /^[a-zA-Z_"]+,/.test(t)) {
    return { textBlob: parseCSV(raw), detectedFormat: 'CSV' };
  }
  if (ct.includes('tab-separated') || (t.includes('\t') && /^[^\t\n]+\t/.test(t))) {
    return { textBlob: parseCSV(raw, '\t'), detectedFormat: 'TSV' };
  }
  if (ct.includes('xml') || t.startsWith('<')) {
    return { textBlob: parseXML(raw), detectedFormat: 'XML' };
  }
  if (ct.includes('yaml') || /^\s*[a-zA-Z_]+\s*:\s*.+/m.test(t)) {
    return { textBlob: raw.trim(), detectedFormat: 'YAML' };
  }
  if (t.startsWith('BEGIN:VCARD')) {
    return { textBlob: parseVCard(raw), detectedFormat: 'vCard' };
  }
  if (ct.includes('application/x-ndjson') || (t.split('\n').filter(Boolean).length > 1 && t.trim().startsWith('{'))) {
    return { textBlob: raw, detectedFormat: 'NDJSON' };
  }
  if (ct.includes('x-www-form-urlencoded') || /^\w+=/.test(t)) {
    const decoded = decodeURIComponent(raw).split('&').map(p => { const [k, v] = p.split('='); return `${k?.replace(/\+/g,' ')}: ${v?.replace(/\+/g,' ')}`; }).join('\n');
    return { textBlob: decoded, detectedFormat: 'Form URL-Encoded' };
  }
  return { textBlob: raw.trim(), detectedFormat: 'Plain Text / Unstructured' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE-AWARE GEMINI CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════════

async function classifyForPipeline(
  textBlob: string,
  detectedFormat: string,
  pipelineType: PipelineType,
  orgName: string,
  orgType: string,
  expectedEntityType: string,
) {
  const pipelineContext = PIPELINE_CONTEXT[pipelineType];

  const prompt = `
    You are the Linkly Pipeline Intelligence Engine.
    
    PIPELINE CONTEXT:
    - Sending Organization: ${orgName} (${orgType})
    - Pipeline Type: ${pipelineType.toUpperCase()} — ${pipelineContext}
    - Expected Entity Type: ${expectedEntityType}
    - Data Format: ${detectedFormat}

    Given this context, classify the following data record and extract a standardized entity.

    Tasks:
    1. "source_infrastructure": The specific system within ${orgName} that likely generated this data (e.g., "Salesforce Opportunity", "SAP HR Module", "Workday Profile").
    2. "data_type": "company" (startup), "mentor", or "unknown". Use the pipeline context as a strong prior.
    3. "confidence": 0.0–1.0.
    4. "standardized_entity":
       - name: Entity name.
       - email: Email — synthesize one if missing.
       - role: Exactly "company" or "mentor".
       - friction_capacity:
           • COMPANY: 1–10 (1=organized, 10=chaotic).
           • MENTOR: 1–30 (capacity to absorb disorder; default 20).
       - skills: Up to 5 extracted skills/industries.
       - summary: One sentence.
    5. "pipeline_tags": Up to 3 tags describing this record's characteristics (e.g., ["seed-stage", "cleantech", "kl-based"]).

    Raw data:
    ---
    ${textBlob}
    ---

    Respond ONLY with valid JSON, no markdown:
    {
      "source_infrastructure": "...",
      "data_type": "company" | "mentor" | "unknown",
      "confidence": 0.95,
      "pipeline_tags": ["...", "..."],
      "standardized_entity": {
        "name": "...",
        "email": "...",
        "role": "company" | "mentor",
        "friction_capacity": 5,
        "skills": ["...", "..."],
        "summary": "..."
      }
    }
  `;

  const response = await ai.models.generateContent({ model: 'gemini-3.1-flash-lite', contents: prompt });
  let text = response.text ?? '{}';
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE HANDLER  —  POST /api/pipeline/[type]
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  const validTypes = ['crm', 'hr', 'erp', 'partner', 'webhook', 'batch'];

  if (!validTypes.includes(type)) {
    return NextResponse.json({
      error: `Unknown pipeline type "${type}". Valid types: ${validTypes.join(', ')}`,
    }, { status: 404 });
  }

  // ── API Key Authentication ────────────────────────────────────────────────
  const apiKey =
    request.headers.get('x-linkly-api-key') ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return NextResponse.json({
      error: 'Missing API key. Provide X-Linkly-API-Key header or Authorization: Bearer <key>',
    }, { status: 401 });
  }

  const partner = lookupPartner(apiKey);
  if (!partner) {
    return NextResponse.json({
      error: 'Invalid API key. Register your organization at linkly.io/partners to obtain a key.',
    }, { status: 403 });
  }

  // Warn if pipeline type doesn't match registered type (but allow it — flexible)
  const typeMismatch = partner.pipelineType !== type;

  // ── Normalize payload ────────────────────────────────────────────────────
  const { textBlob, detectedFormat } = await normalizeBody(request);
  if (!textBlob.trim()) {
    return NextResponse.json({ error: 'Empty payload.' }, { status: 400 });
  }

  console.log(`🔌 Pipeline [${type.toUpperCase()}] ← ${partner.orgName} | Format: ${detectedFormat}`);

  // ── Classify with Gemini ─────────────────────────────────────────────────
  let classification;
  try {
    classification = await classifyForPipeline(
      textBlob,
      detectedFormat,
      type as PipelineType,
      partner.orgName,
      partner.orgType,
      partner.expectedEntityType,
    );
  } catch (e: any) {
    return NextResponse.json({ error: 'AI classification failed: ' + e.message }, { status: 500 });
  }

  if (
    classification.data_type === 'unknown' ||
    !['company', 'mentor'].includes(classification.standardized_entity?.role)
  ) {
    return NextResponse.json({
      success: false,
      message: 'Could not classify payload as a company or mentor.',
      pipeline: { type, org: partner.orgName },
      classification,
    }, { status: 400 });
  }

  const entity = classification.standardized_entity;

  // ── Deduplicate ──────────────────────────────────────────────────────────
  const { data: existing } = await supabase.from('profiles').select('id').eq('email', entity.email).limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({
      success: false,
      error: `Entity "${entity.name}" already registered (${entity.email}).`,
      pipeline: { type, org: partner.orgName },
      classification,
    }, { status: 409 });
  }

  // ── Write to Supabase ────────────────────────────────────────────────────
  const { data: newProfile, error: dbError } = await supabase
    .from('profiles')
    .insert([{ role: entity.role, name: entity.name, email: entity.email, friction_capacity: entity.friction_capacity }])
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: 'Database write failed: ' + dbError.message }, { status: 500 });
  }

  console.log(`✅ [${type.toUpperCase()}] Ingested "${entity.name}" (${entity.role}) from ${partner.orgName}`);

  return NextResponse.json({
    success: true,
    message: `Record from ${partner.orgName} successfully ingested via the ${type.toUpperCase()} pipeline.`,
    pipeline: {
      type,
      org: partner.orgName,
      org_type: partner.orgType,
      format_detected: detectedFormat,
      type_mismatch_warning: typeMismatch ? `Key is registered for "${partner.pipelineType}" pipeline but used on "${type}"` : null,
    },
    data: newProfile,
    classification,
  });
}

// ── GET: Pipeline health check ─────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  return NextResponse.json({
    status: 'active',
    pipeline: type,
    endpoint: `/api/pipeline/${type}`,
    authentication: 'X-Linkly-API-Key header required',
    supported_formats: ['JSON', 'CSV', 'XML', 'YAML', 'TSV', 'vCard', 'NDJSON', 'Form URL-Encoded', 'Plain Text'],
    documentation: 'https://linkly.io/docs/pipelines',
  });
}
