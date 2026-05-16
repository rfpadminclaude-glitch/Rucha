"use client";

import { useTransition } from "react";
import { bumpPriority, deleteAnnouncement, toggleActive } from "./actions";

export default function RowControls({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [, startTransition] = useTransition();

  function run(fn: (fd: FormData) => Promise<unknown>, payload: Record<string, string>) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(payload)) fd.set(k, v);
    startTransition(async () => {
      await fn(fd);
    });
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => run(bumpPriority, { id, delta: "1" })}
        title="Raise priority"
        className="text-xs px-2 py-1 rounded hover:bg-gray-100"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => run(bumpPriority, { id, delta: "-1" })}
        title="Lower priority"
        className="text-xs px-2 py-1 rounded hover:bg-gray-100"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={() => run(toggleActive, { id, active: String(active) })}
        className={`text-xs px-2 py-1 rounded ${
          active
            ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {active ? "Deactivate" : "Activate"}
      </button>
      <button
        type="button"
        onClick={() => {
          if (!confirm("Delete this announcement?")) return;
          run(deleteAnnouncement, { id });
        }}
        className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
      >
        ×
      </button>
    </div>
  );
}
