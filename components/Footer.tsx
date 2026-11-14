"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#EEEEEE] bg-[#F8F8F8] py-12 px-6 no-print">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#111111] flex items-center justify-center text-white relative">
              <span className="font-display font-bold text-xs">M</span>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#E83FCB]" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight text-[#111111]">
              MeetIntel<span className="text-[#E83FCB]">.ai</span>
            </span>
          </div>
          <p className="text-xs text-[#777777]">
            Walk into every meeting prepared. 30-day source-backed executive dossiers.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-6 text-xs font-medium text-[#777777]">
          <a href="#features" className="hover:text-[#111111] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[#111111] transition-colors">
            How It Works
          </a>
          <a href="#showcase" className="hover:text-[#111111] transition-colors">
            Product Preview
          </a>
          <a href="#app" className="hover:text-[#E83FCB] transition-colors">
            Live Research App
          </a>
        </div>

        {/* System & Attribution */}
        <div className="text-xs text-[#777777] text-center md:text-right">
          <p>© {new Date().getFullYear()} MeetIntel AI. All rights reserved.</p>
          <p className="text-[11px] text-[#999999] mt-0.5 font-mono">
            Powered by Tavily & Google Gemini
          </p>
        </div>
      </div>
    </footer>
  );
}
