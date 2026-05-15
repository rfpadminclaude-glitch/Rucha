"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function testBackend() {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const { data, error } = await supabase.functions.invoke("hello", {
        body: {},
      });
      if (error) throw error;
      setResponse(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-white">
      <div className="max-w-2xl w-full space-y-8">
        <header className="space-y-2">
          <div className="inline-block px-3 py-1 rounded bg-doral-navy text-white text-xs font-semibold tracking-wider uppercase">
            Phase 0
          </div>
          <h1 className="text-4xl font-bold text-doral-navy">
            Doral POC — Backend Wired
          </h1>
          <p className="text-gray-600">
            Next.js 14 + Supabase Edge Functions. Click the button to verify the
            full round trip.
          </p>
        </header>

        <div className="space-y-4">
          <button
            onClick={testBackend}
            disabled={loading}
            className="px-6 py-3 rounded font-semibold bg-doral-navy text-white hover:bg-doral-navy/90 disabled:opacity-50 transition border-b-4 border-doral-gold"
          >
            {loading ? "Calling Edge Function..." : "Test backend"}
          </button>

          {response && (
            <div className="rounded border border-doral-navy/20 bg-doral-navy/5 p-4">
              <div className="text-xs uppercase tracking-wider text-doral-navy font-semibold mb-2">
                Response
              </div>
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {response}
              </pre>
            </div>
          )}

          {error && (
            <div className="rounded border border-red-300 bg-red-50 p-4">
              <div className="text-xs uppercase tracking-wider text-red-700 font-semibold mb-2">
                Error
              </div>
              <pre className="text-sm text-red-800 whitespace-pre-wrap">
                {error}
              </pre>
            </div>
          )}
        </div>

        <footer className="text-xs text-gray-500 border-t pt-4">
          Next: Phase 1 — thin-slice chat widget with LLM failover (Gemini
          primary; Groq once key arrives).
        </footer>
      </div>
    </main>
  );
}
