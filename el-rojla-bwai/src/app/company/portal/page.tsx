"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  GitBranch,
  ShieldAlert,
  Activity,
  ArrowLeft,
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

interface Company {
  id: string;
  name: string;
  email: string;
  friction_capacity: number;
  linkages: Linkage[];
}

export default function CompanyPortal() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch companies
      const profRes = await fetch("/api/profiles?role=company");
      const profData = await profRes.json();

      // Fetch all linkages
      const linkRes = await fetch("/api/linkages");
      const linkData = await linkRes.json();

      if (profData.success && linkData.success) {
        const linkages: Linkage[] = linkData.data || [];
        const enriched = (profData.data || []).map((company: any) => ({
          ...company,
          linkages: linkages.filter(
            (l: Linkage) => l.entity_a?.id === company.id
          ),
        }));
        setCompanies(enriched);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

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
              <h1 className="text-2xl font-bold">Company Portal</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                View your linkages, health scores, and grant status
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
            <p className="text-slate-500 dark:text-slate-400">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-neutral-700 rounded-2xl">
            <Building2 className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              No companies onboarded yet
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              Use the{" "}
              <Link href="/admin/onboard" className="text-sky-500 underline">
                AI Onboarding
              </Link>{" "}
              to add companies.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {companies.map((company) => (
              <Card
                key={company.id}
                className="glass border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">
                          {company.name}
                        </CardTitle>
                        <p className="text-xs text-neutral-500">
                          {company.email}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-amber-400 border-amber-500/20 bg-amber-500/10"
                    >
                      Friction: {company.friction_capacity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {company.linkages.length === 0 ? (
                    <div className="py-4 text-center border border-dashed border-neutral-700 rounded-xl">
                      <p className="text-sm text-neutral-500">
                        Not matched yet. Awaiting Bipartite Matching.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {company.linkages.map((linkage) => (
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
                                Mentor:{" "}
                                <span className="text-sky-500">
                                  {linkage.entity_b?.name}
                                </span>
                              </p>
                              <p className="text-xs text-neutral-500">
                                Friction allocation: {linkage.friction_allocation}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {/* Health */}
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-neutral-700 rounded-full overflow-hidden">
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
                            {/* Grant Status */}
                            {linkage.grant_lock_status ? (
                              <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30 gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                LOCKED
                              </Badge>
                            ) : (
                              <Badge className="bg-sky-600/10 text-sky-500 border border-sky-600/20">
                                Disbursing
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
