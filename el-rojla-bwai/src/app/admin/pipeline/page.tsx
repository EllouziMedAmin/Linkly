"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, XCircle, Zap, Globe, Building2, Users,
  Webhook, Database, RefreshCw, Table2, StickyNote,
  Activity, ChevronDown, ChevronUp, ArrowRight,
} from "lucide-react";

const PARTNERS = [
  {
    key: "lnk_500_webhook_2b8f4v", orgName: "500 Startups SEA", orgType: "Accelerator",
    pipelineType: "webhook", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20",
    icon: Webhook, description: "New startup applications submitted through 500 Startups' online portal arrive here automatically in real-time.",
    contentType: "application/x-www-form-urlencoded",
    payload: `full_name=Jane+Loh&company=HealthAI+MY&role_type=startup&pitch=AI-powered+diagnostics+for+rural+clinics`,
  },
  {
    key: "lnk_nexea_crm_8k3p1r", orgName: "NEXEA", orgType: "Accelerator",
    pipelineType: "crm", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20",
    icon: Building2, description: "NEXEA's startup relationship management system (HubSpot) syncs portfolio company profiles directly.",
    contentType: "application/json",
    payload: JSON.stringify({ company: "EduTech MY", email: "ceo@edutech.my", stage: "Seed", notes: "Highly organized edtech startup with clear metrics" }),
  },
  {
    key: "lnk_mdec_partner_4p2n8q", orgName: "MDEC", orgType: "Government Agency",
    pipelineType: "partner", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20",
    icon: Users, description: "MDEC pushes mentor and digital economy expert profiles from their national talent network.",
    contentType: "text/csv",
    payload: `name,email,role,expertise,notes\nDr. Azman Yusof,azman@mdec.my,mentor,Digital Transformation,Highly experienced and patient`,
  },
  {
    key: "lnk_magic_partner_6t4z9n", orgName: "MaGIC", orgType: "Government Accelerator",
    pipelineType: "sheets", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: Table2, description: "MaGIC maintains a Google Sheet of their startup cohorts. Linkly reads it automatically — no manual export needed.",
    contentType: "text/csv",
    payload: `name,email,type,cohort,notes\nAgroLink MY,hello@agrolink.my,startup,Cohort 7,Early stage agritech passionate founders`,
  },
  {
    key: "lnk_utm_partner_3r5j1w", orgName: "UTM TEC", orgType: "University",
    pipelineType: "partner", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
    icon: Globe, description: "UTM's Technology Entrepreneurship Centre sends university spinoffs and researcher-founded startups.",
    contentType: "text/yaml",
    payload: `startup_name: RoboticsMY\nemail: team@roboticsmy.com\nstage: Pre-seed\nnotes: University spinoff, highly technical, chaotic but brilliant`,
  },
  {
    key: "lnk_um_airtable_7h2m5q", orgName: "UM Innovation Hub", orgType: "University",
    pipelineType: "airtable", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20",
    icon: Table2, description: "UM tracks research commercialisation candidates in Airtable. Profiles sync automatically when updated.",
    contentType: "application/json",
    payload: JSON.stringify({ fields: { Name: "Dr. Lim Bee Hong", Email: "lbh@um.edu.my", Role: "mentor", Specialization: "Biotech", Notes: "Methodical research mentor" } }),
  },
  {
    key: "lnk_vertex_erp_9m1z6t", orgName: "Vertex Capital", orgType: "Venture Capital",
    pipelineType: "erp", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20",
    icon: Database, description: "Vertex Capital's SAP portfolio management system exports both investee companies and partner mentors.",
    contentType: "application/xml",
    payload: `<?xml version="1.0"?><entity><type>mentor</type><full_name>Tan Sri Lim Wei</full_name><email>lim.wei@vertex.vc</email><notes>Senior LP, very structured</notes></entity>`,
  },
  {
    key: "lnk_mavcap_notion_5p8j2w", orgName: "MAVCAP", orgType: "Venture Capital",
    pipelineType: "notion", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20",
    icon: StickyNote, description: "MAVCAP maintains their mentor directory in Notion. Pages are exported and ingested automatically.",
    contentType: "text/markdown",
    payload: `---\ntitle: Mentor Directory\n---\n# Dato Ahmad Rashid\n| Email | ahmad@mavcap.com |\n| Specialization | Deep Tech |\n| Style | Patient mentor |`,
  },
  {
    key: "lnk_hr_workday_5c3h7s", orgName: "TalentBridge MY", orgType: "HR Platform",
    pipelineType: "hr", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20",
    icon: Users, description: "TalentBridge exports mentor contact cards (vCard format) directly from Workday HR, automatically converting them to Linkly profiles.",
    contentType: "text/vcard",
    payload: `BEGIN:VCARD\nVERSION:3.0\nFN:Dr. Fatimah Zahra\nEMAIL:fatimah@talentbridge.my\nNOTE:15 years in banking, loves helping disorganized founders\nEND:VCARD`,
  },
];

const PIPELINE_LABELS: Record<string, string> = {
  crm: "CRM System", hr: "HR Platform", erp: "Enterprise System",
  partner: "Partner Portal", webhook: "Live Webhook", batch: "Bulk Upload",
  sheets: "Google Sheets", airtable: "Airtable", notion: "Notion",
};

const SOURCE_FORMAT_LABELS: Record<string, string> = {
  "application/json": "JSON", "text/csv": "Spreadsheet (CSV)", "application/xml": "XML",
  "text/yaml": "YAML", "text/vcard": "Contact Card (vCard)",
  "text/markdown": "Markdown", "application/x-www-form-urlencoded": "Web Form",
};

type Status = "idle" | "loading" | "success" | "error";
interface Result { status: Status; data?: any; error?: string; duration?: number; }

export default function PipelineMonitorPage() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);

  const fire = async (partner: (typeof PARTNERS)[0]) => {
    setResults(p => ({ ...p, [partner.key]: { status: "loading" } }));
    const start = Date.now();
    try {
      const endpoint = partner.pipelineType === "sheets" ? "/api/pipeline/sheets" : `/api/pipeline/${partner.pipelineType}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "X-Linkly-API-Key": partner.key, ...(partner.contentType ? { "Content-Type": partner.contentType } : {}) },
        body: partner.payload,
      });
      const json = await res.json();
      const duration = Date.now() - start;
      setResults(p => ({ ...p, [partner.key]: { status: res.ok && json.success ? "success" : "error", data: json, error: json.error || json.message, duration } }));
    } catch (e: any) {
      setResults(p => ({ ...p, [partner.key]: { status: "error", error: e.message, duration: Date.now() - start } }));
    }
  };

  const fireAll = async () => { setRunningAll(true); await Promise.all(PARTNERS.map(fire)); setRunningAll(false); };

  const successCount = Object.values(results).filter(r => r.status === "success").length;
  const errorCount = Object.values(results).filter(r => r.status === "error").length;
  const loadingCount = Object.values(results).filter(r => r.status === "loading").length;

  const orgTypes = [
    { label: "Accelerators", filter: "Accelerator" },
    { label: "Government", filter: "Government" },
    { label: "Universities", filter: "University" },
    { label: "Venture Capital", filter: "Venture Capital" },
    { label: "HR Platforms", filter: "HR Platform" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">Pipeline Monitor</h1>
          <p className="text-neutral-400 text-sm">
            Connected organizations push data to Linkly automatically. No manual uploads needed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setResults({})} variant="outline" size="sm" className="border-neutral-700 text-neutral-400 hover:text-foreground gap-2">
            <RefreshCw className="w-3.5 h-3.5" />Clear
          </Button>
          <Button onClick={fireAll} disabled={runningAll} className="bg-sky-600 hover:bg-sky-700 text-foreground font-bold px-6 rounded-xl shadow-lg shadow-sky-600/20 gap-2">
            <Zap className={`w-4 h-4 ${runningAll ? "animate-spin" : ""}`} />
            {runningAll ? "Syncing all partners…" : "Sync All Partners"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Connected Partners", value: PARTNERS.length, icon: Globe, color: "text-foreground" },
          { label: "Successfully Synced", value: successCount, icon: CheckCircle, color: "text-sky-500" },
          { label: "Syncing Now", value: loadingCount, icon: Activity, color: "text-amber-400" },
          { label: "Needs Attention", value: errorCount, icon: XCircle, color: "text-rose-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="glass border-neutral-800 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-neutral-400">{label}</CardTitle>
              <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent><div className={`text-3xl font-bold ${color}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Partner cards by org type */}
      {orgTypes.map(({ label, filter }) => {
        const group = PARTNERS.filter(p => p.orgType.includes(filter));
        if (!group.length) return null;
        return (
          <div key={filter}>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-3">{label}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.map(partner => {
                const result = results[partner.key];
                const Icon = partner.icon;
                const isExpanded = expandedKey === partner.key;
                const status = result?.status ?? "idle";

                return (
                  <Card key={partner.key} className={`glass rounded-2xl border transition-all ${
                    status === "success" ? "border-sky-600/30" :
                    status === "error" ? "border-rose-500/30" :
                    "border-neutral-800"
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${partner.bg}`}>
                            <Icon className={`w-5 h-5 ${partner.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-bold text-foreground">{partner.orgName}</CardTitle>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className={`text-[9px] border px-1.5 ${partner.bg} ${partner.color}`}>
                                {PIPELINE_LABELS[partner.pipelineType]}
                              </Badge>
                              <span className="text-[9px] text-neutral-500">{SOURCE_FORMAT_LABELS[partner.contentType] || "Auto-detected"}</span>
                            </div>
                          </div>
                        </div>
                        {/* Status indicator */}
                        <div className="shrink-0">
                          {status === "idle" && <div className="w-2.5 h-2.5 rounded-full bg-neutral-700 mt-1" />}
                          {status === "loading" && <RefreshCw className="w-4 h-4 text-sky-500 animate-spin" />}
                          {status === "success" && <CheckCircle className="w-4 h-4 text-sky-500" />}
                          {status === "error" && <XCircle className="w-4 h-4 text-rose-400" />}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="text-xs text-neutral-400 leading-relaxed">{partner.description}</p>

                      {/* Result summary */}
                      <AnimatePresence mode="wait">
                        {status === "success" && result?.data && (
                          <motion.div key="success" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                            <div className="bg-sky-600/10 border border-sky-600/20 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-foreground">{result.data.data?.name}</span>
                                <Badge className={`text-[9px] border ${result.data.data?.role === "mentor" ? "text-amber-400 border-amber-500/20 bg-amber-500/10" : "text-sky-400 border-sky-600/20 bg-sky-600/10"}`}>
                                  {result.data.data?.role}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-neutral-400">{result.data.data?.email}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-neutral-500">Confidence</span>
                                <span className="text-[10px] font-semibold text-sky-400">{Math.round((result.data.classification?.confidence ?? 0) * 100)}%</span>
                              </div>
                              {result.duration && <p className="text-[9px] text-neutral-600 mt-1">Synced in {result.duration}ms</p>}
                            </div>
                            {/* Pipeline tags */}
                            {result.data.classification?.pipeline_tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {result.data.classification.pipeline_tags.map((t: string) => (
                                  <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">{t}</span>
                                ))}
                              </div>
                            )}
                            {/* Summary */}
                            {result.data.classification?.standardized_entity?.summary && (
                              <p className="text-[10px] text-neutral-400 italic">"{result.data.classification.standardized_entity.summary}"</p>
                            )}
                          </motion.div>
                        )}
                        {status === "error" && (
                          <motion.div key="error" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                            <p className="text-xs text-rose-400 font-medium mb-0.5">Sync issue</p>
                            <p className="text-[10px] text-rose-300/70">{
                              result?.error?.includes("already registered")
                                ? "This profile already exists in the system."
                                : result?.error
                            }</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => fire(partner)}
                          disabled={status === "loading"}
                          className="flex-1 bg-sky-600/10 hover:bg-sky-600/20 text-sky-500 border border-sky-600/20 text-xs rounded-lg h-8 gap-1.5"
                        >
                          {status === "loading" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          {status === "loading" ? "Syncing…" : "Sync Now"}
                        </Button>
                        <button
                          onClick={() => setExpandedKey(isExpanded ? null : partner.key)}
                          className="h-8 px-3 rounded-lg border border-neutral-700 text-neutral-400 hover:text-foreground hover:border-neutral-600 transition-all flex items-center gap-1 text-xs"
                        >
                          Details {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Expanded details — human readable, no raw code */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            key="details"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-neutral-800 pt-3 space-y-2"
                          >
                            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Connection Details</p>
                            <div className="space-y-1.5">
                              <DetailRow label="Organization" value={partner.orgName} />
                              <DetailRow label="Type" value={partner.orgType} />
                              <DetailRow label="Pipeline" value={PIPELINE_LABELS[partner.pipelineType]} />
                              <DetailRow label="Data Format" value={SOURCE_FORMAT_LABELS[partner.contentType] || "Auto-detected"} />
                              <DetailRow label="Authentication" value="Active — API key verified" highlight />
                              <DetailRow label="Endpoint" value={`/api/pipeline/${partner.pipelineType}`} mono />
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-neutral-800">
                              <ArrowRight className="w-3 h-3 text-neutral-500" />
                              <p className="text-[10px] text-neutral-500">
                                This partner connects once — data flows automatically from their system to Linkly with no manual action required.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value, highlight = false, mono = false }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] text-neutral-500 shrink-0">{label}</span>
      <span className={`text-[10px] font-medium text-right truncate ${highlight ? "text-sky-400" : mono ? "font-mono text-neutral-400" : "text-neutral-300"}`}>{value}</span>
    </div>
  );
}
