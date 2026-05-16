"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Database,
  Cpu,
  Globe,
} from "lucide-react";

// ─── Format presets ─────────────────────────────────────────────────────────
const PRESETS: Record<string, { label: string; contentType: string; body: string; group: string }> = {
  json: {
    label: "JSON",
    group: "Structured",
    contentType: "application/json",
    body: `{
  "contact_name": "Priya Sharma",
  "startup": {
    "name": "AquaTech Solutions",
    "email": "priya@aquatech.my",
    "status": "Seed Stage",
    "notes": "Very messy pitch deck, no clear financial model"
  }
}`,
  },
  csv: {
    label: "CSV",
    group: "Structured",
    contentType: "text/csv",
    body: `name,email,type,notes\nDr. Ali Hassan,ali@venturelab.my,mentor,Highly experienced mentor, loves working with chaotic early-stage founders`,
  },
  xml: {
    label: "XML / SOAP",
    group: "Structured",
    contentType: "application/xml",
    body: `<?xml version="1.0"?>
<mentor>
  <full_name>Dr. Sarah Chen</full_name>
  <email>s.chen@venturecap.com</email>
  <specialization>DeepTech</specialization>
  <notes>Seasoned investor, very patient, loves high-risk founders</notes>
</mentor>`,
  },
  yaml: {
    label: "YAML",
    group: "Structured",
    contentType: "text/yaml",
    body: `name: Ahmad Faris\norganization: Vertex Capital\nrole: mentor\nemail: a.faris@vertex.vc\nspecializations:\n  - FinTech\n  - B2B SaaS\ncapacity_notes: Calm and structured, prefers organized startups`,
  },
  toml: {
    label: "TOML",
    group: "Structured",
    contentType: "application/toml",
    body: `[mentor]\nname = "Lisa Tan"\nemail = "lisa.tan@mdec.my"\nspecialization = "Digital Economy"\nnotes = "Very experienced, handles multiple startups at once easily"`,
  },
  vcard: {
    label: "vCard (.vcf)",
    group: "Structured",
    contentType: "text/vcard",
    body: `BEGIN:VCARD\nVERSION:3.0\nFN:Kevin Ooi\nORG:CircularTech\nEMAIL:kevin@circulartech.my\nNOTE:Very clean business model, detailed financial projections\nEND:VCARD`,
  },
  tsv: {
    label: "TSV",
    group: "Structured",
    contentType: "text/tab-separated-values",
    body: `name\temail\ttype\tnotes\nNurul Aina\tnurul@agrolink.my\tstartup\tEarly stage agritech, passionate but very rough deck`,
  },
  ndjson: {
    label: "NDJSON",
    group: "Structured",
    contentType: "application/x-ndjson",
    body: `{"id":1,"entity":"startup","company_name":"FlowSpark","contact_email":"hello@flowspark.io","description":"Early stage logistics AI, enthusiastic but very disorganized"}`,
  },
  markdown: {
    label: "Markdown + Frontmatter",
    group: "Hybrid",
    contentType: "text/markdown",
    body: `---\ntitle: Mentor Profile\nauthor: MDEC Portal\n---\n\n# Dr. Leila Karim\n\nSenior partner at GreenFund Ventures with 15 years in climate-tech.\n\n| Field | Value |\n|---|---|\n| Email | l.karim@greenfund.vc |\n| Specialization | CleanTech, ESG |\n| Style | Very patient, loves chaotic founders |`,
  },
  formencoded: {
    label: "Form URL-Encoded",
    group: "Hybrid",
    contentType: "application/x-www-form-urlencoded",
    body: `full_name=Marcus+Lee&company=GreenLoop+AI&role_type=startup&description=Early+stage+climate+tech%2C+rough+deck+but+passionate+team`,
  },
  email: {
    label: "Raw Email",
    group: "Unstructured",
    contentType: "text/plain",
    body: `From: ceo@urbanmove.io\nTo: cradle@intake.my\nSubject: Application - UrbanMove\n\nHi team, we are UrbanMove, a mobility startup based in KL. We operate e-scooter fleets for last-mile delivery. Our team of 8 is scrappy but passionate. Looking for mentorship in operations and logistics.`,
  },
  plaintext: {
    label: "Plain Prose",
    group: "Unstructured",
    contentType: "",
    body: `Hi, my name is Nurul Huda and I am a mentor. I have been advising startups in the AgriTech space for the past 10 years. I am very patient and can work with early-stage chaotic teams. My email is nurul@agriventures.my`,
  },
};

const GROUP_ORDER = ["Structured", "Hybrid", "Unstructured"];

type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: any }
  | { status: "error"; message: string };

export default function IngestPage() {
  const [selectedPreset, setSelectedPreset] = useState("json");
  const [useCustom, setUseCustom] = useState(false);
  const [customBody, setCustomBody] = useState("");
  const [customContentType, setCustomContentType] = useState("");
  const [result, setResult] = useState<ResultState>({ status: "idle" });
  const [totalIngested, setTotalIngested] = useState(0);
  const [copied, setCopied] = useState(false);

  const preset = PRESETS[selectedPreset];
  const activeBody = useCustom ? customBody : preset.body;
  const activeContentType = useCustom ? customContentType : preset.contentType;

  const runIngest = async () => {
    setResult({ status: "loading" });
    try {
      const headers: Record<string, string> = {};
      if (activeContentType) headers["Content-Type"] = activeContentType;
      const res = await fetch("/api/ingest", { method: "POST", headers, body: activeBody });
      const json = await res.json();
      if (res.ok && json.success) {
        setResult({ status: "success", data: json });
        setTotalIngested((n) => n + 1);
      } else {
        setResult({ status: "error", message: json.error || json.message || "Ingestion failed" });
      }
    } catch (e: any) {
      setResult({ status: "error", message: e.message });
    }
  };

  const reset = () => setResult({ status: "idle" });

  const copyResult = () => {
    if (result.status === "success") {
      navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: Object.entries(PRESETS).filter(([, v]) => v.group === g),
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header — identical pattern to dashboard & applications pages */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
            Universal Adapter
          </h1>
          <p className="text-neutral-400 text-sm">
            Send any data format — Gemini classifies the infrastructure, extracts the entity, and writes to Supabase.
          </p>
        </div>
        <Button
          onClick={reset}
          variant="outline"
          className="border-neutral-700 text-neutral-400 hover:text-foreground hover:border-neutral-600 gap-2"
          size="sm"
        >
          <RefreshCw className="w-4 h-4" />
          Clear Result
        </Button>
      </div>

      {/* Stats — same 3-card pattern as dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-neutral-800 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Formats Supported</CardTitle>
            <Globe className="w-4 h-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">13+</div>
            <p className="text-xs text-neutral-500 mt-1">Structured, hybrid & unstructured</p>
          </CardContent>
        </Card>
        <Card className="glass border-neutral-800 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">AI Classifier</CardTitle>
            <Cpu className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">Gemini</div>
            <p className="text-xs text-neutral-500 mt-1">gemini-3.1-flash-lite</p>
          </CardContent>
        </Card>
        <Card className="glass border-neutral-800 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Ingested This Session</CardTitle>
            <Database className="w-4 h-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-500">{totalIngested}</div>
            <p className="text-xs text-neutral-500 mt-1">Profiles written to Supabase</p>
          </CardContent>
        </Card>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT: Format selector + editor */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="glass border-neutral-800 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Select Format</CardTitle>
              <p className="text-xs text-neutral-500">Click any format to load a real-world example payload</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {grouped.map(({ group, items }) => (
                <div key={group}>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-2">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => { setSelectedPreset(key); setUseCustom(false); reset(); }}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                          selectedPreset === key && !useCustom
                            ? "bg-sky-600/10 text-sky-500 border-sky-600/20"
                            : "border-neutral-700 text-neutral-400 hover:text-foreground hover:border-neutral-600 hover:bg-neutral-800/30"
                        }`}
                      >
                        {val.label}
                      </button>
                    ))}
                    <button
                      onClick={() => { setUseCustom(true); reset(); }}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                        useCustom
                          ? "bg-sky-600/10 text-sky-500 border-sky-600/20"
                          : "border-neutral-700 text-neutral-400 hover:text-foreground hover:border-neutral-600 hover:bg-neutral-800/30"
                      }`}
                    >
                      ✏️ Custom
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass border-neutral-800 rounded-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-foreground">Payload</CardTitle>
                <p className="text-xs text-neutral-500 mt-1">
                  Content-Type:{" "}
                  {useCustom ? (
                    <input
                      value={customContentType}
                      onChange={(e) => setCustomContentType(e.target.value)}
                      placeholder="e.g. application/json (blank = heuristic)"
                      className="inline-block bg-transparent text-sky-400 font-mono text-xs outline-none border-b border-neutral-700 focus:border-sky-600 w-64 ml-1"
                    />
                  ) : (
                    <span className="font-mono text-sky-500">
                      {activeContentType || <span className="text-neutral-500 italic">none — heuristic detection</span>}
                    </span>
                  )}
                </p>
              </div>
              {!useCustom && (
                <Badge variant="outline" className="text-sky-400 border-sky-600/20 bg-sky-600/10 text-[10px]">
                  {preset.group}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <textarea
                value={activeBody}
                onChange={(e) => { if (useCustom) setCustomBody(e.target.value); }}
                readOnly={!useCustom}
                rows={12}
                spellCheck={false}
                className="w-full font-mono text-xs rounded-xl border border-neutral-700 p-4 bg-neutral-950/50 text-neutral-200 outline-none resize-none leading-relaxed focus:border-sky-600/50 transition-colors"
              />
            </CardContent>
          </Card>

          <Button
            onClick={runIngest}
            disabled={result.status === "loading"}
            className="w-full bg-sky-600 hover:bg-sky-700 text-foreground font-bold py-3 rounded-xl shadow-lg shadow-sky-600/20 transition-all gap-3"
          >
            {result.status === "loading" ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>
                  <Zap className="w-4 h-4" />
                </motion.div>
                Classifying with Gemini...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Send to Universal Adapter
              </>
            )}
          </Button>
        </div>

        {/* RIGHT: Result panel */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <AnimatePresence mode="wait">
              {result.status === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card className="glass border-neutral-800 rounded-2xl">
                    <CardContent className="py-16 text-center">
                      <Upload className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                      <p className="text-neutral-400 font-medium">No result yet</p>
                      <p className="text-sm text-neutral-500 mt-1 max-w-xs mx-auto">
                        Select a format and click "Send" to see Gemini classify your payload in real-time.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {result.status === "loading" && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card className="glass border-neutral-800 rounded-2xl">
                    <CardContent className="py-10 text-center space-y-4">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="w-12 h-12 rounded-2xl bg-sky-600/10 border border-sky-600/20 flex items-center justify-center mx-auto"
                      >
                        <Zap className="w-6 h-6 text-sky-500" />
                      </motion.div>
                      <p className="text-sm text-neutral-400 font-medium">Gemini is classifying...</p>
                      <div className="space-y-2 text-left max-w-[180px] mx-auto">
                        {["Detecting format", "Extracting entity", "Writing to Supabase"].map((step, i) => (
                          <motion.div
                            key={step}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.3 }}
                            className="text-xs text-neutral-500 flex items-center gap-2"
                          >
                            <motion.div
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                              className="w-1.5 h-1.5 rounded-full bg-sky-500"
                            />
                            {step}
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {result.status === "error" && (
                <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card className="glass border-rose-500/30 rounded-2xl">
                    <CardContent className="py-6">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-rose-400 mb-1">Ingestion Failed</p>
                          <p className="text-xs text-rose-300/70">{result.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {result.status === "success" && (
                <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Format detected banner */}
                  <Card className="glass border-sky-600/20 rounded-2xl">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-sky-500 shrink-0" />
                        <div>
                          <p className="text-xs text-neutral-400 mb-0.5">Format Detected</p>
                          <p className="text-sm font-semibold text-foreground">{result.data.detected_format}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Classification */}
                  <Card className="glass border-neutral-800 rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-neutral-400">AI Classification</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ResultRow label="Source" value={result.data.classification?.source_infrastructure} />
                      <ResultRow label="Type" value={result.data.classification?.data_type} highlight />
                      <ResultRow label="Confidence" value={`${Math.round((result.data.classification?.confidence ?? 0) * 100)}%`} />
                    </CardContent>
                  </Card>

                  {/* Standardized entity */}
                  <Card className="glass border-neutral-800 rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-neutral-400">Standardized Profile → Supabase</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ResultRow label="Name" value={result.data.data?.name} />
                      <ResultRow label="Email" value={result.data.data?.email} />
                      <ResultRow label="Role" value={result.data.data?.role} highlight />
                      <ResultRow label="Friction" value={result.data.data?.friction_capacity} />
                      <ResultRow label="DB ID" value={result.data.data?.id?.slice(0, 12) + "..."} mono />

                      {result.data.classification?.standardized_entity?.skills?.length > 0 && (
                        <div className="pt-1">
                          <p className="text-[10px] text-neutral-500 mb-2 uppercase tracking-widest">Skills Extracted</p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.data.classification.standardized_entity.skills.map((s: string) => (
                              <Badge key={s} variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/20 bg-cyan-500/10">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.data.classification?.standardized_entity?.summary && (
                        <p className="text-xs text-neutral-400 italic border-t border-neutral-800 pt-3">
                          "{result.data.classification.standardized_entity.summary}"
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyResult}
                    className="w-full border-neutral-700 text-neutral-400 hover:text-foreground gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? "Copied!" : "Copy Raw JSON"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value, highlight = false, mono = false }: {
  label: string; value: any; highlight?: boolean; mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-neutral-500 shrink-0">{label}</span>
      <span className={`text-xs font-medium truncate text-right ${
        highlight ? "text-sky-500" : mono ? "font-mono text-neutral-400" : "text-neutral-200"
      }`}>
        {String(value ?? "—")}
      </span>
    </div>
  );
}
