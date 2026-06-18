"use client";

import { EmailCard } from "@/components/EmailCard";
import type { EmailInsightView } from "@/lib/types";

interface DigestSectionProps {
  insights: EmailInsightView[];
  onSchedule: (insight: EmailInsightView, actionItem: string) => void;
}

export function DigestSection({ insights, onSchedule }: DigestSectionProps) {
  if (insights.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Digest — {insights.length}
      </h2>
      <div className="space-y-3">
        {insights.map((insight) => (
          <EmailCard key={insight.id} insight={insight} onSchedule={onSchedule} />
        ))}
      </div>
    </section>
  );
}
