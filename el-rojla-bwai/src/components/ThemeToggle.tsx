"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`p-2 rounded-xl transition-all border
        ${theme === "light"
          ? "bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100"
          : "bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700"
        } ${className}`}
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  );
}
