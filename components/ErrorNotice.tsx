import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorNoticeProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorNotice({ message, onRetry }: ErrorNoticeProps) {
  return (
    <div className="w-full max-w-3xl mx-auto my-6 p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-start justify-between gap-3 text-rose-900 text-sm no-print shadow-subtle">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-display font-bold text-xs uppercase tracking-wide text-rose-800">
            Research encountered an issue
          </h4>
          <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-rose-200 text-rose-800 rounded-lg hover:bg-rose-100/60 transition-colors shadow-subtle"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
