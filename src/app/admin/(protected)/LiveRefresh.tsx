"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Props = {
  /** Table names (public schema) to listen to. Defaults to the overview-relevant set. */
  tables?: string[];
  /** Min milliseconds between router.refresh() calls. */
  debounceMs?: number;
};

const DEFAULT_TABLES = [
  "conversations",
  "messages",
  "service_requests",
  "announcements",
  "faqs",
];

export default function LiveRefresh({
  tables = DEFAULT_TABLES,
  debounceMs = 600,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"connecting" | "live" | "error">(
    "connecting",
  );
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tick the "x s ago" label once per second.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("admin-live");

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          setLastEventAt(new Date());
          if (pendingRef.current) clearTimeout(pendingRef.current);
          pendingRef.current = setTimeout(() => {
            router.refresh();
            pendingRef.current = null;
          }, debounceMs);
        },
      );
    }

    channel.subscribe((s) => {
      if (s === "SUBSCRIBED") setStatus("live");
      else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("error");
    });

    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      supabase.removeChannel(channel);
    };
  }, [router, tables, debounceMs]);

  const ago = lastEventAt
    ? Math.max(0, Math.floor((now - lastEventAt.getTime()) / 1000))
    : null;
  const agoLabel =
    ago == null
      ? "waiting for changes"
      : ago < 60
        ? `updated ${ago}s ago`
        : `updated ${Math.floor(ago / 60)}m ago`;

  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] text-gray-600"
      title={`Realtime: ${status}`}
      aria-live="polite"
    >
      <span className="relative inline-flex h-2 w-2">
        {status === "live" && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            status === "live"
              ? "bg-green-500"
              : status === "error"
                ? "bg-red-500"
                : "bg-gray-400"
          }`}
        />
      </span>
      <span className="font-semibold uppercase tracking-wider">
        {status === "live" ? "Live" : status === "error" ? "Offline" : "…"}
      </span>
      <span className="text-gray-400">·</span>
      <span>{agoLabel}</span>
    </span>
  );
}
