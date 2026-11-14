"use client";

import React, { useState } from "react";
import { Briefing, BriefItem } from "@/lib/schema";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { SourcesList } from "./SourcesList";
import { Copy, Check, Printer, RotateCw, Calendar, Sparkles, Building2, User, Target } from "lucide-react";

interface BriefingCardProps {
  briefing: Briefing & { purpose?: string };
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

/**
 * Formats meeting date/time consistently in Asia/Kolkata (IST: UTC+05:30) timezone.
 * Output format: "9 November 2026, 4:30 AM IST"
 */
export function formatMeetingDisplayDate(meetingTimeStr: string): string {
  try {
    let str = String(meetingTimeStr || "").trim();
    if (!str) return "";

    // If no timezone is specified in the string (e.g. YYYY-MM-DDTHH:mm), default to Asia/Kolkata (+05:30)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(str)) {
      str += "+05:30";
    }

    const d = new Date(str);
    if (isNaN(d.getTime())) return meetingTimeStr;

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(d);

    const get = (type: string) => (parts.find((p) => p.type === type) || {}).value || "";
    const day = get("day");
    const month = get("month");
    const year = get("year");
    const hour = get("hour");
    const minute = get("minute");
    const period = get("dayPeriod").toUpperCase();

    return `${day} ${month} ${year}, ${hour}:${minute} ${period} IST`;
  } catch {
    return meetingTimeStr;
  }
}

export function BriefingCard({ briefing, onRegenerate, isRegenerating }: BriefingCardProps) {
  const [copied, setCopied] = useState(false);

  // Formats inline text with clickable citations e.g. "[1]" -> <a href="#source-1">[1]</a>
  const renderWithCitations = (text: string) => {
    const parts = text.split(/(\[\d+(?:,\s*\d+)*\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(\d+(?:,\s*\d+)*)\]/);
      if (match) {
        const ids = match[1].split(",").map((s) => s.trim());
        return (
          <span key={i} className="inline-flex gap-0.5">
            {ids.map((id, idx) => (
              <a
                key={idx}
                href={`#source-${id}`}
                className="citation-ref font-mono hover:text-[#E83FCB]"
                title={`Jump to Source [${id}]`}
              >
                [{id}]
              </a>
            ))}
          </span>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const formattedMeetingDate = () => formatMeetingDisplayDate(briefing.meetingTime);

  const formattedGeneratedAt = () => {
    try {
      const d = briefing.generatedAt ? new Date(briefing.generatedAt) : new Date();
      return (
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(d) + " IST"
      );
    } catch {
      return "";
    }
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown(briefing);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <article className="print-page w-full max-w-3xl mx-auto bg-white border border-[#EEEEEE] rounded-2xl p-6 sm:p-10 my-8 shadow-card transition-all">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-6 border-b border-[#EEEEEE] no-print">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#111111] flex items-center justify-center text-white text-[10px] font-bold">
            M
          </div>
          <span className="font-display text-xs uppercase tracking-wider font-bold text-[#111111]">
            Executive Briefing Dossier
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#EEEEEE] bg-[#F8F8F8] hover:bg-white hover:border-[#111111]/30 text-[#111111] transition-all shadow-subtle"
            title="Copy as clean Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Markdown"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#EEEEEE] bg-[#F8F8F8] hover:bg-white hover:border-[#111111]/30 text-[#111111] transition-all shadow-subtle"
            title="Download PDF via print"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#EEEEEE] bg-[#F8F8F8] hover:bg-white hover:border-[#111111]/30 text-[#111111] disabled:opacity-50 transition-all shadow-subtle"
              title="Regenerate this briefing"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>

      {/* Document Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-3">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
            {briefing.subject}
          </h1>

          <div className="flex items-center gap-2 text-xs font-medium text-[#777777]">
            <Calendar className="w-3.5 h-3.5 text-[#E83FCB]" />
            <span>{formattedMeetingDate()}</span>
          </div>
        </div>

        {/* Meeting metadata bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#777777] font-mono pb-4 border-b border-[#F8F8F8]">
          <span className="px-2 py-0.5 rounded bg-[#F8F8F8] border border-[#EEEEEE] text-[#111111]">
            {briefing.coverageNote || "Covers the last 30 days"}
          </span>
          <span>•</span>
          <span>Generated {formattedGeneratedAt()}</span>
          {briefing.purpose && (
            <>
              <span>•</span>
              <span className="text-[#E83FCB] font-semibold">Purpose: {briefing.purpose}</span>
            </>
          )}
          {briefing.isLowData && (
            <>
              <span>•</span>
              <span className="text-amber-700 font-semibold">Limited recent public news</span>
            </>
          )}
        </div>
      </header>

      {/* TL;DR Executive Summary */}
      {briefing.tldr && (
        <section className="mb-8 p-5 rounded-xl bg-[#F8F8F8] border border-[#EEEEEE]">
          <div className="flex items-center gap-1.5 mb-2 text-[#E83FCB]">
            <Sparkles className="w-3.5 h-3.5" />
            <h2 className="font-display text-xs uppercase tracking-wider font-bold text-[#111111]">
              Executive Summary
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#111111]">
            {renderWithCitations(briefing.tldr)}
          </p>
        </section>
      )}

      {/* Main Sections */}
      <div className="space-y-8 text-[#111111]">
        {/* Key Developments */}
        {renderSectionGroup("Key Developments (Last 30 Days)", briefing.keyDevelopments)}

        {/* Leadership & People */}
        {renderSectionGroup("People & Leadership", briefing.leadershipAndPeople)}

        {/* Products & Announcements */}
        {renderSectionGroup("Products & Announcements", briefing.productsAndAnnouncements)}

        {/* Risks & Open Uncertainties */}
        {renderSectionGroup("Risks & Open Uncertainties", briefing.risksAndOpenUncertainties)}

        {/* Strategic Talking Points */}
        {briefing.talkingPoints && briefing.talkingPoints.length > 0 && (
          <section className="briefing-section">
            <h2 className="font-display text-lg font-bold border-b border-[#EEEEEE] pb-2 mb-3.5 text-[#111111] flex items-center justify-between">
              <span>Strategic Talking Points</span>
              <span className="text-xs font-mono font-normal text-[#777777]">Meeting Intelligence</span>
            </h2>
            <ul className="space-y-2.5 text-sm leading-relaxed list-disc list-outside pl-5 marker:text-[#E83FCB]">
              {briefing.talkingPoints.map((point, i) => (
                <li key={i}>{renderWithCitations(point)}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Suggested Open Questions */}
        {briefing.openQuestions && briefing.openQuestions.length > 0 && (
          <section className="briefing-section">
            <h2 className="font-display text-lg font-bold border-b border-[#EEEEEE] pb-2 mb-3.5 text-[#111111] flex items-center justify-between">
              <span>Suggested Open Questions</span>
              <span className="text-xs font-mono font-normal text-[#777777]">High-Conviction</span>
            </h2>
            <ul className="space-y-2.5 text-sm leading-relaxed list-disc list-outside pl-5 marker:text-[#111111]">
              {briefing.openQuestions.map((q, i) => (
                <li key={i} className="font-medium text-[#111111]">
                  {renderWithCitations(q)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Sources Index */}
      <SourcesList sources={briefing.sources || []} />
    </article>
  );

  function renderSectionGroup(title: string, items?: BriefItem[]) {
    if (!items || items.length === 0) return null;

    return (
      <section className="briefing-section">
        <h2 className="font-display text-lg font-bold border-b border-[#EEEEEE] pb-2 mb-4 text-[#111111]">
          {title}
        </h2>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-[#EEEEEE] hover:border-[#111111]/30 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <h3 className="font-display text-sm font-semibold text-[#111111] leading-snug">
                  {item.headline}
                </h3>
                <div className="shrink-0 flex items-center gap-2">
                  {item.date && (
                    <span className="text-[11px] text-[#777777] font-mono">
                      {item.date}
                    </span>
                  )}
                  <ConfidenceBadge confidence={item.confidence} />
                </div>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-[#555555]">
                {renderWithCitations(item.summary)}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }
}

/**
 * Generates clean Markdown export
 */
function generateMarkdown(b: Briefing & { purpose?: string }): string {
  let md = `# MeetIntel AI Pre-Meeting Briefing: ${b.subject}\n`;
  md += `**Meeting Time:** ${formatMeetingDisplayDate(b.meetingTime)}\n`;
  if (b.purpose) md += `**Meeting Purpose:** ${b.purpose}\n`;
  md += `**Coverage:** ${b.coverageNote || "Last 30 days"} (Generated: ${b.generatedAt || new Date().toISOString()})\n\n`;

  if (b.tldr) {
    md += `## Executive Summary (TL;DR)\n${b.tldr}\n\n`;
  }

  const appendSection = (title: string, items?: BriefItem[]) => {
    if (!items || items.length === 0) return;
    md += `## ${title}\n\n`;
    for (const item of items) {
      md += `### ${item.headline} (${item.confidence.toUpperCase()}${item.date ? ` - ${item.date}` : ""})\n`;
      md += `${item.summary}\n\n`;
    }
  };

  appendSection("Key Developments", b.keyDevelopments);
  appendSection("People & Leadership", b.leadershipAndPeople);
  appendSection("Products & Announcements", b.productsAndAnnouncements);
  appendSection("Risks & Open Uncertainties", b.risksAndOpenUncertainties);

  if (b.talkingPoints && b.talkingPoints.length > 0) {
    md += `## Strategic Talking Points\n`;
    for (const p of b.talkingPoints) md += `- ${p}\n`;
    md += `\n`;
  }

  if (b.openQuestions && b.openQuestions.length > 0) {
    md += `## Open Questions\n`;
    for (const q of b.openQuestions) md += `- ${q}\n`;
    md += `\n`;
  }

  if (b.sources && b.sources.length > 0) {
    md += `## Sources\n`;
    for (const s of b.sources) {
      md += `[${s.id}] ${s.title} - ${s.url} (${s.date || "Recent"})\n`;
    }
  }

  return md;
}
