import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT_BASE = `You are the official AI assistant for the City of Doral, Florida.
You help residents with city services: permits, Business Tax Receipts (BTR), parks, events, 311 reports, hurricane preparedness, code enforcement, and Doral Police Department services.
Reply in the language of the user's most recent message (English or Spanish).
Be concise (2–4 sentences), warm, and accurate.
When the CONTEXT below contains relevant info, base your answer on it and cite the source domain inline.
If neither the context nor general knowledge has the answer, say so and suggest calling 311 or visiting cityofdoral.com.`;

type Provider = "gemini" | "groq";
type Hit = {
  kind: string;
  title: string;
  content: string;
  similarity: number;
  domain: string;
  source_url: string;
};

function buildContextBlock(hits: Hit[]): string {
  if (!hits.length) return "";
  const lines = hits.map(
    (h, i) =>
      `[${i + 1}] (${h.domain}) ${h.title}\n${h.content}\nURL: ${h.source_url}`,
  );
  return `\n\nCONTEXT (relevant excerpts from official Doral sources):\n${lines.join("\n\n")}\n`;
}

async function callGemini(
  apiKey: string,
  history: Array<{ role: string; content: string }>,
  userMessage: string,
  systemPrompt: string,
): Promise<string> {
  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: empty response");
  return text;
}

async function callGroq(
  apiKey: string,
  history: Array<{ role: string; content: string }>,
  userMessage: string,
  systemPrompt: string,
): Promise<string> {
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.4,
      max_tokens: 400,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq: empty response");
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { conversationId, message, lang } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let convId = conversationId as string | undefined;
    if (!convId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_lang: lang === "es" ? "es" : "en" })
        .select("id")
        .single();
      if (error) throw new Error(`db conversation insert: ${error.message}`);
      convId = data.id;
    }

    const { data: priorMessages, error: histErr } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (histErr) throw new Error(`db history: ${histErr.message}`);

    const { error: userInsErr } = await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });
    if (userInsErr) throw new Error(`db user insert: ${userInsErr.message}`);

    // ---- RAG retrieval via match_content RPC (FTS) ----
    const filterLang = lang === "es" ? "es" : "en";
    let hits: Hit[] = [];
    try {
      const { data: matchData, error: matchErr } = await supabase.rpc(
        "match_content",
        { query_text: message, match_count: 5, filter_lang: filterLang },
      );
      if (matchErr) throw matchErr;
      hits = (matchData ?? []) as Hit[];

      // If nothing matched in the user's language, try the other language as a fallback.
      if (hits.length === 0) {
        const otherLang = filterLang === "en" ? "es" : "en";
        const { data: fallback } = await supabase.rpc("match_content", {
          query_text: message,
          match_count: 5,
          filter_lang: otherLang,
        });
        hits = (fallback ?? []) as Hit[];
      }
    } catch (e) {
      console.error("retrieval error:", e);
    }

    const systemPrompt = SYSTEM_PROMPT_BASE + buildContextBlock(hits);

    const groqKey = Deno.env.get("GROQ_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey && !groqKey) {
      throw new Error("No LLM keys configured (need GEMINI_API_KEY or GROQ_API_KEY)");
    }

    let reply = "";
    let provider: Provider | "" = "";
    let lastErr = "";
    const tryOrder: Provider[] = groqKey ? ["groq", "gemini"] : ["gemini"];
    for (const p of tryOrder) {
      try {
        if (p === "groq" && groqKey) {
          reply = await callGroq(groqKey, priorMessages ?? [], message, systemPrompt);
          provider = "groq";
          break;
        }
        if (p === "gemini" && geminiKey) {
          reply = await callGemini(geminiKey, priorMessages ?? [], message, systemPrompt);
          provider = "gemini";
          break;
        }
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        continue;
      }
    }
    if (!provider) {
      throw new Error(`All LLM providers failed. Last error: ${lastErr}`);
    }

    const { error: asstInsErr } = await supabase.from("messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: reply,
      llm_provider: provider,
    });
    if (asstInsErr) throw new Error(`db assistant insert: ${asstInsErr.message}`);

    // De-dup citations by source_url
    const citations = Array.from(
      new Map(
        hits.map((h) => [
          h.source_url,
          { title: h.title, domain: h.domain, source_url: h.source_url, similarity: h.similarity },
        ]),
      ).values(),
    );

    return new Response(
      JSON.stringify({
        reply,
        llm: provider,
        conversationId: convId,
        citations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
