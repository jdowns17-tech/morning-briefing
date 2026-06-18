"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  PLANNER_END_MINUTES,
  PLANNER_SLOT_MINUTES,
  PLANNER_START_MINUTES,
  formatDateLabel,
  minutesToLabel,
} from "@/lib/time";
import type { PlannerTaskView } from "@/lib/types";

const ROW_HEIGHT = 32;

interface DayGridProps {
  date: string;
  prevDate: string;
  nextDate: string;
  isToday: boolean;
  tasks: PlannerTaskView[];
  onSlotClick: (startMinutes: number) => void;
  onTaskClick: (task: PlannerTaskView) => void;
}

export function DayGrid({
  date,
  prevDate,
  nextDate,
  isToday,
  tasks,
  onSlotClick,
  onTaskClick,
}: DayGridProps) {
  const slots = useMemo(() => {
    const result: number[] = [];
    for (let m = PLANNER_START_MINUTES; m < PLANNER_END_MINUTES; m += PLANNER_SLOT_MINUTES) {
      result.push(m);
    }
    return result;
  }, []);

  const totalHeight = ((PLANNER_END_MINUTES - PLANNER_START_MINUTES) / PLANNER_SLOT_MINUTES) * ROW_HEIGHT;

  return (
    <div className="h-fit rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`/dashboard?date=${prevDate}`}
          className="rounded p-1 text-slate-500 hover:bg-slate-100"
          aria-label="Previous day"
        >
          ←
        </Link>
        <div className="text-sm font-semibold text-slate-700">
          {formatDateLabel(date)}
          {isToday && (
            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">
              Today
            </span>
          )}
        </div>
        <Link
          href={`/dashboard?date=${nextDate}`}
          className="rounded p-1 text-slate-500 hover:bg-slate-100"
          aria-label="Next day"
        >
          →
        </Link>
      </div>

      <div className="relative ml-10" style={{ height: totalHeight }}>
        {slots.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => onSlotClick(minutes)}
            className="absolute left-0 right-0 border-t border-slate-100 text-left hover:bg-slate-50"
            style={{ top: ((minutes - PLANNER_START_MINUTES) / PLANNER_SLOT_MINUTES) * ROW_HEIGHT, height: ROW_HEIGHT }}
          >
            {minutes % 60 === 0 && (
              <span className="absolute -left-10 -top-2 w-9 text-right text-[10px] text-slate-400">
                {minutesToLabel(minutes)}
              </span>
            )}
          </button>
        ))}

        {tasks.map((task) => {
          const top =
            ((Math.max(task.startMinutes, PLANNER_START_MINUTES) - PLANNER_START_MINUTES) / PLANNER_SLOT_MINUTES) *
            ROW_HEIGHT;
          const height = Math.max(
            ((task.endMinutes - task.startMinutes) / PLANNER_SLOT_MINUTES) * ROW_HEIGHT,
            ROW_HEIGHT / 2,
          );

          return (
            <button
              key={task.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTaskClick(task);
              }}
              className={`absolute left-1 right-1 overflow-hidden rounded-md border px-2 py-1 text-left text-xs shadow-sm ${
                task.completed
                  ? "border-slate-200 bg-slate-100 text-slate-400 line-through"
                  : "border-blue-200 bg-blue-50 text-blue-900"
              }`}
              style={{ top, height }}
            >
              <div className="truncate font-medium">{task.title}</div>
              {task.sourceEmailId && <div className="text-[10px] opacity-70">✉ from email</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
