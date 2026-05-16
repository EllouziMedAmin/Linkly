/**
 * Linkly Pipeline Registry — Ecosystem Agnostic
 * 
 * Partners register here to get a typed API key.
 * The pipeline type tells Gemini what kind of data to expect,
 * dramatically improving classification accuracy.
 * 
 * No single organization owns this — any ecosystem participant
 * (accelerator, university, VC, HR platform, government agency)
 * can integrate by registering and using their key.
 */

export type PipelineType = 'crm' | 'hr' | 'erp' | 'partner' | 'webhook' | 'batch' | 'sheets' | 'airtable' | 'notion';

export interface RegisteredPartner {
  key: string;
  orgName: string;
  orgType: string;
  pipelineType: PipelineType;
  description: string;
  expectedEntityType: 'company' | 'mentor' | 'mixed';
}

export const PIPELINE_REGISTRY: RegisteredPartner[] = [
  // ── Accelerators ───────────────────────────────────────────────────────────
  {
    key: 'lnk_500_webhook_2b8f4v',
    orgName: '500 Startups SEA',
    orgType: 'Accelerator',
    pipelineType: 'webhook',
    description: 'Real-time webhook from 500 Startups application portal',
    expectedEntityType: 'company',
  },
  {
    key: 'lnk_nexea_crm_8k3p1r',
    orgName: 'NEXEA',
    orgType: 'Accelerator',
    pipelineType: 'crm',
    description: 'HubSpot CRM export from NEXEA accelerator programme',
    expectedEntityType: 'company',
  },

  // ── Government & Agencies ──────────────────────────────────────────────────
  {
    key: 'lnk_mdec_partner_4p2n8q',
    orgName: 'MDEC',
    orgType: 'Government Digital Agency',
    pipelineType: 'partner',
    description: 'MDEC mentor and innovation lab network pipeline',
    expectedEntityType: 'mentor',
  },
  {
    key: 'lnk_magic_partner_6t4z9n',
    orgName: 'MaGIC',
    orgType: 'Government Accelerator',
    pipelineType: 'sheets',
    description: 'Google Sheets roster of MaGIC startup cohort participants',
    expectedEntityType: 'company',
  },

  // ── Universities & Research ────────────────────────────────────────────────
  {
    key: 'lnk_utm_partner_3r5j1w',
    orgName: 'UTM Technology Entrepreneurship Centre',
    orgType: 'University Innovation Lab',
    pipelineType: 'partner',
    description: 'University startup and researcher pipeline',
    expectedEntityType: 'company',
  },
  {
    key: 'lnk_um_airtable_7h2m5q',
    orgName: 'UM Innovation Hub',
    orgType: 'University Innovation Lab',
    pipelineType: 'airtable',
    description: 'Airtable database of UM research commercialisation candidates',
    expectedEntityType: 'mixed',
  },

  // ── Venture Capital ────────────────────────────────────────────────────────
  {
    key: 'lnk_vertex_erp_9m1z6t',
    orgName: 'Vertex Capital',
    orgType: 'Venture Capital',
    pipelineType: 'erp',
    description: 'SAP ERP portfolio management pipeline',
    expectedEntityType: 'mixed',
  },
  {
    key: 'lnk_mavcap_notion_5p8j2w',
    orgName: 'MAVCAP',
    orgType: 'Venture Capital',
    pipelineType: 'notion',
    description: 'Notion workspace export of MAVCAP portfolio mentors',
    expectedEntityType: 'mentor',
  },

  // ── HR & Talent Platforms ──────────────────────────────────────────────────
  {
    key: 'lnk_hr_workday_5c3h7s',
    orgName: 'TalentBridge MY',
    orgType: 'HR Platform',
    pipelineType: 'hr',
    description: 'Workday HR export for mentor profile onboarding',
    expectedEntityType: 'mentor',
  },
];

export function lookupPartner(apiKey: string): RegisteredPartner | null {
  return PIPELINE_REGISTRY.find((p) => p.key === apiKey) ?? null;
}

/**
 * Context hints injected into the Gemini prompt per pipeline type.
 */
export const PIPELINE_CONTEXT: Record<PipelineType, string> = {
  crm: 'CRM system (Salesforce / HubSpot). Records are likely company/startup profiles with deal stages, contact info, and opportunity notes.',
  hr: 'HR platform (Workday / BambooHR). Records are likely individual people — mentors, advisors, or programme managers — with skills and employment history.',
  erp: 'ERP system (SAP / Oracle). Records may be mixed — organizational entities (companies) and individual contacts (mentors/partners).',
  partner: 'Partner or university portal. Records may be startups from an incubator, researchers, or mentors from an innovation programme.',
  webhook: 'Real-time webhook from an application portal. Records are likely fresh company or mentor applications just submitted.',
  batch: 'Batch bulk upload. May contain multiple records of mixed types in CSV, JSON array, or NDJSON format.',
  sheets: 'Google Sheets export. Usually structured rows with headers — may contain startups, mentors, or cohort participants.',
  airtable: 'Airtable database export. Structured records with rich metadata fields. Likely company or mentor profiles.',
  notion: 'Notion workspace export. May be a directory page, a table, or freeform profile notes. Could be company or mentor.',
};
