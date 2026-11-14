"use client";

import React from "react";
import { Search, Cpu, FileCheck2, ArrowRight } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      tag: "RESEARCH",
      title: "Targeted Web Research",
      description:
        "Tavily discovers relevant developments from the previous 30 days across authoritative news indices, discarding outdated reports.",
      icon: Search,
      highlight: "Powered by Tavily API",
    },
    {
      number: "02",
      tag: "UNDERSTAND",
      title: "Contextual Evidence Analysis",
      description:
        "Gemini analyzes the findings according to your exact meeting context, corroborating claims and filtering noise.",
      icon: Cpu,
      highlight: "Powered by Google Gemini",
    },
    {
      number: "03",
      tag: "PREPARE",
      title: "Synthesize One-Page Dossier",
      description:
        "MeetIntel generates a concise, source-backed meeting briefing with strategic talking points and questions ready for your call.",
      icon: FileCheck2,
      highlight: "100% Grounded Output",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-6 max-w-6xl mx-auto border-t border-[#EEEEEE]">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs uppercase tracking-wider font-semibold text-[#E83FCB] mb-2 block">
          Agent Workflow
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
          How MeetIntel AI Works
        </h2>
        <p className="text-sm sm:text-base text-[#777777] mt-3">
          A fully autonomous research agent pipeline executed in seconds before your calendar event.
        </p>
      </div>

      {/* Horizontal Steps Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-[#F8F8F8] border border-[#EEEEEE] hover:border-[#E83FCB]/40 hover:bg-white hover:shadow-card transition-all relative flex flex-col justify-between"
            >
              <div>
                {/* Step badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-bold text-[#E83FCB] tracking-wider">
                    {step.number} — {step.tag}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#EEEEEE] flex items-center justify-center text-[#111111]">
                    <Icon className="w-4 h-4 text-[#111111]" />
                  </div>
                </div>

                {/* Step Title & Description */}
                <h3 className="font-display text-lg font-bold text-[#111111] mb-2.5 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#777777] leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Subtitle / Tech provider */}
              <div className="mt-8 pt-4 border-t border-[#EEEEEE] flex items-center justify-between text-[11px] font-mono text-[#777777]">
                <span>{step.highlight}</span>
                {idx < 2 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#CCCCCC] hidden md:block" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
