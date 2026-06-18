"use client";

import { useState } from "react";
import { SyncButton } from "@/components/SyncButton";
import { UrgentSection } from "@/components/UrgentSection";
import { DigestSection } from "@/components/DigestSection";
import { NoiseSection } from "@/components/NoiseSection";
import { DayGrid } from "@/components/Planner/DayGrid";
import { AddTaskModal } from "@/components/Planner/AddTaskModal";
import type { EmailInsightView, PlannerTaskView, TaskDraft } from "@/lib/types";

interface CommandCenterProps {
  urgent: EmailInsightView[];
  digest: EmailInsightView[];
  noise: EmailInsightView[];
  tasks: PlannerTaskView[];
  date: string;
  prevDate: string;
  nextDate: string;
  isToday: boolean;
  hasAnyInsights: boolean;
  sessionError?: string;
}

export function CommandCenter({
  urgent,
  digest,
  noise,
  tasks,
  date,
  prevDate,
  nextDate,
  isToday,
  hasAnyInsights,
  sessionError,
}: CommandCenterProps) {
  const [draft, setDraft] = useState<TaskDraft | null>(null);

  function openForSlot(startMinutes: number) {
    setDraft({ date, startMinutes, endMinutes: startMinutes + 30, title: "" });
  }

  function openForTask(task: PlannerTaskView) {
    setDraft({
      id: task.id,
      date,
      startMinutes: task.startMinutes,
      endMinutes: task.endMinutes,
      title: task.title,
      notes: task.notes ?? "",
      sourceEmailId: task.sourceEmailId ?? undefined,
    });
  }

  function openForEmail(insight: EmailInsightView, actionItem: string) {
    setDraft({
      date,
      startMinutes: 9 * 60,
      endMinutes: 9 * 60 + 30,
      title: actionItem,
      sourceEmailId: insight.gmailId,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {sessionError && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your Google session needs refreshing — sign out and back in to keep syncing Gmail.
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Inbox digest</h2>
          <SyncButton />
        </div>

        {!hasAnyInsights && (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No emails synced yet. Click &ldquo;Sync Gmail&rdquo; to scan the last 30 days.
          </div>
        )}

        <UrgentSection insights={urgent} onSchedule={openForEmail} />
        <DigestSection insights={digest} onSchedule={openForEmail} />
        <NoiseSection insights={noise} />
      </div>

      <DayGrid
        date={date}
        prevDate={prevDate}
        nextDate={nextDate}
        isToday={isToday}
        tasks={tasks}
        onSlotClick={openForSlot}
        onTaskClick={openForTask}
      />

      {draft && <AddTaskModal draft={draft} onClose={() => setDraft(null)} />}
    </div>
  );
}
