import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT PARSERS
// Each parser converts a raw body string into a human-readable text blob.
// Gemini reads the blob regardless of origin — plug and play for any pipeline.
// ═══════════════════════════════════════════════════════════════════════════════

// ── STRUCTURED ─────────────────────────────────────────────────────────────────

/** JSON / JSON-LD / GraphQL response */
function parseJSON(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    // Unwrap GraphQL { data: { ... } } envelope
    const unwrapped = parsed?.data ?? parsed;
    return JSON.stringify(unwrapped, null, 2);
  } catch {
    return raw;
  }
}

/** NDJSON — newline-delimited JSON (log streams, Kafka exports) */
function parseNDJSON(raw: string): string {
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line, i) => {
      try { return `Record ${i + 1}:\n${JSON.stringify(JSON.parse(line), null, 2)}`; }
      catch { return line; }
    })
    .join('\n\n---\n\n');
}

/** CSV — comma-separated (Excel, Salesforce, database exports) */
function parseCSV(raw: string, delimiter = ','): string {
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return raw;
  const headers = lines[0].split(delimiter).map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map((row) => {
    const values = row.split(delimiter).map(v => v.replace(/"/g, '').trim());
    return headers.map((h, i) => `${h}: ${values[i] ?? ''}`).join('\n');
  }).join('\n\n---\n\n');
}

/** TSV — tab-separated values (Google Sheets export, academic data) */
function parseTSV(raw: string): string {
  return parseCSV(raw, '\t');
}

/** XML / SOAP / RSS / Atom */
function parseXML(raw: string): string {
  return raw
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!\[CDATA\[(.*?)\]\]>/gis, '$1')
    .replace(/<([^/>\s][^>]*)>/g, '[$1] ')
    .replace(/<\/[^>]+>/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** YAML — config files, CI/CD pipelines, Kubernetes, Ansible */
function parseYAML(raw: string): string {
  // Light YAML-to-text: preserve key: value structure as-is (Gemini reads YAML natively)
  return raw
    .replace(/^---\s*$/gm, '')
    .replace(/^\s*#.*$/gm, '')
    .trim();
}

/** TOML — config files, package manifests, Rust Cargo, Python pyproject */
function parseTOML(raw: string): string {
  // Preserve key = value pairs, strip comments and section headers as readable text
  return raw
    .replace(/^\s*#.*$/gm, '')
    .replace(/^\[([^\]]+)\]$/gm, '\n== Section: $1 ==')
    .replace(/^\s*\[\[([^\]]+)\]\]\s*$/gm, '\n== Array Entry: $1 ==')
    .trim();
}

/** vCard (.vcf) — contact exports from Outlook, phones, HubSpot */
function parseVCard(raw: string): string {
  const vcards = raw.split(/BEGIN:VCARD/i).filter(Boolean);
  return vcards.map((card, i) => {
    const lines = card
      .replace(/END:VCARD/i, '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(line => {
        const [key, ...rest] = line.split(':');
        const cleanKey = key.split(';')[0].replace('VERSION', 'vCard Version');
        return `${cleanKey}: ${rest.join(':').trim()}`;
      });
    return `Contact ${i + 1}:\n${lines.join('\n')}`;
  }).join('\n\n---\n\n');
}

// ── HYBRID (structured + prose) ─────────────────────────────────────────────

/** Markdown with YAML frontmatter (Notion, Obsidian, Hugo, Jekyll exports) */
function parseMarkdownFrontmatter(raw: string): string {
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = frontmatterMatch ? `Metadata:\n${frontmatterMatch[1].trim()}` : '';
  const body = raw.replace(/^---[\s\S]*?---/, '').replace(/#{1,6}\s/g, '').trim();
  return [frontmatter, body].filter(Boolean).join('\n\n');
}

/** Markdown table (Wiki pages, GitHub README, Confluence exports) */
function parseMarkdownTable(raw: string): string {
  const tableLines = raw.split('\n').filter(l => l.trim().startsWith('|'));
  if (tableLines.length < 2) return raw;
  const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean);
  const rows = tableLines.slice(2); // skip separator row
  return rows.map(row => {
    const values = row.split('|').map(v => v.trim()).filter(Boolean);
    return headers.map((h, i) => `${h}: ${values[i] ?? ''}`).join('\n');
  }).join('\n\n---\n\n');
}

/** HTML — portal exports, web-scraped pages, email newsletters with tables */
function parseHTML(raw: string): string {
  // Extract table data
  let result = raw;
  const tableMatches = raw.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  const tableText = tableMatches.map(table => {
    const rows = (table.match(/<tr[\s\S]*?<\/tr>/gi) ?? []).map(row => {
      const cells = (row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) ?? [])
        .map(cell => cell.replace(/<[^>]+>/g, '').trim());
      return cells.join(' | ');
    });
    return rows.join('\n');
  }).join('\n\n');

  // Strip all HTML tags for prose content
  result = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return tableText ? `Table Data:\n${tableText}\n\nPage Content:\n${result}` : result;
}

/** RFC-style Email (From:, To:, Subject:, body) — forwarded emails, raw SMTP dumps */
function parseEmail(raw: string): string {
  const headerEnd = raw.indexOf('\n\n');
  const headers = headerEnd > -1 ? raw.slice(0, headerEnd) : raw;
  const body = headerEnd > -1 ? raw.slice(headerEnd + 2).trim() : '';
  const parsed = headers.split('\n').map(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > -1) {
      return `${line.slice(0, colonIdx).trim()}: ${line.slice(colonIdx + 1).trim()}`;
    }
    return line;
  }).join('\n');
  return body ? `Email Headers:\n${parsed}\n\nEmail Body:\n${body}` : parsed;
}

/** Form URL-Encoded (HTML forms, portal submissions) */
function parseFormEncoded(raw: string): string {
  return decodeURIComponent(raw)
    .split('&')
    .map(pair => {
      const [key, val] = pair.split('=');
      return `${(key ?? '').replace(/\+/g, ' ')}: ${(val ?? '').replace(/\+/g, ' ')}`;
    })
    .join('\n');
}

/** Multipart form-data (file upload portals) — extracts text fields only */
function parseMultipart(raw: string): string {
  const parts = raw.split(/------/);
  return parts
    .filter(p => p.includes('Content-Disposition') && !p.includes('filename='))
    .map(p => {
      const nameMatch = p.match(/name="([^"]+)"/);
      const valueMatch = p.split('\r\n\r\n').slice(1).join('').trim();
      return nameMatch ? `${nameMatch[1]}: ${valueMatch}` : valueMatch;
    })
    .filter(Boolean)
    .join('\n');
}

// ── UNSTRUCTURED ─────────────────────────────────────────────────────────────

/** Plain text, Slack/Teams message exports, notes, emails without headers */
function parsePlainText(raw: string): string {
  return raw.trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT DETECTION ENGINE
// Priority: Content-Type header → body heuristics → plain text fallback
// ═══════════════════════════════════════════════════════════════════════════════

type ParseResult = { textBlob: string; detectedFormat: string };

async function normalizePayload(request: Request): Promise<ParseResult> {
  const contentType = (request.headers.get('content-type') ?? '').toLowerCase();
  const rawBody = await request.text();
  const trimmed = rawBody.trimStart();

  // ── Content-Type header routing ──────────────────────────────────────────
  if (contentType.includes('application/json') || contentType.includes('+json')) {
    return { textBlob: parseJSON(rawBody), detectedFormat: 'JSON / JSON-LD / GraphQL' };
  }
  if (contentType.includes('application/x-ndjson') || contentType.includes('application/x-jsonlines')) {
    return { textBlob: parseNDJSON(rawBody), detectedFormat: 'NDJSON (Log Stream / Kafka Export)' };
  }
  if (contentType.includes('text/csv')) {
    return { textBlob: parseCSV(rawBody), detectedFormat: 'CSV (Excel / Database Export)' };
  }
  if (contentType.includes('text/tab-separated-values') || contentType.includes('text/tsv')) {
    return { textBlob: parseTSV(rawBody), detectedFormat: 'TSV (Google Sheets / Academic Data)' };
  }
  if (contentType.includes('application/xml') || contentType.includes('text/xml') || contentType.includes('+xml')) {
    return { textBlob: parseXML(rawBody), detectedFormat: 'XML / SOAP / RSS' };
  }
  if (contentType.includes('text/yaml') || contentType.includes('application/yaml')) {
    return { textBlob: parseYAML(rawBody), detectedFormat: 'YAML (Config / CI Pipeline)' };
  }
  if (contentType.includes('application/toml') || contentType.includes('text/toml')) {
    return { textBlob: parseTOML(rawBody), detectedFormat: 'TOML (Config / Package Manifest)' };
  }
  if (contentType.includes('text/vcard') || contentType.includes('text/x-vcard')) {
    return { textBlob: parseVCard(rawBody), detectedFormat: 'vCard (Outlook / Phone / HubSpot Contact)' };
  }
  if (contentType.includes('text/html')) {
    return { textBlob: parseHTML(rawBody), detectedFormat: 'HTML (Web Portal / Scraped Page)' };
  }
  if (contentType.includes('text/markdown') || contentType.includes('text/x-markdown')) {
    const hasFrontmatter = /^---\n/.test(trimmed);
    const hasTable = trimmed.includes('|---');
    if (hasFrontmatter) return { textBlob: parseMarkdownFrontmatter(rawBody), detectedFormat: 'Markdown + YAML Frontmatter (Notion / Obsidian Export)' };
    if (hasTable) return { textBlob: parseMarkdownTable(rawBody), detectedFormat: 'Markdown Table (Wiki / GitHub README)' };
    return { textBlob: parsePlainText(rawBody), detectedFormat: 'Markdown Prose' };
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return { textBlob: parseFormEncoded(rawBody), detectedFormat: 'Form URL-Encoded (HTML Form / Portal)' };
  }
  if (contentType.includes('multipart/form-data')) {
    return { textBlob: parseMultipart(rawBody), detectedFormat: 'Multipart Form (File Upload Portal)' };
  }

  // ── Heuristic body detection (no/wrong Content-Type) ─────────────────────
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    // Could be NDJSON if multiple lines, otherwise JSON
    const firstNewline = trimmed.indexOf('\n');
    const firstLine = firstNewline > -1 ? trimmed.slice(0, firstNewline) : trimmed;
    try {
      JSON.parse(firstLine);
      const isNDJSON = trimmed.split('\n').filter(Boolean).length > 1;
      if (isNDJSON && !trimmed.startsWith('[')) {
        return { textBlob: parseNDJSON(rawBody), detectedFormat: 'NDJSON (Heuristic — no Content-Type)' };
      }
    } catch { /* not NDJSON */ }
    return { textBlob: parseJSON(rawBody), detectedFormat: 'JSON (Heuristic — no Content-Type)' };
  }
  if (trimmed.startsWith('<')) {
    if (trimmed.toLowerCase().includes('<html')) return { textBlob: parseHTML(rawBody), detectedFormat: 'HTML (Heuristic)' };
    return { textBlob: parseXML(rawBody), detectedFormat: 'XML (Heuristic — no Content-Type)' };
  }
  if (trimmed.startsWith('BEGIN:VCARD')) {
    return { textBlob: parseVCard(rawBody), detectedFormat: 'vCard (.vcf — Heuristic)' };
  }
  if (/^---\n/.test(trimmed) && trimmed.includes('\n---')) {
    return { textBlob: parseMarkdownFrontmatter(rawBody), detectedFormat: 'Markdown + YAML Frontmatter (Heuristic)' };
  }
  if (trimmed.includes('\t') && /^[^\t\n]+\t[^\t\n]+/.test(trimmed)) {
    return { textBlob: parseTSV(rawBody), detectedFormat: 'TSV (Heuristic — no Content-Type)' };
  }
  if (/^[a-zA-Z_][\w ]+,/.test(trimmed) && trimmed.includes('\n')) {
    return { textBlob: parseCSV(rawBody), detectedFormat: 'CSV (Heuristic — no Content-Type)' };
  }
  if (/^[A-Z-]+:\s/.test(trimmed) && trimmed.includes('\n\n')) {
    return { textBlob: parseEmail(rawBody), detectedFormat: 'Email (RFC-style Headers + Body)' };
  }
  if (trimmed.includes('|---') || trimmed.includes('| ---')) {
    return { textBlob: parseMarkdownTable(rawBody), detectedFormat: 'Markdown Table (Heuristic)' };
  }
  if (/^\s*[a-zA-Z_]+\s*=/.test(trimmed)) {
    return { textBlob: parseTOML(rawBody), detectedFormat: 'TOML (Heuristic)' };
  }
  if (/^\s*[a-zA-Z_]+\s*:\s*.+/m.test(trimmed)) {
    return { textBlob: parseYAML(rawBody), detectedFormat: 'YAML (Heuristic)' };
  }
  if (trimmed.includes('%3D') || trimmed.includes('%40') || /^\w+=/.test(trimmed)) {
    return { textBlob: parseFormEncoded(rawBody), detectedFormat: 'Form URL-Encoded (Heuristic)' };
  }

  // Final fallback: unstructured text (Slack export, free-text email body, notes)
  return { textBlob: parsePlainText(rawBody), detectedFormat: 'Plain Text / Unstructured (Email Body / Slack / Notes)' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════════

async function classifyWithGemini(textBlob: string, detectedFormat: string) {
  const prompt = `
    You are the Linkly Universal Infrastructure Classifier.
    You receive data that has been extracted and normalized from an external system.
    Detected format: ${detectedFormat}
    This data may come from ANY source: CRM, ERP, HR portal, Slack, an email, a CSV export, a web form, a contact card, or raw text.

    Your job:
    1. "source_infrastructure": The most likely source system (e.g., "Salesforce CRM", "SAP ERP", "Outlook Contact Export", "Notion Export", "Manual Email", "Google Sheets Export").
    2. "data_type": "company" (startup), "mentor", or "unknown".
    3. "confidence": 0.0–1.0 on your classification certainty.
    4. "standardized_entity":
       - name: Full name of the company or mentor.
       - email: Valid email — synthesize one if missing (e.g., name@company.com).
       - role: Exactly "company" or "mentor".
       - friction_capacity:
           • COMPANY: 1–10 (1 = highly organized, 10 = highly chaotic). Read notes/descriptions for signals.
           • MENTOR: 1–30 (capacity to absorb disorder; default 20 if unclear).
       - skills: Up to 5 domain skills or industries extracted from the payload.
       - summary: One sentence describing this entity.

    Normalized data:
    ---
    ${textBlob}
    ---

    Respond ONLY with valid JSON — no markdown, no explanation, no extra text:
    {
      "source_infrastructure": "...",
      "data_type": "company" | "mentor" | "unknown",
      "confidence": 0.95,
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

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
  });

  let text = response.text ?? '{}';
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  try {
    const { textBlob, detectedFormat } = await normalizePayload(request);

    if (!textBlob.trim()) {
      return NextResponse.json({ error: 'Empty payload received.' }, { status: 400 });
    }

    console.log(`🌐 Universal Adapter: [${detectedFormat}] payload received.`);

    let classificationResult;
    try {
      classificationResult = await classifyWithGemini(textBlob, detectedFormat);
    } catch (e: any) {
      console.error('Gemini classification failed:', e);
      return NextResponse.json({ error: 'AI classification failed: ' + e.message }, { status: 500 });
    }

    if (
      classificationResult.data_type === 'unknown' ||
      !['company', 'mentor'].includes(classificationResult.standardized_entity?.role)
    ) {
      return NextResponse.json({
        success: false,
        message: 'Payload could not be classified as a company or mentor.',
        detected_format: detectedFormat,
        classification: classificationResult,
      }, { status: 400 });
    }

    const entity = classificationResult.standardized_entity;

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', entity.email)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Entity "${entity.name}" is already registered with email "${entity.email}".`,
        detected_format: detectedFormat,
        classification: classificationResult,
      }, { status: 409 });
    }

    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert([{
        role: entity.role,
        name: entity.name,
        email: entity.email,
        friction_capacity: entity.friction_capacity,
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: 'Database write failed: ' + error.message }, { status: 500 });
    }

    console.log(`✅ Ingested "${entity.name}" from [${detectedFormat}] → ${entity.role}`);

    return NextResponse.json({
      success: true,
      message: `[${detectedFormat}] payload successfully ingested and standardized.`,
      detected_format: detectedFormat,
      data: newProfile,
      classification: classificationResult,
    });

  } catch (error: any) {
    console.error('Universal Adapter Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
