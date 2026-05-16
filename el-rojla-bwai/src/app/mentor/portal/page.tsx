"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  GitBranch,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ArrowLeft,
  Activity,
  Loader2,
} from "lucide-react";

interface Linkage {
  id: string;
  friction_allocation: number;
  health_score: number;
  grant_lock_status: boolean;
  status: string;
  entity_a: { id: string; name: string } | null;
  entity_b: { id: string; name: string } | null;
}

interface Mentor {
  id: string;
  name: string;
  email: string;
  friction_capacity: number;
  linkages: Linkage[];
  usedFriction: number;
}

export default function MentorPortal() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulsingId, setPulsingId] = useState<string | null>(null);

  const fetchData = async () => {
    const profRes = await fetch("/api/profiles?role=mentor");
    const profData = await profRes.json();

    const linkRes = await fetch("/api/linkages");
    const linkData = await linkRes.json();

    if (profData.success && linkData.success) {
      const linkages: Linkage[] = linkData.data || [];
      const enriched = (profData.data || []).map((mentor: any) => {
        const mentorLinkages = linkages.filter(
          (l: Linkage) => l.entity_b?.id === mentor.id
        );
        const usedFriction = mentorLinkages.reduce(
          (acc: number, l: Linkage) => acc + (l.friction_allocation || 0),
          0
        );
        return {
          ...mentor,
          linkages: mentorLinkages,
          usedFriction,
        };
      });
      setMentors(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        // Update local state
        setMentors((prev) =>
          prev.map((m) => ({
            ...m,
            linkages: m.linkages.map((l) =>
              l.id === linkageId
                ? {
                    ...l,
                    health_score: result.data.health_score,
                    grant_lock_status: result.data.grant_lock_status,
                    status: result.data.status,
                  }
                : l
            ),
          }))
        );
      }
    } catch (err) {
      console.error("Pulse failed:", err);
    }
    setPulsingId(null);
  };

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-slate-200 dark:border-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Mentor Portal</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage your startups, submit pulse checks, monitor friction
              </p>
            </div>
          </div>
          <Link
            href="/admin/dashboard"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-200 dark:border-slate-800"
          >
            Admin Dashboard →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        {loading ? (
          <div className="py-20 text-center">
            <Activity className="w-8 h-8 text-neutral-500 animate-pulse mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Loading mentors...</p>
          </div>
        ) : mentors.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-neutral-700 rounded-2xl">
            <Users className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              No mentors registered yet
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              Run the Synthetic Simulator to seed mentor profiles.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {mentors.map((mentor) => {
              const capacityPercent = mentor.friction_capacity > 0
                ? Math.min(100, (mentor.usedFriction / mentor.friction_capacity) * 100)
                : 0;
              const isOverloaded = capacityPercent > 80;

              return (
                <Card
                  key={mentor.id}
                  className="glass border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-400 flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">
                            {mentor.name}
                          </CardTitle>
                          <p className="text-xs text-neutral-500">
                            {mentor.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-500 mb-1">
                          Friction Capacity
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-neutral-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOverloaded ? "bg-rose-500" : "bg-sky-600"
                              }`}
                              style={{ width: `${capacityPercent}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-mono ${
                              isOverloaded
                                ? "text-rose-400"
                                : "text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {mentor.usedFriction}/{mentor.friction_capacity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {mentor.linkages.length === 0 ? (
                      <div className="py-4 text-center border border-dashed border-neutral-700 rounded-xl">
                        <p className="text-sm text-neutral-500">
                          No startups assigned yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mentor.linkages.map((linkage) => (
                          <div
                            key={linkage.id}
                            className={`flex items-center justify-between p-4 rounded-xl border ${
                              linkage.grant_lock_status
                                ? "border-rose-500/20 bg-rose-500/5"
                                : "border-neutral-700/50 bg-slate-200 dark:border-slate-800/30"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <GitBranch className="w-4 h-4 text-neutral-500" />
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {linkage.entity_a?.name || "Unknown Startup"}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="w-16 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
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
                                    className={`text-xs font-semibold tabular-nums ${getHealthColor(
                                      linkage.health_score
                                    )}`}
                                  >
                                    {linkage.health_score}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Pulse Buttons */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  triggerPulse(linkage.id, "green")
                                }
                                disabled={pulsingId === linkage.id}
                                className="h-8 px-3 bg-sky-600/10 text-sky-500 hover:bg-sky-600/20 gap-1.5 text-xs"
                              >
                                {pulsingId === linkage.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ThumbsUp className="w-3 h-3" />
                                )}
                                Good
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  triggerPulse(linkage.id, "yellow")
                                }
                                disabled={pulsingId === linkage.id}
                                className="h-8 px-3 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 gap-1.5 text-xs"
                              >
                                <Minus className="w-3 h-3" />
                                OK
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  triggerPulse(linkage.id, "red")
                                }
                                disabled={pulsingId === linkage.id}
                                className="h-8 px-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 gap-1.5 text-xs"
                              >
                                <ThumbsDown className="w-3 h-3" />
                                Bad
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
