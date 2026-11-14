"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function Header() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check initial preference from localStorage or system
    const isDark =
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  return (
    <header className="w-full border-b border-[#E5E5E5] dark:border-[#262626] no-print">
      <div className="max-w-[720px] mx-auto px-6 py-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif-headline text-lg font-bold tracking-tight text-[#111111] dark:text-[#EDEDED]">
              Briefly
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 border border-neutral-200 dark:border-neutral-800 text-neutral-500 rounded">
              v1.0
            </span>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
            Walk into every meeting prepared. Source-backed briefings from the last 30 days.
          </p>
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded border border-[#E5E5E5] dark:border-[#262626] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#EDEDED] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
