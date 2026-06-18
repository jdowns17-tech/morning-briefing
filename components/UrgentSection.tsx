"use client";

import { EmailCard } from "@/components/EmailCard";
import type { EmailInsightView } from "@/lib/types";

interface UrgentSectionProps {
  insights: EmailInsightView[];
  onSchedule: (insight: EmailInsightView, actionItem: string) => void;
}

export function UrgentSection({ insights, onSchedule }: UrgentSectionProps) {
  if (insights.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-700">
        <span className="inline-block h-2 w-2 rounded-full bg-red-600" />
        Urgent — {insights.length}
      </h2>
      <div className="space-y-3">
        {insights.map((insight) => (
          <EmailCard key={insight.id} insight={insight} urgent onSchedule={onSchedule} />
        ))}
      </div>
    </section>
  );
}
