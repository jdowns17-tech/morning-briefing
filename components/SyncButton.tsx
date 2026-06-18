"use client";

import { useState, useTransition } from "react";
import { syncGmail } from "@/app/dashboard/actions";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await syncGmail();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setMessage(
        result.synced === 0
          ? "Already up to date."
          : `Synced ${result.synced} new email${result.synced === 1 ? "" : "s"}.`,
      );
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Syncing…" : "Sync Gmail"}
      </button>
      {message && <span className="text-sm text-slate-500">{message}</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
