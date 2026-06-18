"use client";

import type { EmailInsightView } from "@/lib/types";

interface EmailCardProps {
  insight: EmailInsightView;
  urgent?: boolean;
  onSchedule: (insight: EmailInsightView, actionItem: string) => void;
}

export function EmailCard({ insight, urgent, onSchedule }: EmailCardProps) {
  return (
    <article
      className={`rounded-lg border p-4 shadow-sm ${
        urgent ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-sm font-semibold ${urgent ? "text-red-900" : "text-slate-900"}`}>
            {insight.subject}
          </p>
          <p className="truncate text-xs text-slate-500">{insight.sender}</p>
        </div>
        {urgent && (
          <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Alert
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-slate-700">{insight.summary}</p>

      {insight.actionItems.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {insight.actionItems.map((item, index) => (
            <li key={index} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-700">• {item}</span>
              <button
                type="button"
                onClick={() => onSchedule(insight, item)}
                className="shrink-0 rounded border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                + Schedule
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
