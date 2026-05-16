"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  FolderKanban,
  GitBranch,
  ArrowLeft,
  Inbox,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: Inbox },
  { href: "/admin/onboard", label: "Onboard Company", icon: UserPlus },
  { href: "/admin/programmes", label: "Programmes", icon: FolderKanban },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-50 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-xl flex flex-col justify-between shadow-sm">
        <div className="p-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-shadow">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-white">
              El-Rojla-Bwai
            </span>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                    isActive
                      ? "bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-sky-600 dark:text-sky-400" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom links */}
        <div className="p-6 space-y-1.5">
          <div className="mb-3">
            <ThemeToggle className="w-full justify-center" />
          </div>
          <Link
            href="/company/portal"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Company Portal
          </Link>
          <Link
            href="/mentor/portal"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Mentor Portal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-sky-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {children}
      </main>
    </div>
  );
}
