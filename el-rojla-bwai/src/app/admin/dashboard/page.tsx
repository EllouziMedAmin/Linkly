"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ShieldAlert,
  Zap,
  Wand2,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from "lucide-react";
import { EcosystemGraph } from "@/components/EcosystemGraph";

interface Linkage {
  id: string;
  friction_allocation: number;
  health_score: number;
  grant_lock_status: boolean;
  status: string;
  entity_a: { name: string } | null;
  entity_b: { name: string } | null;
}

export default function AdminDashboard() {
  const [linkages, setLinkages] = useState<Linkage[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [pulsingId, setPulsingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch Linkages
  const fetchLinkages = useCallback(async () => {
    const { data, error } = await supabase
      .from("linkages")
      .select(
        `
        id,
        friction_allocation,
        health_score,
        grant_lock_status,
        status,
        entity_a:profiles!linkages_entity_a_id_fkey(name),
        entity_b:profiles!linkages_entity_b_id_fkey(name)
      `
      )
      .order("health_score", { ascending: true });

    if (!error && data) {
      setLinkages(data as any);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLinkages();

    // Real-time subscription: listen for linkage changes
    const channel = supabase
      .channel("linkages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "linkages" },
        () => {
          fetchLinkages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLinkages]);

  // Run Bipartite Matching
  const runMatchEngine = async () => {
    setMatching(true);
    setMessage(null);
    try {
      const res = await fetch("/api/match", { method: "POST" });
      const result = await res.json();
      setMessage(result.message);
      await fetchLinkages();
    } catch {
      setMessage("Match Engine Failed. Check console.");
    }
    setMatching(false);
  };

  // Trigger Pulse (inline, no page reload)
  const triggerPulse = async (
    linkageId: string,
    status: "green" | "yellow" | "red"
  ) => {
    setPulsingId(linkageId);
    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkage_id: linkageId, status }),
      });
      const result = await res.json();
      if (result.success) {
        // Update the specific linkage in state immediately
        setLinkages((prev) =>
          prev.map((l) =>
            l.id === linkageId
              ? {
                  ...l,
                  health_score: result.data.health_score,
                  grant_lock_status: result.data.grant_lock_status,
                  status: result.data.status,
                }
              : l
          )
        );
      }
    } catch (err) {
      console.error("Pulse failed:", err);
    }
    setPulsingId(null);
  };

  // Reset all linkages
  const resetLinkages = async () => {
    if (!confirm("This will delete ALL linkages. Continue?")) return;
    setMessage(null);
    try {
      await fetch("/api/linkages", { method: "DELETE" });
      setLinkages([]);
      setMessage("All linkages cleared. Run the matching engine again.");
    } catch {
      setMessage("Failed to reset linkages.");
    }
  };

  // Stats
  const totalLinkages = linkages.length;
  const avgHealth =
    totalLinkages > 0
      ? (
          linkages.reduce((acc, l) => acc + l.health_score, 0) / totalLinkages
        ).toFixed(1)
      : "0.0";
  const lockedGrants = linkages.filter((l) => l.grant_lock_status).length;

  // Health color helper
  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-sky-500";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return "bg-sky-600";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
            Global Ecosystem Dashboard
          </h1>
          <p className="text-neutral-400 text-sm">
            Live data from Supabase · Cradle Governance active · Real-time
            updates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={resetLinkages}
            variant="outline"
            className="border-neutral-700 text-neutral-400 hover:text-foreground hover:border-neutral-600 gap-2"
            size="sm"
          >
            <Trash2 className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={runMatchEngine}
            disabled={matching}
            className="bg-sky-600 hover:bg-sky-700 text-foreground font-bold px-6 rounded-xl shadow-lg shadow-sky-600/20 transition-all gap-3"
          >
            <Wand2
              className={`w-4 h-4 ${matching ? "animate-spin" : ""}`}
            />
            {matching
              ? "Computing Optimization..."
              : "Run Bipartite Matching"}
          </Button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-neutral-300 flex items-center justify-between">
          <span>{message}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-neutral-500 hover:text-foreground ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-neutral-800 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Total Active Linkages
            </CardTitle>
            <Activity className="w-4 h-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {totalLinkages}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-neutral-800 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Average Health
            </CardTitle>
            <Zap className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getHealthColor(parseFloat(avgHealth))}`}>
              {avgHealth}%
            </div>
          </CardContent>
        </Card>

        <Card
          className={`glass rounded-2xl ${
            lockedGrants > 0
              ? "border-rose-500/30 animate-pulse-glow"
              : "border-neutral-800"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-400">
              Cradle Grants Locked
            </CardTitle>
            <ShieldAlert
              className={`w-4 h-4 ${
                lockedGrants > 0
                  ? "text-rose-400 animate-pulse"
                  : "text-neutral-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-400">
              {lockedGrants}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ecosystem Graph */}
      <Card className="glass border-neutral-800 rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-foreground">
            Interactive Ecosystem Graph
          </CardTitle>
          <p className="text-xs text-neutral-500">
            Drag nodes to reorganize · Green = healthy · Red = grant locked
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <EcosystemGraph linkages={linkages} />
        </CardContent>
      </Card>

      {/* Linkages Table */}
      <Card className="glass border-neutral-800 rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-foreground">
              Live Linkage Monitor
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchLinkages}
              className="text-neutral-400 hover:text-foreground gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <RefreshCw className="w-6 h-6 text-neutral-500 animate-spin mx-auto mb-3" />
              <p className="text-neutral-400">Fetching live data...</p>
            </div>
          ) : linkages.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-neutral-700 rounded-xl bg-neutral-900/30">
              <Wand2 className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
              <p className="text-neutral-400 font-medium">
                No linkages generated yet
              </p>
              <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
                Click &quot;Run Bipartite Matching&quot; above to execute the AI
                algorithm on your profiles.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-neutral-800">
                  <TableRow className="hover:bg-transparent border-neutral-800">
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider">
                      Startup
                    </TableHead>
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider">
                      Mentor
                    </TableHead>
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider">
                      Friction
                    </TableHead>
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider">
                      Health
                    </TableHead>
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider">
                      Actions
                    </TableHead>
                    <TableHead className="text-neutral-400 text-xs uppercase tracking-wider text-right">
                      Grant Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkages.map((linkage) => (
                    <TableRow
                      key={linkage.id}
                      className={`border-neutral-800 transition-colors ${
                        linkage.grant_lock_status
                          ? "bg-rose-500/5 hover:bg-rose-500/10"
                          : "hover:bg-neutral-800/30"
                      }`}
                    >
                      <TableCell className="font-medium text-foreground">
                        {linkage.entity_a?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-neutral-300">
                        {linkage.entity_b?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-amber-400 border-amber-400/20 bg-amber-400/5 font-mono text-xs"
                        >
                          {linkage.friction_allocation}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <div className="w-16 h-2 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full health-bar ${getHealthBg(
                                linkage.health_score
                              )}`}
                              style={{
                                width: `${linkage.health_score}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`text-sm font-semibold tabular-nums ${getHealthColor(
                              linkage.health_score
                            )}`}
                          >
                            {linkage.health_score}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => triggerPulse(linkage.id, "green")}
                            disabled={pulsingId === linkage.id}
                            className="p-1.5 rounded-lg bg-sky-600/10 text-sky-500 hover:bg-sky-600/20 transition-colors disabled:opacity-50"
                            title="Good meeting — health +5"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerPulse(linkage.id, "red")}
                            disabled={pulsingId === linkage.id}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                            title="Bad meeting — health -20"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {linkage.grant_lock_status ? (
                          <Badge className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 animate-pulse">
                            🔒 LOCKED
                          </Badge>
                        ) : (
                          <Badge className="bg-sky-600/10 text-sky-500 hover:bg-sky-600/20 border border-sky-600/20">
                            ✓ Disbursing
                          </Badge>
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
