"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  GitBranch,
  ArrowLeft,
  Mail,
} from "lucide-react";

interface ApplicationStatus {
  id: string;
  team_name: string;
  status: string;
  score: number;
  reasoning: string;
  tags: string[];
  applied_at: string;
  reviewed_at: string | null;
}

export default function StatusPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<ApplicationStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    setApplications(null);

    try {
      const res = await fetch(`/api/apply/status?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();

      if (data.success) {
        setApplications(data.applications);
      } else {
        setError(data.error || "No application found.");
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  };

  const statusConfig: Record<string, { icon: any; color: string; label: string; bg: string }> = {
    accepted: { icon: CheckCircle, color: "text-sky-500", label: "Accepted", bg: "bg-sky-600/10 border-sky-600/20" },
    rejected: { icon: XCircle, color: "text-rose-400", label: "Not Accepted", bg: "bg-rose-500/10 border-rose-500/20" },
    pending: { icon: Clock, color: "text-amber-400", label: "Under Review", bg: "bg-amber-500/10 border-amber-500/20" },
    waitlisted: { icon: Clock, color: "text-blue-400", label: "Waitlisted", bg: "bg-blue-500/10 border-blue-500/20" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.1),transparent_50%)]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-400 flex items-center justify-center shadow-lg shadow-sky-600/20">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold">El-Rojla-Bwai</span>
        </Link>
        <div className="flex gap-3">
          <Link href="/apply" className="text-sm text-slate-500 dark:text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-200 dark:border-slate-800">
            Apply Now
          </Link>
          <Link href="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-200 dark:border-slate-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">Check Application Status</h1>
            <p className="text-slate-500 dark:text-slate-400">Enter your email to see your application status and AI evaluation.</p>
          </div>

          {/* Search Form */}
          <Card className="glass border-slate-200 dark:border-slate-800 rounded-2xl mb-8">
            <CardContent className="pt-6">
              <form onSubmit={checkStatus} className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-200 dark:border-slate-800/50 border border-neutral-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-sky-600/50 focus:ring-1 focus:ring-sky-600/20 transition-all"
                    placeholder="Enter your application email..."
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl gap-2 px-6 py-3"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Check
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="glass border-rose-500/20 rounded-2xl">
                <CardContent className="py-8 text-center">
                  <XCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-300">{error}</p>
                  <Link href="/apply">
                    <Button className="mt-4 bg-violet-500 hover:bg-violet-600 text-white font-bold gap-2">
                      Apply Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Results */}
          {applications && applications.length > 0 && (
            <div className="space-y-4">
              {applications.map((app) => {
                const cfg = statusConfig[app.status] || statusConfig.pending;
                const Icon = cfg.icon;

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`glass rounded-2xl border ${cfg.bg}`}>
                      <CardContent className="py-6 space-y-5">
                        {/* Top row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className={`w-8 h-8 ${cfg.color}`} />
                            <div>
                              <h3 className="text-lg font-bold text-white">{app.team_name}</h3>
                              <p className="text-xs text-neutral-500">
                                Applied {new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`${cfg.bg} ${cfg.color} text-sm font-bold px-4 py-1`}>
                              {cfg.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="flex items-center gap-6">
                          <div className="glass rounded-xl px-6 py-3 text-center">
                            <p className="text-xs text-neutral-500 mb-1">AI Score</p>
                            <p className={`text-3xl font-bold ${
                              app.score >= 80 ? 'text-sky-500' :
                              app.score >= 60 ? 'text-amber-400' :
                              'text-rose-400'
                            }`}>
                              {app.score}<span className="text-sm text-neutral-500">/100</span>
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{app.reasoning}</p>
                          </div>
                        </div>

                        {/* Tags */}
                        {app.tags && app.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {app.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-cyan-400 border-cyan-500/20 bg-cyan-500/10 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Reviewed timestamp */}
                        {app.reviewed_at && (
                          <p className="text-xs text-neutral-500">
                            Reviewed: {new Date(app.reviewed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
