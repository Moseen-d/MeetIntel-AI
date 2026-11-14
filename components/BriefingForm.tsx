"use client";

import React, { useState } from "react";
import { ArrowRight, Building2, User, Sparkles, Calendar, Target, HelpCircle } from "lucide-react";
import { BriefRequest } from "@/lib/schema";

interface BriefingFormProps {
  onSubmit: (request: BriefRequest & { purpose?: string }) => void;
  isLoading: boolean;
}

export function BriefingForm({ onSubmit, isLoading }: BriefingFormProps) {
  const [type, setType] = useState<"company" | "person">("company");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");

  // Default meeting time to tomorrow at 10:00 AM local
  const getDefaultMeetingTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`;
  };

  const [meetingTime, setMeetingTime] = useState(getDefaultMeetingTime);
  const [context, setContext] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || isLoading) return;

    // Combine purpose with context so backend receives rich meeting context seamlessly
    let finalContext = context.trim();
    if (purpose.trim()) {
      finalContext = `Meeting Purpose: ${purpose.trim()}.${finalContext ? ` Additional Context: ${finalContext}` : ""}`;
    }

    // Preserve the exact selected meeting date and time with Asia/Kolkata (+05:30) timezone offset
    let serializedTime = meetingTime.trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(serializedTime)) {
      serializedTime = `${serializedTime}:00+05:30`;
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(serializedTime)) {
      serializedTime = `${serializedTime}+05:30`;
    }

    onSubmit({
      subject: subject.trim(),
      type,
      meetingTime: serializedTime,
      context: finalContext,
      purpose: purpose.trim(),
    });
  };

  const applySample = (
    sampleSubject: string,
    sampleType: "company" | "person",
    samplePurpose: string,
    sampleContext: string
  ) => {
    setType(sampleType);
    setSubject(sampleSubject);
    setPurpose(samplePurpose);
    setContext(sampleContext);
  };

  return (
    <div id="app" className="w-full max-w-3xl mx-auto mb-16 pt-12">
      {/* Form Container */}
      <div className="bg-white border border-[#EEEEEE] rounded-2xl shadow-card p-6 sm:p-8 no-print">
        {/* Form Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#EEEEEE]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#E83FCB]" />
              <h3 className="font-display text-lg font-bold text-[#111111] tracking-tight">
                Live Research Assistant
              </h3>
            </div>
            <p className="text-xs text-[#777777]">
              Enter your meeting details to generate an intelligence briefing from the last 30 days.
            </p>
          </div>

          {/* Segmented Toggle: Company | Person */}
          <div className="inline-flex p-1 rounded-xl bg-[#F8F8F8] border border-[#EEEEEE] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setType("company")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                type === "company"
                  ? "bg-white text-[#111111] shadow-subtle border border-[#EEEEEE]"
                  : "text-[#777777] hover:text-[#111111]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#E83FCB]" />
              <span>Company</span>
            </button>
            <button
              type="button"
              onClick={() => setType("person")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                type === "person"
                  ? "bg-white text-[#111111] shadow-subtle border border-[#EEEEEE]"
                  : "text-[#777777] hover:text-[#111111]"
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#E83FCB]" />
              <span>Person</span>
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Target Name & Meeting Time */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7">
              <label
                htmlFor="subject"
                className="block text-xs font-semibold text-[#111111] mb-1.5"
              >
                {type === "company" ? "Company name" : "Person's name & title"}
                <span className="text-[#E83FCB] ml-0.5">*</span>
              </label>
              <input
                id="subject"
                type="text"
                required
                disabled={isLoading}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={type === "company" ? "e.g. NVIDIA, Anthropic, Stripe" : "e.g. Satya Nadella, Jensen Huang"}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#EEEEEE] rounded-xl focus:outline-none focus:border-[#E83FCB] focus:ring-2 focus:ring-[#E83FCB]/10 text-[#111111] placeholder-neutral-400 transition-all"
              />
            </div>

            <div className="md:col-span-5">
              <label
                htmlFor="meetingTime"
                className="block text-xs font-semibold text-[#111111] mb-1.5"
              >
                Meeting Date & Time
                <span className="text-[#E83FCB] ml-0.5">*</span>
              </label>
              <input
                id="meetingTime"
                type="datetime-local"
                required
                disabled={isLoading}
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-[#EEEEEE] rounded-xl focus:outline-none focus:border-[#E83FCB] focus:ring-2 focus:ring-[#E83FCB]/10 text-[#111111] transition-all"
              />
            </div>
          </div>

          {/* Row 2: Meeting Purpose */}
          <div>
            <label
              htmlFor="purpose"
              className="block text-xs font-semibold text-[#111111] mb-1.5"
            >
              Meeting Purpose
              <span className="text-[#777777] font-normal ml-1">(tailors analysis & talking points)</span>
            </label>
            <input
              id="purpose"
              type="text"
              disabled={isLoading}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Job Interview, Strategic Partnership, Enterprise Sales Pitch, Investor Review"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#EEEEEE] rounded-xl focus:outline-none focus:border-[#E83FCB] focus:ring-2 focus:ring-[#E83FCB]/10 text-[#111111] placeholder-neutral-400 transition-all"
            />
          </div>

          {/* Row 3: Optional Context */}
          <div>
            <label
              htmlFor="context"
              className="block text-xs font-semibold text-[#111111] mb-1.5"
            >
              Additional Context
              <span className="text-[#777777] font-normal ml-1">(optional)</span>
            </label>
            <textarea
              id="context"
              rows={2}
              disabled={isLoading}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Interviewing for Senior Solutions Architect role; focus on AI data center infrastructure and GPU scaling challenges."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#EEEEEE] rounded-xl focus:outline-none focus:border-[#E83FCB] focus:ring-2 focus:ring-[#E83FCB]/10 text-[#111111] placeholder-neutral-400 resize-none transition-all"
            />
          </div>

          {/* Bottom Bar: Quick Samples & Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#EEEEEE]">
            {/* Quick Test Samples */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[#777777] flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-[#E83FCB]" /> Quick presets:
              </span>
              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  applySample(
                    "NVIDIA",
                    "company",
                    "Job Interview",
                    "Senior Solutions Architect role focusing on Blackwell GB200 deployment & thermal engineering"
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-lg border border-[#EEEEEE] bg-[#F8F8F8] text-[#111111] hover:border-[#E83FCB]/40 hover:text-[#E83FCB] transition-colors"
              >
                NVIDIA (Job Interview)
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  applySample(
                    "Anthropic",
                    "company",
                    "Enterprise Partnership",
                    "Evaluating Claude 3.5 Sonnet Computer Use API integration and enterprise security"
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-lg border border-[#EEEEEE] bg-[#F8F8F8] text-[#111111] hover:border-[#E83FCB]/40 hover:text-[#E83FCB] transition-colors"
              >
                Anthropic (Partnership)
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  applySample(
                    "Satya Nadella",
                    "person",
                    "Executive Briefing",
                    "Discussion on autonomous Copilot agents and nuclear power for enterprise data centers"
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-lg border border-[#EEEEEE] bg-[#F8F8F8] text-[#111111] hover:border-[#E83FCB]/40 hover:text-[#E83FCB] transition-colors"
              >
                Satya Nadella (Executive)
              </button>
            </div>

            {/* Primary Generate Button */}
            <button
              type="submit"
              disabled={isLoading || !subject.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#111111] hover:bg-[#E83FCB] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all self-end sm:self-auto shadow-subtle"
            >
              <span>{isLoading ? "Researching Web..." : "Generate Briefing"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
