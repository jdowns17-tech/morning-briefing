import type { EmailInsightView } from "@/lib/types";

interface NoiseSectionProps {
  insights: EmailInsightView[];
}

export function NoiseSection({ insights }: NoiseSectionProps) {
  if (insights.length === 0) return null;

  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-slate-500">
        Noise — newsletters & promotions ({insights.length})
      </summary>
      <ul className="space-y-1.5 border-t border-slate-200 px-4 py-3">
        {insights.map((insight) => (
          <li key={insight.id} className="truncate text-xs text-slate-400">
            {insight.subject} <span className="text-slate-300">— {insight.sender}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
