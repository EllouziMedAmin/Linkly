"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  GitBranch,
  ShieldCheck,
  Zap,
  Network,
  BarChart3,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const features = [
  {
    icon: Brain,
    title: "AI Verification Agent",
    description:
      "Gemini 3.1 Flash-Lite autonomously parses pitch decks, extracts skills, and assigns Friction Scores — eliminating manual application screening.",
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-200 dark:border-sky-800/40",
  },
  {
    icon: GitBranch,
    title: "Bipartite Matching Engine",
    description:
      "Our algorithm optimizes the entire cohort simultaneously using Friction Token economics, preventing mentor burnout.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800/40",
  },
  {
    icon: ShieldCheck,
    title: "Cradle Grant Governance",
    description:
      "Health scores drop below 50? Cradle fund disbursements are automatically paused. We protect the sponsor's money autonomously.",
    color: "from-cyan-500 to-sky-600",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    border: "border-cyan-200 dark:border-cyan-800/40",
  },
];

const stats = [
  { label: "Manual Hours Saved", value: "90%", icon: Zap },
  { label: "Linkage Visibility", value: "100%", icon: Network },
  { label: "Data-Driven Matches", value: "∞", icon: BarChart3 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground overflow-hidden transition-colors duration-300">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(56,189,248,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.10),transparent_50%)]" />
        <div className="dark:block hidden absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,155,220,0.05),transparent_40%)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            El-Rojla-Bwai
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/company/portal"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors px-4 py-2"
          >
            Company Portal
          </Link>
          <Link
            href="/mentor/portal"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors px-4 py-2"
          >
            Mentor Portal
          </Link>
          <Link
            href="/admin/dashboard"
            className="text-sm bg-sky-600 hover:bg-sky-700 text-white transition-all px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-sky-500/20"
          >
            Admin Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-sky-100 dark:bg-sky-500/10 border border-sky-300 dark:border-sky-500/30 rounded-full px-4 py-1.5 mb-8">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-sm text-sky-700 dark:text-sky-400 font-medium">
              Build with AI 2026 KL · MyHack
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-slate-700 to-slate-500 dark:from-white dark:via-white dark:to-slate-400">
              Programmable
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 animate-gradient-x">
              Ecosystem Linkages
            </span>
          </h1>

          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Stop treating ecosystem relationships as one-off assignments. Make
            every connection a{" "}
            <span className="text-slate-800 dark:text-white font-semibold">
              first-class programmable entity
            </span>{" "}
            — with a lifecycle, behavioral DNA, health monitoring, and
            autonomous governance.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/admin/dashboard"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-sky-500/25 transition-all hover:shadow-sky-500/40 hover:scale-[1.02]"
            >
              Launch Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center gap-3 bg-white dark:bg-white/5 hover:bg-sky-50 dark:hover:bg-white/10 border border-sky-200 dark:border-white/10 text-slate-700 dark:text-white font-medium py-4 px-8 rounded-2xl transition-all shadow-sm"
            >
              Apply to Ecosystem
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              className="glass rounded-2xl p-6 text-center"
            >
              <stat.icon className="w-6 h-6 text-sky-500 dark:text-sky-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-bold text-center mb-4 text-slate-800 dark:text-white"
        >
          Three AI Pillars
        </motion.h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-16 max-w-xl mx-auto">
          Each pillar is a working, demonstrable feature powered by Google AI
          technology.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
              className={`${feature.bg} border ${feature.border} rounded-2xl p-8 hover:shadow-lg hover:shadow-sky-500/10 transition-all group`}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white">{feature.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-sky-100 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <span className="text-sm text-slate-400 dark:text-slate-500">
            El-Rojla-Bwai © 2026 · Cradle MyHack
          </span>
          <span className="text-sm text-slate-400 dark:text-slate-500">
            Powered by Gemini 3.1 Flash-Lite + Supabase
          </span>
        </div>
      </footer>
    </div>
  );
}
