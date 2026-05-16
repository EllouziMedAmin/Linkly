"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  FileJson,
  FileText,
  ChevronDown,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VerificationResult {
  friction_score: number;
  industry: string;
  core_needs: string[];
  analysis_summary: string;
}

interface ImportResult {
  name: string;
  email: string;
  role: string;
  friction_capacity: number;
  skills: string[];
  summary: string;
  source_infrastructure: string;
  confidence: number;
}

type Mode = "manual" | "import";

// ─── Format quick-picks for the import tab ───────────────────────────────────
const FORMAT_EXAMPLES: { label: string; contentType: string; snippet: string }[] = [
  {
    label: "JSON",
    contentType: "application/json",
    snippet: `{\n  "company": "SolarNova Inc",\n  "email": "contact@solarnova.com",\n  "notes": "Highly organized, clear 12-month roadmap"\n}`,
  },
  {
    label: "CSV",
    contentType: "text/csv",
    snippet: `name,email,type,notes\nDr. Ali Hassan,ali@venturelab.my,mentor,Experienced mentor, loves chaotic early-stage founders`,
  },
  {
    label: "XML",
    contentType: "application/xml",
    snippet: `<?xml version="1.0"?>\n<mentor>\n  <full_name>Dr. Sarah Chen</full_name>\n  <email>s.chen@venturecap.com</email>\n  <notes>Seasoned investor, very patient</notes>\n</mentor>`,
  },
  {
    label: "YAML",
    contentType: "text/yaml",
    snippet: `name: Ahmad Faris\nemail: a.faris@vertex.vc\nrole: mentor\nnotes: Calm mentor, prefers organized startups`,
  },
  {
    label: "vCard",
    contentType: "text/vcard",
    snippet: `BEGIN:VCARD\nVERSION:3.0\nFN:Kevin Ooi\nORG:CircularTech\nEMAIL:kevin@circulartech.my\nNOTE:Clean business model, detailed financials\nEND:VCARD`,
  },
  {
    label: "Plain Text",
    contentType: "",
    snippet: `Hi, I'm Nurul Huda, a mentor with 10 years in AgriTech. Very patient with early-stage teams. My email is nurul@agriventures.my`,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardPage() {
  const [mode, setMode] = useState<Mode>("manual");

  // Manual state
  const [companyName, setCompanyName] = useState("");
  const [pitchText, setPitchText] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState<VerificationResult | null>(null);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Import state
  const [importPayload, setImportPayload] = useState("");
  const [importContentType, setImportContentType] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showFormatPicker, setShowFormatPicker] = useState(false);

  // ── Manual submit ──────────────────────────────────────────────────────────
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !pitchText.trim()) return;
    setManualLoading(true);
    setManualResult(null);
    setManualSuccess(false);
    setManualError(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim(), pitchDeckText: pitchText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setManualResult(data.ai_verification);
        setManualSuccess(true);
      } else {
        setManualResult(data.ai_verification || null);
        setManualError(data.error || "Verification failed.");
      }
    } catch {
      setManualError("Network error. Please try again.");
    }
    setManualLoading(false);
  };

  const resetManual = () => {
    setCompanyName(""); setPitchText("");
    setManualResult(null); setManualSuccess(false); setManualError(null);
  };

  // ── Import submit ──────────────────────────────────────────────────────────
  const handleImportSubmit = async () => {
    if (!importPayload.trim()) return;
    setImportLoading(true);
    setImportResult(null);
    setImportSuccess(false);
    setImportError(null);

    try {
      const headers: Record<string, string> = {};
      if (importContentType) headers["Content-Type"] = importContentType;

      const res = await fetch("/api/ingest", { method: "POST", headers, body: importPayload });
      const data = await res.json();

      if (res.ok && data.success) {
        const entity = data.classification?.standardized_entity;
        setImportResult({
          name: data.data?.name,
          email: data.data?.email,
          role: data.data?.role,
          friction_capacity: data.data?.friction_capacity,
          skills: entity?.skills ?? [],
          summary: entity?.summary ?? "",
          source_infrastructure: data.classification?.source_infrastructure ?? "",
          confidence: data.classification?.confidence ?? 0,
        });
        setImportSuccess(true);
      } else {
        setImportError(data.error || data.message || "Import failed.");
      }
    } catch (e: any) {
      setImportError(e.message);
    }
    setImportLoading(false);
  };

  const resetImport = () => {
    setImportPayload(""); setImportContentType("");
    setImportResult(null); setImportSuccess(false); setImportError(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
          Onboard Company or Mentor
        </h1>
        <p className="text-neutral-400 text-sm">
          Enter details manually, or import directly from any external system — CRM, ERP, spreadsheet, email, or any data format.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setMode("manual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "manual"
              ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20"
              : "text-neutral-400 hover:text-foreground"
            }`}
        >
          <Brain className="w-4 h-4" />
          Manual Entry
        </button>
        <button
          onClick={() => setMode("import")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "import"
              ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20"
              : "text-neutral-400 hover:text-foreground"
            }`}
        >
          <Upload className="w-4 h-4" />
          Import from External System
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ── MANUAL MODE ─────────────────────────────────────────────────── */}
        {mode === "manual" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-neutral-800 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    <Brain className="w-5 h-5 text-sky-500" />
                    Submit Application
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-foreground placeholder:text-neutral-500 focus:outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/20 transition-all"
                        placeholder="e.g., TechWave Solutions"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">Pitch Deck Text</label>
                      <textarea
                        value={pitchText}
                        onChange={(e) => setPitchText(e.target.value)}
                        rows={8}
                        className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-foreground placeholder:text-neutral-500 focus:outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/20 transition-all resize-none"
                        placeholder="Paste the pitch deck text or a summary of the business model, milestones, and goals..."
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={manualLoading || !companyName.trim() || !pitchText.trim()}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-foreground font-bold py-6 rounded-xl shadow-lg shadow-sky-600/20 transition-all gap-2"
                    >
                      {manualLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Gemini is analyzing...</>
                      ) : (
                        <><Brain className="w-4 h-4" />Verify with AI</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="glass border-neutral-800 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">AI Verification Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {!manualResult && !manualLoading && !manualError && (
                    <div className="py-16 text-center">
                      <Brain className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-500">Submit a company application to see the AI analysis.</p>
                    </div>
                  )}
                  {manualLoading && (
                    <div className="py-16 text-center">
                      <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />
                      <p className="text-neutral-400">Gemini is parsing the pitch deck...</p>
                      <p className="text-sm text-neutral-500 mt-1">Extracting skills, assessing clarity, computing Friction Score...</p>
                    </div>
                  )}
                  {manualError && (
                    <div className="py-8">
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 text-rose-400 font-medium mb-1">
                          <AlertCircle className="w-4 h-4" />Error
                        </div>
                        <p className="text-sm text-rose-300">{manualError}</p>
                      </div>
                      {manualResult && <VerifyResultDisplay result={manualResult} />}
                    </div>
                  )}
                  {manualSuccess && manualResult && (
                    <div className="space-y-6">
                      <div className="bg-sky-600/10 border border-sky-600/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sky-500 font-medium">
                          <CheckCircle className="w-4 h-4" />Company onboarded successfully!
                        </div>
                      </div>
                      <VerifyResultDisplay result={manualResult} />
                      <Button onClick={resetManual} variant="outline" className="w-full border-neutral-700 text-neutral-400 hover:text-foreground">
                        Onboard Another Company
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ── IMPORT MODE ─────────────────────────────────────────────────── */}
        {mode === "import" && (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-neutral-800 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    <Upload className="w-5 h-5 text-sky-500" />
                    Paste External Data
                  </CardTitle>
                  <p className="text-xs text-neutral-500 mt-1">
                    Paste data from any source — Salesforce, SAP, Excel, Notion, a forwarded email, anything. Gemini will classify and standardize it automatically.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Format quick-pick */}
                  <div>
                    <button
                      onClick={() => setShowFormatPicker((v) => !v)}
                      className="flex items-center gap-2 text-xs text-neutral-400 hover:text-foreground transition-colors mb-2"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      Load a format example
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFormatPicker ? "rotate-180" : ""}`} />
                    </button>
                    {showFormatPicker && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {FORMAT_EXAMPLES.map((f) => (
                          <button
                            key={f.label}
                            onClick={() => {
                              setImportPayload(f.snippet);
                              setImportContentType(f.contentType);
                              setShowFormatPicker(false);
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg border border-neutral-700 text-neutral-400 hover:text-foreground hover:border-sky-600/40 hover:bg-sky-600/5 transition-all"
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content-Type hint */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                      <FileText className="w-3 h-3 inline mr-1" />
                      Content-Type <span className="text-neutral-600">(optional — leave blank for auto-detection)</span>
                    </label>
                    <input
                      value={importContentType}
                      onChange={(e) => setImportContentType(e.target.value)}
                      placeholder="e.g. application/json, text/csv, text/yaml …"
                      className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-mono text-sky-400 placeholder:text-neutral-600 focus:outline-none focus:border-sky-600/50 transition-all"
                    />
                  </div>

                  {/* Payload textarea */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Raw Payload</label>
                    <textarea
                      value={importPayload}
                      onChange={(e) => setImportPayload(e.target.value)}
                      rows={10}
                      spellCheck={false}
                      className="w-full font-mono text-xs bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-3 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/20 transition-all resize-none leading-relaxed"
                      placeholder={"Paste data in any format:\n• JSON from a REST API\n• CSV from Salesforce or Excel\n• XML from SAP or an ERP\n• YAML / TOML config file\n• vCard from Outlook / phone\n• A forwarded email\n• Plain text description\n• Markdown from Notion …"}
                    />
                  </div>

                  <Button
                    onClick={handleImportSubmit}
                    disabled={importLoading || !importPayload.trim()}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-foreground font-bold py-6 rounded-xl shadow-lg shadow-sky-600/20 transition-all gap-2"
                  >
                    {importLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Classifying & Importing...</>
                    ) : (
                      <><Upload className="w-4 h-4" />Import & Onboard</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Result panel */}
              <Card className="glass border-neutral-800 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Import Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {!importResult && !importLoading && !importError && (
                    <div className="py-16 text-center">
                      <Upload className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-500 font-medium">No data imported yet</p>
                      <p className="text-sm text-neutral-600 mt-1 max-w-xs mx-auto">
                        Paste any external data on the left. Gemini will automatically detect the format, classify the entity, and onboard it.
                      </p>
                    </div>
                  )}

                  {importLoading && (
                    <div className="py-14 text-center space-y-4">
                      <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto" />
                      <p className="text-neutral-400 font-medium">Classifying with Gemini...</p>
                      <div className="space-y-1.5 text-left max-w-[180px] mx-auto">
                        {["Detecting format", "Extracting entity", "Friction scoring", "Writing to Supabase"].map((s, i) => (
                          <motion.p
                            key={s}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.25 }}
                            className="text-xs text-neutral-500 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block animate-pulse" />
                            {s}
                          </motion.p>
                        ))}
                      </div>
                    </div>
                  )}

                  {importError && (
                    <div className="py-8">
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-rose-400 font-medium mb-1">
                          <AlertCircle className="w-4 h-4" />Import Failed
                        </div>
                        <p className="text-sm text-rose-300">{importError}</p>
                      </div>
                    </div>
                  )}

                  {importSuccess && importResult && (
                    <div className="space-y-5">
                      <div className="bg-sky-600/10 border border-sky-600/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sky-500 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Successfully imported from {importResult.source_infrastructure}
                        </div>
                      </div>
                      <ImportResultDisplay result={importResult} />
                      <Button onClick={resetImport} variant="outline" className="w-full border-neutral-700 text-neutral-400 hover:text-foreground">
                        Import Another
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VerifyResultDisplay({ result }: { result: VerificationResult }) {
  const frictionColor =
    result.friction_score <= 3 ? "text-sky-500" :
      result.friction_score <= 6 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="space-y-4">
      <div className="text-center p-6 glass rounded-xl">
        <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Friction Score</p>
        <div className={`text-5xl font-bold ${frictionColor}`}>
          {result.friction_score}<span className="text-lg text-neutral-500">/10</span>
        </div>
      </div>
      {result.industry && (
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Industry</p>
          <Badge variant="outline" className="text-cyan-400 border-cyan-500/20 bg-cyan-500/10">{result.industry}</Badge>
        </div>
      )}
      {result.core_needs?.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Core Needs</p>
          <div className="flex flex-wrap gap-1.5">
            {result.core_needs.map((need, i) => (
              <Badge key={i} variant="outline" className="text-neutral-300 border-neutral-600">{need}</Badge>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">AI Analysis</p>
        <p className="text-sm text-neutral-300 leading-relaxed">{result.analysis_summary}</p>
      </div>
    </div>
  );
}

function ImportResultDisplay({ result }: { result: ImportResult }) {
  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-foreground">{result.name}</p>
          <Badge className={`text-xs border ${result.role === "mentor" ? "text-amber-400 border-amber-500/20 bg-amber-500/10" : "text-sky-500 border-sky-600/20 bg-sky-600/10"}`}>
            {result.role}
          </Badge>
        </div>
        <p className="text-sm text-neutral-400">{result.email}</p>
        <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
          <span className="text-xs text-neutral-500">Friction Capacity</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">{result.friction_capacity}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">Confidence</span>
          <span className="text-sm font-semibold text-sky-500 tabular-nums">{Math.round(result.confidence * 100)}%</span>
        </div>
      </div>
      {result.skills?.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Skills Extracted</p>
          <div className="flex flex-wrap gap-1.5">
            {result.skills.map((s) => (
              <Badge key={s} variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/20 bg-cyan-500/10">{s}</Badge>
            ))}
          </div>
        </div>
      )}
      {result.summary && (
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">AI Summary</p>
          <p className="text-sm text-neutral-300 leading-relaxed italic">"{result.summary}"</p>
        </div>
      )}
    </div>
  );
}
