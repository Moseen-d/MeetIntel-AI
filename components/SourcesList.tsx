import React from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";

interface SourceItem {
  id: number;
  title: string;
  url: string;
  date?: string;
}

interface SourcesListProps {
  sources: SourceItem[];
}

export function SourcesList({ sources }: SourcesListProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div id="sources" className="mt-10 pt-8 border-t border-[#EEEEEE]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xs uppercase tracking-wider font-bold text-[#111111] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#E83FCB]" /> Sources & Grounded Citations
        </h3>
        <span className="text-[11px] font-mono text-[#777777]">
          {sources.length} Verified {sources.length === 1 ? "Link" : "Links"}
        </span>
      </div>

      <ol className="space-y-2.5 text-xs text-[#111111]">
        {sources.map((s) => {
          let domain = "";
          try {
            domain = new URL(s.url).hostname.replace(/^www\./, "");
          } catch {
            domain = "web";
          }

          return (
            <li
              key={s.id}
              id={`source-${s.id}`}
              className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#F8F8F8] transition-colors -ml-2 group"
            >
              <span className="font-mono text-[#E83FCB] font-bold shrink-0">
                [{s.id}]
              </span>
              <div className="flex-1 flex flex-wrap items-baseline gap-x-2">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-[#E83FCB] underline decoration-[#DDDDDD] hover:decoration-[#E83FCB] underline-offset-2 inline-flex items-center gap-1 transition-colors"
                >
                  <span>{s.title || domain}</span>
                  <ExternalLink className="w-3 h-3 text-[#777777] opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <span className="text-[#777777] text-[11px] font-mono">
                  ({domain}{s.date ? ` • ${s.date}` : ""})
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
