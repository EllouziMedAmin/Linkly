"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserPlus, FolderKanban, Inbox, ArrowLeft, Network } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { LogoFull } from "@/components/Logo";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: Inbox },
  { href: "/admin/onboard", label: "Onboard", icon: UserPlus },
  { href: "/admin/pipeline", label: "Pipeline Monitor", icon: Network },
  { href: "/admin/programmes", label: "Programmes", icon: FolderKanban },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-50 overflow-hidden transition-colors duration-300">
      <aside className="w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
        <div className="p-5">
          <Link href="/" className="block mb-8">
            <LogoFull size={32} />
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                    isActive
                      ? "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-sky-600 dark:text-sky-400" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-5 space-y-1 border-t border-slate-100 dark:border-slate-800">
          <div className="mb-3">
            <ThemeToggle />
          </div>
          <Link
            href="/company/portal"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Company Portal
          </Link>
          <Link
            href="/mentor/portal"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Mentor Portal
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}
