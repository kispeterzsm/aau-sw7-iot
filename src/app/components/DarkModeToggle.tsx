"use client";

import React, { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
      if (stored === "dark") {
        setIsDark(true);
        document.documentElement.classList.add("dark");
      } else if (stored === "light") {
        setIsDark(false);
        document.documentElement.classList.remove("dark");
      } else {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDark(systemPrefersDark);
        document.documentElement.classList.toggle("dark", systemPrefersDark);
      }
    } catch {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setIsDark(e.matches);
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const toggle = () => {
    if (isDark === null) return;
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch { /* ignore */ }
    document.documentElement.classList.toggle("dark", next);
  };

  if (isDark === null) {
    return <div className="w-12 h-6 rounded-full bg-gray-200 dark:bg-slate-700/40" />;
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm sr-only">Toggle dark mode</span>

      <button
        onClick={toggle}
        aria-pressed={isDark}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={
          "relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 " +
          (isDark ? "bg-slate-700" : "bg-gray-300")
        }
      >
        <span
          className={
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm " +
            (isDark ? "translate-x-6" : "translate-x-1")
          }
        />
      </button>

      <div className="text-xs select-none">
        {isDark ? "🌙" : "🔆"}
      </div>
    </div>
  );
}
