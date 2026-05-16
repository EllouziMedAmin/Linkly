"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Brain,
  GitBranch,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface Programme {
  id: string;
  name: string;
  status: string;
  capacity: number;
  custom_fields?: { id: string; label: string; type: string; required: boolean }[];
}

interface AIEvaluation {
  score: number;
  reasoning: string;
  tags: string[];
  strengths: string[];
  weaknesses: string[];
  decision: string;
}

export default function ApplyPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [teamSize, setTeamSize] = useState(3);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [founderExperience, setFounderExperience] = useState("");
  const [pitchText, setPitchText] = useState("");
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    status: string;
    message: string;
    application_id?: string;
    ai_evaluation?: AIEvaluation;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/programmes")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProgrammes(d.data.filter((p: Programme) => p.status === "active"));
      });
  }, []);

  useEffect(() => {
    setCustomResponses({});
  }, [selectedProgramme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !email.trim() || !pitchText.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: teamName.trim(),
          contact_email: email.trim(),
          team_size: teamSize,
          linkedin_url: linkedinUrl.trim(),
          founder_experience: founderExperience.trim(),
          pitch_text: pitchText.trim(),
          custom_responses: customResponses,
          programme_id: selectedProgramme || undefined,
        }),
      });

      const data = await res.json();
      setResult({
        success: data.success,
        status: data.status || "error",
        message: data.message || data.error || "Something went wrong.",
        application_id: data.application_id,
        ai_evaluation: data.ai_evaluation,
        error: data.error,
      });
    } catch {
      setResult({
        success: false,
        status: "error",
        message: "Network error. Please try again.",
      });
    }

    setLoading(false);
  };

  const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
    accepted: { icon: CheckCircle, color: "text-sky-500", bg: "bg-sky-600/10 border-sky-600/20" },
    rejected: { icon: XCircle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
    pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    waitlisted: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    error: { icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Gradient BG */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(139,92,246,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.08),transparent_50%)]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-400 flex items-center justify-center shadow-lg shadow-sky-600/20">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold">El-Rojla-Bwai</span>
        </Link>
        <div className="flex gap-3">
          <Link href="/apply/status" className="text-sm text-slate-500 dark:text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-200 dark:border-slate-800">
            Check Status
          </Link>
          <Link href="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-200 dark:border-slate-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-sm text-violet-400 font-medium">AI-Powered Screening</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">Apply to the Ecosystem</h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Submit your application and our AI will evaluate your team instantly. Top applications are auto-accepted.
            </p>
          </div>

          {/* Show Result */}
          {result ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <Card className={`glass rounded-2xl border ${statusConfig[result.status]?.bg || statusConfig.error.bg}`}>
                <CardContent className="pt-8 pb-8 text-center space-y-6">
                  {/* Status Icon */}
                  {(() => {
                    const cfg = statusConfig[result.status] || statusConfig.error;
                    const Icon = cfg.icon;
                    return <Icon className={`w-16 h-16 mx-auto ${cfg.color}`} />;
                  })()}

                  {/* Status Text */}
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {result.status === "accepted" && "🎉 You're In!"}
                      {result.status === "rejected" && "Application Not Accepted"}
                      {result.status === "pending" && "Under Review"}
                      {result.status === "waitlisted" && "Waitlisted"}
                      {result.status === "error" && "Error"}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300">{result.message}</p>
                  </div>

                  {/* Application ID */}
                  {result.application_id && (
                    <div className="glass rounded-xl p-4 max-w-sm mx-auto">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Application ID</p>
                      <p className="text-sm font-mono text-white break-all">{result.application_id}</p>
                    </div>
                  )}

                  {/* AI Score */}
                  {result.ai_evaluation && (
                    <div className="space-y-4 text-left max-w-md mx-auto">
                      {/* Score */}
                      <div className="glass rounded-xl p-5 text-center">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">AI Quality Score</p>
                        <div className={`text-5xl font-bold ${
                          result.ai_evaluation.score >= 80 ? 'text-sky-500' :
                          result.ai_evaluation.score >= 60 ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>
                          {result.ai_evaluation.score}
                          <span className="text-lg text-neutral-500">/100</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {result.ai_evaluation.tags?.length > 0 && (
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Detected Categories</p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.ai_evaluation.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-cyan-400 border-cyan-500/20 bg-cyan-500/10">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strengths */}
                      {result.ai_evaluation.strengths?.length > 0 && (
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">✅ Strengths</p>
                          <ul className="space-y-1">
                            {result.ai_evaluation.strengths.map((s, i) => (
                              <li key={i} className="text-sm text-emerald-300 flex items-start gap-2">
                                <span className="text-sky-600 mt-0.5">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {result.ai_evaluation.weaknesses?.length > 0 && (
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">⚠️ Areas to Improve</p>
                          <ul className="space-y-1">
                            {result.ai_evaluation.weaknesses.map((w, i) => (
                              <li key={i} className="text-sm text-amber-300 flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Reasoning */}
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">AI Reasoning</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{result.ai_evaluation.reasoning}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      onClick={() => setResult(null)}
                      variant="outline"
                      className="border-neutral-700 text-slate-500 dark:text-slate-400 hover:text-white"
                    >
                      Submit Another
                    </Button>
                    <Link href="/apply/status">
                      <Button className="bg-violet-500 hover:bg-violet-600 text-white font-bold gap-2">
                        Check Status Page
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* Application Form */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Form */}
              <Card className="glass border-slate-200 dark:border-slate-800 rounded-2xl lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-violet-400" />
                    Application Form
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Programme Select */}
                    {programmes.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Programme</label>
                        <select
                          value={selectedProgramme}
                          onChange={(e) => setSelectedProgramme(e.target.value)}
                          className="w-full bg-slate-200 dark:border-slate-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 appearance-none"
                        >
                          <option value="">Open Application (No specific programme)</option>
                          {programmes.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Team Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Team / Company Name *</label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full bg-slate-200 dark:border-slate-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                        placeholder="e.g., TechWave Solutions"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Contact Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-200 dark:border-slate-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                        placeholder="team@example.com"
                        required
                      />
                    </div>

                    {/* Team Size */}
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Team Size</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={teamSize}
                        onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-200 dark:border-slate-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                      />
                    </div>

                    {/* LinkedIn */}
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">LinkedIn Profile (Optional)</label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full bg-slate-200 dark:border-slate-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>

                    {/* Founder Experience */}
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                        Founder Experience / CV Summary (Optional)
                      </label>
                      <textarea
                        value={founderExperience}
                        onChange={(e) => setFounderExperience(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-200 dark:border-slate-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
                        placeholder="Briefly describe the team's past experience, previous startups, or relevant background..."
                      />
                    </div>

                    {/* Dynamic Custom Fields */}
                    {selectedProgramme && programmes.find(p => p.id === selectedProgramme)?.custom_fields?.map((field) => (
                      <div key={field.id} className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                        <label className="block text-sm font-medium text-violet-300 mb-2">
                          {field.label} {field.required && '*'}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={customResponses[field.id] || ''}
                            onChange={(e) => setCustomResponses({ ...customResponses, [field.id]: e.target.value })}
                            required={field.required}
                            rows={3}
                            className="w-full bg-slate-200 dark:border-slate-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
                          />
                        ) : (
                          <input
                            type={field.type === 'url' ? 'url' : field.type === 'number' ? 'number' : 'text'}
                            value={customResponses[field.id] || ''}
                            onChange={(e) => setCustomResponses({ ...customResponses, [field.id]: e.target.value })}
                            required={field.required}
                            className="w-full bg-slate-200 dark:border-slate-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                          />
                        )}
                      </div>
                    ))}

                    {/* Pitch */}
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                        Pitch / Application Text *
                      </label>
                      <textarea
                        value={pitchText}
                        onChange={(e) => setPitchText(e.target.value)}
                        rows={6}
                        className="w-full bg-slate-200 dark:border-slate-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
                        placeholder="Describe your team, your idea, what problem you're solving, and why you should be selected..."
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !teamName.trim() || !email.trim() || !pitchText.trim()}
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-bold py-6 rounded-xl shadow-lg shadow-violet-500/20 transition-all gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI is evaluating your application...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Side Info */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="glass border-slate-200 dark:border-slate-800 rounded-2xl">
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Brain className="w-4 h-4 text-violet-400" />
                      How It Works
                    </h3>
                    <div className="space-y-3">
                      {[
                        { step: "1", text: "Submit your application with your pitch" },
                        { step: "2", text: "Gemini AI evaluates quality, innovation, and feasibility" },
                        { step: "3", text: "Score ≥ 80: Auto-accepted instantly" },
                        { step: "4", text: "Score 40-79: Manual review by admin" },
                        { step: "5", text: "Score < 40: Not accepted" },
                      ].map((item) => (
                        <div key={item.step} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {item.step}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-slate-200 dark:border-slate-800 rounded-2xl">
                  <CardContent className="pt-6 space-y-3">
                    <h3 className="font-bold text-white">Already Applied?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Check your application status anytime using your email.</p>
                    <Link href="/apply/status">
                      <Button variant="outline" className="w-full border-neutral-700 text-slate-500 dark:text-slate-400 hover:text-white gap-2 mt-2">
                        <Clock className="w-4 h-4" />
                        Check My Status
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
