// components/ModeToggle.tsx
"use client";

import React, { useEffect, useState } from "react";

export default function ModeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark") {
        applyTheme(true);
        setIsDark(true);
      } else if (stored === "light") {
        applyTheme(false);
        setIsDark(false);
      } else {
        // use system preference if no stored value
        const prefersDark = window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(prefersDark);
        setIsDark(prefersDark);
      }
    } catch {
      applyTheme(true);
      setIsDark(true);
    }
  }, []);

  const applyTheme = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    // If you use DaisyUI or data-theme logic:
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  };

  const toggle = () => {
    if (isDark === null) return;
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    applyTheme(next);
  };

  if (isDark === null) {
    return (
      <div className="w-12 h-6 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-200 dark:to-slate-300 animate-pulse" />
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs sr-only">Toggle theme mode</span>
      <button
        onClick={toggle}
        aria-pressed={isDark}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className={`cursor-pointer relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${isDark
            ? "bg-gradient-to-r from-slate-700 to-slate-600 shadow-lg shadow-emerald-500/20"
            : "bg-gradient-to-r from-amber-200 to-yellow-200 shadow-lg shadow-yellow-400/30"
          }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md flex items-center justify-center text-xs font-bold ${isDark ? "translate-x-7" : "translate-x-1"
            }`}
        >
          {isDark ? "🌙" : "☀️"}
        </span>
      </button>
      <div className="text-xs font-medium text-slate-400 dark:text-slate-600 uppercase tracking-wide select-none">
        {isDark ? "Dark" : "Light"}
      </div>
    </div>
  );
}
