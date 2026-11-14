import React from "react";
import { ConfidenceLevel } from "@/lib/schema";

interface ConfidenceBadgeProps {
  confidence?: ConfidenceLevel | string;
}

export function ConfidenceBadge({ confidence = "single-source" }: ConfidenceBadgeProps) {
  const norm = confidence.toLowerCase();

  if (norm === "verified") {
    return (
      <span
        title="Corroborated by 2+ independent sources"
        className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md"
      >
        Verified
      </span>
    );
  }

  if (norm === "uncertain" || norm === "unconfirmed") {
    return (
      <span
        title="Unconfirmed or single thin report — proceed with caution"
        className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-md"
      >
        Unconfirmed
      </span>
    );
  }

  // Default: single-source
  return (
    <span
      title="Reported by a single primary source"
      className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider font-medium text-[#777777] bg-[#F8F8F8] border border-[#EEEEEE] rounded-md"
    >
      Single source
    </span>
  );
}
