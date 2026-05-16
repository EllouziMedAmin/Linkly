"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
  Globe,
  Table2,
  StickyNote,
  Upload,
  Building2,
  Users,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";

// ─── Data source options ──────────────────────────────────────────────────────

const DATA_SOURCES = [
  {
    id: "manual",
    label: "Fill manually",
    description: "Type your profile details directly",
    icon: FileText,
    color: "text-sky-500",
    bg: "bg-sky-500/10 border-sky-500/20 hover:border-sky-500/50",
    active: "border-sky-500 bg-sky-500/15",
  },
  {
    id: "sheets",
    label: "Google Sheets",
    description: "Paste your sheet URL — we fetch and parse it automatically",
    icon: Table2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50",
    active: "border-emerald-500 bg-emerald-500/15",
  },
  {
    id: "notion",
    label: "Notion",
    description: "Paste content exported from your Notion workspace",
    icon: StickyNote,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20 hover:border-violet-500/50",
    active: "border-violet-500 bg-violet-500/15",
  },
  {
    id: "airtable",
    label: "Airtable",
    description: "Paste an Airtable CSV export or JSON record",
    icon: Globe,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20 hover:border-orange-500/50",
    active: "border-orange-500 bg-orange-500/15",
  },
  {
    id: "upload",
    label: "Upload / Paste",
    description: "CSV, XML, YAML, vCard, JSON, email — any format",
    icon: Upload,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50",
    active: "border-amber-500 bg-amber-500/15",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface FirstTimeSetupProps {
  entityType: "company" | "mentor";
  onComplete: (profile: any) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FirstTimeSetup({ entityType, onComplete }: FirstTimeSetupProps) {
  const [step, setStep] = useState<"choose" | "configure" | "processing" | "done">("choose");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Manual fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  // External source fields
  const [sheetUrl, setSheetUrl] = useState("");
  const [rawData, setRawData] = useState("");
  const [contentType, setContentType] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const EntityIcon = entityType === "company" ? Building2 : Users;
  const entityLabel = entityType === "company" ? "Company" : "Mentor";

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      let body: string;
      let headers: Record<string, string> = {};

      if (selectedSource === "manual") {
        body = JSON.stringify({
          name,
          email,
          role: entityType,
          notes,
        });
        headers["Content-Type"] = "application/json";
      } else if (selectedSource === "sheets") {
        body = JSON.stringify({ sheet_url: sheetUrl });
        headers["Content-Type"] = "application/json";
        // Use sheets-specific endpoint
        const res = await fetch("/api/pipeline/sheets", {
          method: "POST",
          headers: { ...headers, "X-Linkly-API-Key": "lnk_magic_partner_6t4z9n" },
          body,
        });
        const data = await res.json();
        if (data.success) { setResult(data); setStep("done"); onComplete(data.data); }
        else setError(data.error || data.message || "Import failed.");
        setLoading(false);
        return;
      } else {
        body = rawData;
        if (contentType) headers["Content-Type"] = contentType;
      }

      // Generic ingest for all other sources
      const res = await fetch("/api/ingest", { method: "POST", headers, body });
      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data);
        setStep("done");
        onComplete(data.data);
      } else {
        setError(data.error || data.message || "Import failed.");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {/* STEP 1: Choose data source */}
          {step === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
                  <EntityIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-foreground">Welcome to Linkly</h1>
                  <p className="text-neutral-400 text-sm mt-1">
                    Let's set up your <span className="text-foreground font-medium">{entityLabel}</span> profile.
                    How would you like to add your information?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {DATA_SOURCES.map((source) => {
                  const Icon = source.icon;
                  const isSelected = selectedSource === source.id;
                  return (
                    <button
                      key={source.id}
                      onClick={() => setSelectedSource(source.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                        isSelected ? source.active : source.bg
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-white/10" : "bg-neutral-900"}`}>
                        <Icon className={`w-5 h-5 ${source.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{source.label}</p>
                        <p className="text-xs text-neutral-500 truncate">{source.description}</p>
                      </div>
                      {isSelected && <CheckCircle className={`w-5 h-5 shrink-0 ${source.color}`} />}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => { if (selectedSource) setStep("configure"); }}
                disabled={!selectedSource}
                className="w-full bg-sky-600 hover:bg-sky-700 text-foreground font-bold py-3 rounded-xl gap-2 shadow-lg shadow-sky-600/20"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 2: Configure source */}
          {step === "configure" && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-5"
            >
              <div>
                <button onClick={() => setStep("choose")} className="text-xs text-neutral-500 hover:text-neutral-300 mb-4 flex items-center gap-1">
                  ← Back
                </button>
                <h2 className="text-xl font-extrabold text-foreground">
                  {DATA_SOURCES.find(s => s.id === selectedSource)?.label}
                </h2>
                <p className="text-sm text-neutral-400 mt-1">
                  {DATA_SOURCES.find(s => s.id === selectedSource)?.description}
                </p>
              </div>

              {/* Manual */}
              {selectedSource === "manual" && (
                <div className="space-y-4">
                  <Field label={`${entityLabel} Name`} value={name} onChange={setName} placeholder={entityType === "company" ? "e.g. AquaTech Solutions" : "e.g. Dr. Ahmad Faris"} />
                  <Field label="Email" value={email} onChange={setEmail} placeholder="contact@example.com" type="email" />
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      {entityType === "company" ? "Pitch / Description" : "Background & Expertise"}
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={4}
                      className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-neutral-600 focus:outline-none focus:border-sky-600/50 resize-none transition-all"
                      placeholder={entityType === "company" ? "Describe your startup, what problem you solve, current stage..." : "Your areas of expertise, industries, mentoring style..."}
                    />
                  </div>
                </div>
              )}

              {/* Google Sheets */}
              {selectedSource === "sheets" && (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-xs text-emerald-400 font-medium mb-1 flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5" /> How to share your Google Sheet
                    </p>
                    <p className="text-xs text-neutral-400">
                      Open your sheet → Share → Change to "Anyone with the link" → Copy the link and paste it below.
                    </p>
                  </div>
                  <Field
                    label="Google Sheets URL"
                    value={sheetUrl}
                    onChange={setSheetUrl}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                </div>
              )}

              {/* Notion */}
              {selectedSource === "notion" && (
                <div className="space-y-4">
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                    <p className="text-xs text-violet-400 font-medium mb-1">Export from Notion</p>
                    <p className="text-xs text-neutral-400">
                      Open your Notion page → ··· menu → Export → Export as Markdown. Paste the content below.
                    </p>
                  </div>
                  <RawDataField value={rawData} onChange={setRawData} ctValue={contentType} onCtChange={setContentType} defaultCt="text/markdown" placeholder="Paste Notion export content here..." />
                </div>
              )}

              {/* Airtable */}
              {selectedSource === "airtable" && (
                <div className="space-y-4">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                    <p className="text-xs text-orange-400 font-medium mb-1">Export from Airtable</p>
                    <p className="text-xs text-neutral-400">
                      Open your Airtable base → Download CSV, or copy a record's JSON. Paste below.
                    </p>
                  </div>
                  <RawDataField value={rawData} onChange={setRawData} ctValue={contentType} onCtChange={setContentType} defaultCt="text/csv" placeholder="Paste Airtable CSV or JSON export..." />
                </div>
              )}

              {/* Upload / Paste */}
              {selectedSource === "upload" && (
                <RawDataField
                  value={rawData}
                  onChange={setRawData}
                  ctValue={contentType}
                  onCtChange={setContentType}
                  defaultCt=""
                  placeholder={"Paste data in any format:\n• JSON from a REST API\n• CSV from Excel or Google Sheets\n• XML from SAP or an ERP\n• vCard from Outlook / phone\n• A forwarded email\n• YAML, TOML, plain text…"}
                />
              )}

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                  <p className="text-xs text-rose-400 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" />{error}</p>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={loading || (selectedSource === "sheets" ? !sheetUrl.trim() : selectedSource === "manual" ? !name.trim() || !email.trim() : !rawData.trim())}
                className="w-full bg-sky-600 hover:bg-sky-700 text-foreground font-bold py-3 rounded-xl gap-2 shadow-lg shadow-sky-600/20"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Importing & Classifying...</> : <><Sparkles className="w-4 h-4" />Complete Setup</>}
              </Button>
            </motion.div>
          )}

          {/* STEP 3: Done */}
          {step === "done" && result && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-sky-600/10 border border-sky-600/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-sky-500" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-foreground mb-2">You're in!</h2>
                <p className="text-neutral-400 text-sm">Your profile has been added to the ecosystem.</p>
              </div>

              <div className="glass rounded-2xl p-5 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{result.data?.name}</span>
                  <Badge className={`text-xs border ${result.data?.role === "mentor" ? "text-amber-400 border-amber-500/20 bg-amber-500/10" : "text-sky-500 border-sky-600/20 bg-sky-600/10"}`}>
                    {result.data?.role}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-400">{result.data?.email}</p>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <span className="text-xs text-neutral-500">Friction Capacity</span>
                  <span className="text-xs font-semibold text-foreground">{result.data?.friction_capacity}</span>
                </div>
                {result.classification?.standardized_entity?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.classification.standardized_entity.skills.map((s: string) => (
                      <Badge key={s} variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/20 bg-cyan-500/10">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-neutral-500">
                You'll be matched with the best{" "}
                {entityType === "company" ? "mentors" : "startups"} by our bipartite engine shortly.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-neutral-600 focus:outline-none focus:border-sky-600/50 transition-all"
      />
    </div>
  );
}

function RawDataField({ value, onChange, ctValue, onCtChange, defaultCt, placeholder }: any) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          Content-Type <span className="text-neutral-600">(optional — leave blank for auto-detection)</span>
        </label>
        <input
          value={ctValue || defaultCt}
          onChange={e => onCtChange(e.target.value)}
          placeholder="e.g. text/csv, application/json, text/yaml"
          className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs font-mono text-sky-400 placeholder:text-neutral-600 focus:outline-none focus:border-sky-600/50 transition-all"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">Data</label>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={10}
          spellCheck={false}
          className="w-full font-mono text-xs bg-neutral-950/50 border border-neutral-700 rounded-xl px-4 py-3 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-sky-600/50 resize-none leading-relaxed transition-all"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
