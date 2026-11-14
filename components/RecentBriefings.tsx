"use client";

import React from "react";
import { Briefing } from "@/lib/schema";
import { Clock, Trash2, ArrowUpRight } from "lucide-react";

interface RecentBriefingsProps {
  briefings: (Briefing & { purpose?: string })[];
  onSelect: (briefing: Briefing & { purpose?: string }) => void;
  onClear: () => void;
  onDeleteOne: (subject: string, generatedAt?: string) => void;
}

export function RecentBriefings({
  briefings,
  onSelect,
  onClear,
  onDeleteOne,
}: RecentBriefingsProps) {
  if (!briefings || briefings.length === 0) {
    return null;
  }

  return (
    <aside className="w-full max-w-3xl mx-auto mt-12 mb-16 pt-8 border-t border-[#EEEEEE] no-print">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xs uppercase tracking-wider font-bold text-[#111111] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#E83FCB]" /> Recent Briefing History
        </h3>
        <button
          onClick={onClear}
          className="text-[11px] text-[#777777] hover:text-red-600 transition-colors"
          title="Clear all stored briefings"
        >
          Clear history
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {briefings.map((b, idx) => {
          let timeDisplay = "";
          try {
            timeDisplay = new Date(b.meetingTime).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });
          } catch {
            timeDisplay = b.meetingTime;
          }

          return (
            <div
              key={`${b.subject}-${b.generatedAt || idx}`}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#EEEEEE] hover:border-[#111111]/30 hover:shadow-subtle transition-all cursor-pointer"
              onClick={() => onSelect(b)}
            >
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-display text-sm font-bold text-[#111111] truncate flex items-center gap-1">
                  <span>{b.subject}</span>
                  <ArrowUpRight className="w-3 h-3 text-[#777777] opacity-0 group-hover:opacity-100 group-hover:text-[#E83FCB] transition-all" />
                </h4>
                <p className="text-xs text-[#777777] truncate mt-0.5">
                  {b.purpose ? `${b.purpose} • ` : ""}Meeting: {timeDisplay}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteOne(b.subject, b.generatedAt);
                }}
                className="p-1.5 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove from history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
