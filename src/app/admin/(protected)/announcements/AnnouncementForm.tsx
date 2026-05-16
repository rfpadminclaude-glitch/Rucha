"use client";

import { useRef, useState, useTransition } from "react";
import { createAnnouncement } from "./actions";

export default function AnnouncementForm() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        setError("");
        startTransition(async () => {
          const r = await createAnnouncement(fd);
          if (r?.error) setError(r.error);
          else formRef.current?.reset();
        });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-doral-navy">EN</div>
          <input
            name="title_en"
            placeholder="Title (English)"
            required
            className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doral-navy"
          />
          <textarea
            name="body_en"
            placeholder="Body (English)"
            required
            rows={3}
            className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doral-navy"
          />
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-doral-navy">ES</div>
          <input
            name="title_es"
            placeholder="Título (Español)"
            required
            className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doral-navy"
          />
          <textarea
            name="body_es"
            placeholder="Cuerpo (Español)"
            required
            rows={3}
            className="block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doral-navy"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="text-xs flex items-center gap-2">
          <input
            type="number"
            name="priority"
            defaultValue={0}
            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <span className="text-gray-600">Priority</span>
        </label>
        <label className="text-xs flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked />
          <span className="text-gray-600">Active immediately</span>
        </label>
        <div className="flex-1" />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded bg-doral-navy text-white text-sm font-semibold disabled:opacity-50 border-b-2 border-doral-gold"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
      {error && (
        <div role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
    </form>
  );
}
