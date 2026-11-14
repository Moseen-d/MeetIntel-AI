"use client";

import React from "react";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 text-center max-w-4xl mx-auto flex flex-col items-center">
      {/* Announcement Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F8F8F8] border border-[#EEEEEE] mb-8 shadow-subtle group hover:border-[#E83FCB]/40 transition-colors">
        <span className="w-2 h-2 rounded-full bg-[#E83FCB] animate-pulse" />
        <span className="text-xs font-medium text-[#111111] tracking-tight">
          AI-powered meeting intelligence
        </span>
        <span className="text-[#777777] text-xs">•</span>
        <span className="text-xs text-[#777777] font-medium group-hover:text-[#E83FCB] transition-colors flex items-center gap-1">
          30-day web ground truth <ArrowRight className="w-3 h-3" />
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#111111] leading-[1.08] mb-6 max-w-3xl">
        Walk Into Every Meeting Prepared.
      </h1>

      {/* Supporting Text */}
      <p className="text-base sm:text-lg md:text-xl text-[#777777] max-w-2xl font-normal leading-relaxed mb-10">
        Transform the latest company developments into actionable meeting intelligence with your AI-powered research assistant.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
        <a
          href="#app"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-white bg-[#111111] hover:bg-[#E83FCB] active:scale-95 transition-all shadow-subtle"
        >
          <span>Start Researching</span>
          <ArrowRight className="w-4 h-4" />
        </a>

        <a
          href="#showcase"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-[#111111] bg-[#F8F8F8] hover:bg-white border border-[#EEEEEE] hover:border-[#111111]/30 transition-all shadow-subtle"
        >
          <span>Explore Platform</span>
        </a>
      </div>

      {/* Subtle Trust Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-[#777777]">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#E83FCB]" /> Zero hallucination synthesis
        </span>
        <span className="text-[#EEEEEE]">•</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#111111]" /> 100% source-backed claims
        </span>
        <span className="text-[#EEEEEE]">•</span>
        <span>Strict 30-day freshness filter</span>
      </div>
    </section>
  );
}
