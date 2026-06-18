"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createTask, deleteTask, updateTask } from "@/app/dashboard/actions";
import { PLANNER_END_MINUTES, PLANNER_SLOT_MINUTES, PLANNER_START_MINUTES, minutesToLabel } from "@/lib/time";
import type { TaskDraft } from "@/lib/types";

const DURATIONS = [15, 30, 45, 60, 90, 120];

function startTimeOptions(): number[] {
  const options: number[] = [];
  for (let m = PLANNER_START_MINUTES; m < PLANNER_END_MINUTES; m += PLANNER_SLOT_MINUTES) {
    options.push(m);
  }
  return options;
}

interface AddTaskModalProps {
  draft: TaskDraft;
  onClose: () => void;
}

export function AddTaskModal({ draft, onClose }: AddTaskModalProps) {
  const [title, setTitle] = useState(draft.title);
  const [notes, setNotes] = useState(draft.notes ?? "");
  const [startMinutes, setStartMinutes] = useState(draft.startMinutes);
  const [duration, setDuration] = useState(draft.endMinutes - draft.startMinutes);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(draft.id);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const endMinutes = Math.min(startMinutes + duration, PLANNER_END_MINUTES);

    startTransition(async () => {
      try {
        if (draft.id) {
          await updateTask(draft.id, { title, notes: notes || null, startMinutes, endMinutes });
        } else {
          await createTask({
            date: draft.date,
            title,
            notes,
            startMinutes,
            endMinutes,
            sourceEmailId: draft.sourceEmailId,
          });
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function handleDelete() {
    if (!draft.id) return;
    startTransition(async () => {
      try {
        await deleteTask(draft.id!);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
      >
        <h3 className="text-base font-semibold text-slate-900">
          {isEditing ? "Edit task" : "Schedule task"}
        </h3>

        <label className="mt-4 block text-xs font-medium text-slate-500">Title</label>
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <div className="mt-3 flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500">Start</label>
            <select
              value={startMinutes}
              onChange={(event) => setStartMinutes(Number(event.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              {startTimeOptions().map((m) => (
                <option key={m} value={m}>
                  {minutesToLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500">Duration</label>
            <select
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="mt-3 block text-xs font-medium text-slate-500">Notes</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <div className="mt-5 flex items-center justify-between">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isPending ? "Saving…" : isEditing ? "Save" : "Add"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
