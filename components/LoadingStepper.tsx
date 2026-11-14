"use client";

import React from "react";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { PipelineStage } from "@/lib/schema";

interface LoadingStepperProps {
  currentStage: PipelineStage;
  currentMessage?: string;
  stageData?: any;
}

const STAGES: { stage: PipelineStage; label: string; desc: string }[] = [
  { stage: "Planning queries", label: "01. Planning Queries", desc: "Formulating 4-6 targeted research queries with Gemini" },
  { stage: "Searching the web", label: "02. Searching Web", desc: "Tavily queries across news & general indices (last 30 days)" },
  { stage: "Reading sources", label: "03. Reading Sources", desc: "Extracting articles, deduplicating URLs & verifying dates" },
  { stage: "Verifying claims", label: "04. Verifying Claims", desc: "Corroborating cross-source evidence & confidence tags" },
  { stage: "Writing briefing", label: "05. Writing Briefing", desc: "Gemini synthesizes one-page briefing with source citations" },
];

export function LoadingStepper({ currentStage, currentMessage, stageData }: LoadingStepperProps) {
  const getStageStatus = (stage: PipelineStage) => {
    const stageOrder: PipelineStage[] = [
      "Planning queries",
      "Searching the web",
      "Reading sources",
      "Verifying claims",
      "Writing briefing",
      "Complete",
    ];

    const currentIndex = stageOrder.indexOf(currentStage);
    const targetIndex = stageOrder.indexOf(stage);

    if (currentStage === "Error") return "idle";
    if (currentIndex > targetIndex || currentStage === "Complete") return "completed";
    if (currentIndex === targetIndex) return "active";
    return "pending";
  };

  return (
    <div className="w-full max-w-xl mx-auto my-10 p-6 sm:p-8 bg-white border border-[#EEEEEE] rounded-2xl shadow-card no-print">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2FA] border border-[#E83FCB]/20 text-[11px] font-semibold uppercase tracking-wider text-[#E83FCB] mb-2">
          <Sparkles className="w-3 h-3" /> Live Agent Pipeline
        </div>
        <h3 className="font-display text-lg font-bold text-[#111111]">
          Researching the Last 30 Days
        </h3>
        <p className="text-xs text-[#777777] mt-1">
          Grounding factual assertions via Tavily & Google Gemini
        </p>
      </div>

      <div className="relative pl-6 space-y-6">
        {/* Continuous vertical hairline line */}
        <div className="absolute left-[11px] top-2 bottom-4 w-[1px] bg-[#EEEEEE]" />

        {STAGES.map((s) => {
          const status = getStageStatus(s.stage);
          const isActive = status === "active";
          const isCompleted = status === "completed";

          return (
            <div key={s.stage} className="relative flex items-start gap-4 transition-all duration-150">
              {/* Stepper Dot */}
              <div
                className={`absolute -left-[19px] top-0.5 w-[15px] h-[15px] rounded-full flex items-center justify-center border transition-all duration-150 ${
                  isCompleted
                    ? "bg-[#111111] border-[#111111] text-white"
                    : isActive
                    ? "bg-[#E83FCB] border-[#E83FCB] ring-4 ring-[#FDF2FA]"
                    : "bg-white border-[#DDDDDD]"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                ) : isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                ) : null}
              </div>

              {/* Step Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`font-display text-sm font-semibold transition-colors ${
                      isActive
                        ? "text-[#111111]"
                        : isCompleted
                        ? "text-[#444444]"
                        : "text-[#999999]"
                    }`}
                  >
                    {s.label}
                  </h4>
                  {isActive && (
                    <span className="text-[11px] font-mono text-[#E83FCB] font-semibold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Processing
                    </span>
                  )}
                </div>

                <p
                  className={`text-xs mt-0.5 ${
                    isActive
                      ? "text-[#111111] font-medium"
                      : "text-[#777777]"
                  }`}
                >
                  {isActive && currentMessage ? currentMessage : s.desc}
                </p>

                {/* Extra dynamic preview if queries available */}
                {isActive && stageData?.queries && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-[#F8F8F8] border border-[#EEEEEE] text-[11px] text-[#555555] font-mono space-y-1">
                    {stageData.queries.slice(0, 3).map((q: string, i: number) => (
                      <div key={i} className="truncate">
                        • {q}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
