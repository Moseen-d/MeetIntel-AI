"use client";

import React from "react";
import {
  Globe,
  Brain,
  ListOrdered,
  ShieldCheck,
  HelpCircle,
  FileText,
  Sparkles
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Globe,
      title: "Real-time Web Research",
      description:
        "Tavily queries parallel news and general indexes strictly filtered to the last 30 days, discovering announcements and market developments you might have missed.",
    },
    {
      icon: Brain,
      title: "Meeting Context Intelligence",
      description:
        "Whether you're stepping into a high-stakes job interview, a strategic sales pitch, or an investor meeting, intelligence is tailored specifically to your conversation goals.",
    },
    {
      icon: ListOrdered,
      title: "Intelligent Development Ranking",
      description:
        "Automatically identifies high-signal events—funding rounds, executive departures, and product updates—filtering out marketing fluff and speculative rumors.",
    },
    {
      icon: ShieldCheck,
      title: "Source-backed Findings",
      description:
        "Every single factual claim is tagged with an inline citation link [1] and confidence rating, ensuring zero ungrounded hallucinations.",
    },
    {
      icon: HelpCircle,
      title: "Smart Meeting Questions",
      description:
        "Generates thoughtful, high-conviction open questions linked directly to recent events, proving immediate domain command.",
    },
    {
      icon: FileText,
      title: "One-page Meeting Briefings",
      description:
        "Consolidated into an executive single-page briefing with native Markdown copying and print-ready A4 PDF export capabilities.",
    },
  ];

  return (
    <section id="features" className="py-20 px-6 max-w-6xl mx-auto border-t border-[#EEEEEE]">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F8F8] border border-[#EEEEEE] text-[11px] font-semibold uppercase tracking-wider text-[#E83FCB] mb-3">
          <Sparkles className="w-3 h-3" /> Core Capabilities
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
          Everything you need before the conversation.
        </h2>
        <p className="text-sm sm:text-base text-[#777777] mt-3">
          Designed for executives, founders, and professionals who cannot afford to walk into critical meetings unprepared.
        </p>
      </div>

      {/* 6-Item Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className="p-7 rounded-2xl bg-white border border-[#EEEEEE] hover:border-[#E83FCB]/40 hover:shadow-card transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#F8F8F8] border border-[#EEEEEE] flex items-center justify-center text-[#111111] group-hover:bg-[#E83FCB]/10 group-hover:text-[#E83FCB] group-hover:border-[#E83FCB]/30 transition-colors mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-semibold text-[#111111] mb-2 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#777777] leading-relaxed">
                  {f.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F8F8F8] flex items-center justify-between text-[11px] text-[#777777] font-mono">
                <span>0{idx + 1}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#E83FCB] font-semibold">
                  Verified Feature →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
