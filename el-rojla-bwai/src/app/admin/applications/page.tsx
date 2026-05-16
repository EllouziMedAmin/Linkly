"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Users,
  Trophy,
  AlertTriangle,
  RefreshCw,
  Inbox,
} from "lucide-react";

interface Application {
  id: string;
  team_name: string;
  contact_email: string;
  team_size: number;
  linkedin_url: string;
  founder_experience: string;
  ai_score: number;
  ai_reasoning: string;
  ai_tags: string[];
  custom_responses?: Record<string, string>;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchApps = useCallback(async () => {
    const url = filter === "all" ? "/api/apply" : `/api/apply?status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) setApplications(data.data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchApps();
  }, [fetchApps]);

  const makeDecision = async (appId: string, decision: "accepted" | "rejected" | "waitlisted") => {
    setDeciding(appId);
    try {
      const res = await fetch("/api/apply/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: appId, decision }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: decision, reviewed_at: new Date().toISOString() } : a))
        );
      }
    } catch (err) {
      console.error("Decision error:", err);
    }
    setDeciding(null);
  };

  // Stats
  const total = applications.length;
  const accepted = applications.filter((a) => a.status === "accepted").length;
  const pending = applications.filter((a) => a.status === "pending").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-sky-500";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  const statusBadge: Record<string, { color: string; label: string }> = {
    accepted: { color: "bg-sky-600/10 text-sky-500 border-sky-600/20", label: "✓ Accepted" },
    rejected: { color: "bg-rose-500/10 text-rose-400 border-rose-500/20", label: "✗ Rejected" },
    pending: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "⏳ Pending" },
    waitlisted: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "📋 Waitlisted" },
  };

  const filters = [
    { key: "all", label: "All", count: total },
    { key: "pending", label: "Pending", count: pending },
    { key: "accepted", label: "Accepted", count: accepted },
    { key: "rejected", label: "Rejected", count: rejected },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
            Application Review
          </h1>
          <p className="text-neutral-400 text-sm">
            AI-scored applications ranked by quality. Accept, reject, or waitlist with one click.
          </p>
        </div>
        <Button variant="ghost" onClick={fetchApps} className="text-neutral-400 hover:text-foreground gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass border-neutral-800 rounded-2xl">
          <CardContent className="py-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-neutral-400" />
            <div>
              <p className="text-2xl font-bold text-foreground">{total}</p>
              <p className="text-xs text-neutral-500">Total Applications</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-neutral-800 rounded-2xl">
          <CardContent className="py-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-2xl font-bold text-amber-400">{pending}</p>
              <p className="text-xs text-neutral-500">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-neutral-800 rounded-2xl">
          <CardContent className="py-4 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-sky-500" />
            <div>
              <p className="text-2xl font-bold text-sky-500">{accepted}</p>
              <p className="text-xs text-neutral-500">Accepted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-neutral-800 rounded-2xl">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <div>
              <p className="text-2xl font-bold text-rose-400">{rejected}</p>
              <p className="text-xs text-neutral-500">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.key
                ? "bg-sky-600/10 text-sky-500 border border-sky-600/20"
                : "text-neutral-400 hover:text-foreground hover:bg-neutral-800/50"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="glass border-neutral-800 rounded-2xl">
        <CardContent className="pt-0">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 text-neutral-500 animate-spin mx-auto mb-3" />
              <p className="text-neutral-400">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400 font-medium">No applications yet</p>
              <p className="text-sm text-neutral-500 mt-1">Share your /apply page to start receiving applications.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-neutral-800">
                  <TableRow className="hover:bg-transparent border-neutral-800">
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider">Team</TableHead>
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider">Email</TableHead>
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider">AI Score</TableHead>
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider">Tags</TableHead>
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider">AI Reasoning</TableHead>
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id} className="border-neutral-800 hover:bg-neutral-800/20 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{app.team_name}</p>
                          <p className="text-xs text-neutral-500">{app.team_size} members</p>
                          {app.linkedin_url && (
                            <a href={app.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                              LinkedIn ↗
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-300 align-top">
                        <div className="mb-1">{app.contact_email}</div>
                        {app.founder_experience && (
                          <p className="text-xs text-neutral-500 max-w-[150px] truncate" title={app.founder_experience}>
                            {app.founder_experience}
                          </p>
                        )}
                        {app.custom_responses && Object.keys(app.custom_responses).length > 0 && (
                          <div className="mt-2 space-y-1">
                            {Object.entries(app.custom_responses).map(([key, value]) => (
                              <p key={key} className="text-xs text-neutral-400 max-w-[200px] truncate" title={value as string}>
                                <span className="font-semibold text-neutral-500">{key}:</span> {value as string}
                              </p>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xl font-bold tabular-nums ${getScoreColor(app.ai_score)}`}>
                          {app.ai_score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {(app.ai_tags || []).slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/20 bg-cyan-500/10">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-neutral-400 max-w-[200px] truncate" title={app.ai_reasoning}>
                          {app.ai_reasoning}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusBadge[app.status]?.color || ""} border text-xs`}>
                          {statusBadge[app.status]?.label || app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {app.status === "pending" || app.status === "waitlisted" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => makeDecision(app.id, "accepted")}
                              disabled={deciding === app.id}
                              className="p-1.5 rounded-lg bg-sky-600/10 text-sky-500 hover:bg-sky-600/20 transition-colors disabled:opacity-50"
                              title="Accept"
                            >
                              {deciding === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => makeDecision(app.id, "waitlisted")}
                              disabled={deciding === app.id}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                              title="Waitlist"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => makeDecision(app.id, "rejected")}
                              disabled={deciding === app.id}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-500">Decided</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
