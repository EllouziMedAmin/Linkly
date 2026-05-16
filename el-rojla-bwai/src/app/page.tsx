"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Brain, GitBranch, ShieldCheck, Zap, Network, BarChart3 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { LogoFull } from "@/components/Logo";

const features = [
  {
    icon: Brain,
    title: "AI Verification Agent",
    description:
      "Gemini 3.1 Flash-Lite parses pitch decks, extracts skills, and assigns Friction Scores — removing manual application screening entirely.",
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-200 dark:border-sky-800/40",
  },
  {
    icon: GitBranch,
    title: "Bipartite Matching Engine",
    description:
      "The algorithm optimizes the entire cohort simultaneously using Friction Token economics, preventing mentor overload across programmes.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800/40",
  },
  {
    icon: ShieldCheck,
    title: "Cradle Grant Governance",
    description:
      "When health scores drop below 50, Cradle fund disbursements are automatically paused. The sponsor's capital is protected without human intervention.",
    color: "from-cyan-500 to-sky-600",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    border: "border-cyan-200 dark:border-cyan-800/40",
  },
];

const stats = [
  { label: "Manual Hours Saved", value: "90%", icon: Zap },
  { label: "Linkage Visibility", value: "100%", icon: Network },
  { label: "Data-Driven Matches", value: "Unlimited", icon: BarChart3 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground overflow-hidden transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.08),transparent_55%)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b border-sky-100/60 dark:border-slate-800/60">
        <LogoFull size={36} />
        <div className="flex items-center gap-2">
          <Link
            href="/company/portal"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors px-4 py-2"
          >
            Company Portal
          </Link>
          <Link
            href="/mentor/portal"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors px-4 py-2"
          >
            Mentor Portal
          </Link>
          <Link
            href="/admin/dashboard"
            className="text-sm bg-slate-900 dark:bg-sky-600 hover:bg-slate-700 dark:hover:bg-sky-500 text-white transition-all px-5 py-2 rounded-lg font-medium"
          >
            Admin Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-sky-100 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/25 rounded-full px-4 py-1.5 mb-10">
            <div className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="text-sm text-sky-700 dark:text-sky-400 font-medium tracking-wide">
              Build with AI 2026 KL — MyHack
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-8">
            <span className="text-slate-800 dark:text-white">
              Programmable
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500">
              Ecosystem Linkages
            </span>
          </h1>

          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Every ecosystem relationship treated as a first-class programmable entity — with a lifecycle, health monitoring, friction scoring, and autonomous governance built in.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/admin/dashboard"
              className="group inline-flex items-center gap-2.5 bg-slate-900 dark:bg-sky-600 hover:bg-slate-700 dark:hover:bg-sky-500 text-white font-semibold py-3.5 px-7 rounded-xl transition-all"
            >
              Launch Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2.5 bg-white dark:bg-white/5 hover:bg-sky-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-medium py-3.5 px-7 rounded-xl transition-all"
            >
              Apply to Ecosystem
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-4xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-3 gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08, duration: 0.4 }}
              className="glass rounded-xl p-5 text-center"
            >
              <stat.icon className="w-5 h-5 text-sky-500 dark:text-sky-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 tracking-wide">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
            Three core capabilities
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            Each capability is a working, demonstrable feature powered by Google AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              className={`${feature.bg} border ${feature.border} rounded-xl p-7 hover:shadow-md hover:shadow-sky-500/8 transition-all group`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${feature.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-slate-800 dark:text-white">{feature.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100 dark:border-slate-800 py-7">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500 tracking-wide">
            El-Rojla-Bwai — Cradle MyHack 2026
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 tracking-wide">
            Gemini 3.1 Flash-Lite + Supabase
          </span>
        </div>
      </footer>
    </div>
  );
}
