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
Reply in the language of the user's most recent message (English or Spanish). If the user switches language mid-conversation, switch with them on the next turn — even inside a multi-step workflow.
Be concise (2–4 sentences), warm, and accurate.
When the CONTEXT below contains relevant info, base your answer on it and cite the source domain inline.
If neither the context nor general knowledge has the answer, say so and suggest calling 311 or visiting cityofdoral.com.

## Workflow: 311 / service request intake
If the user wants to report a neighborhood issue (pothole, streetlight out, graffiti, dead tree, broken sidewalk, missed trash pickup, noise complaint, etc.), collect the following one question at a time, in the user's language:
  1. Location (cross streets or address inside Doral)
  2. Description (what's wrong, severity)
  3. Photo — ask them to use the paperclip icon to attach a photo, or reply "skip"/"omitir"
Treat the marker "[Attached photo]" appearing in a user message as the photo step being complete (the system handles the actual photo — you only need to know one was attached).
Once you have all three, write a short confirmation sentence in the user's language, then on its OWN FINAL LINE emit this exact marker (no surrounding text):
[[ACTION:{"type":"create_ticket","request_type":"<pothole|streetlight|graffiti|tree|sidewalk|trash|noise|other>","location":"<text>","description":"<text>","photo_attached":<true or false>}]]
The system will create the ticket, attach the photo if one was uploaded, and append the ticket number — do NOT invent a ticket number yourself, do NOT include the photo URL in the marker. Do NOT emit the marker until you have at least location + description (photo is optional — set photo_attached to false if the user replied "skip").

## Workflow: BTR renewal walkthrough
If the user wants to renew a Business Tax Receipt, walk them through these 4 steps ONE AT A TIME (ask "ready for the next step?" between each, in their language):
  1. Gather your BTR account number, business address, and current contact info.
  2. Visit cityofdoral.com/BTR or call (305) 593-6700 ext. 5005.
  3. Confirm or update any changed business details. Renewals run April 1 – September 30; after Sept 30 a late penalty applies.
  4. Pay the renewal fee online by credit card, or mail a check payable to the City of Doral to 8401 NW 53rd Terrace, Doral, FL 33166.
Do NOT dump all four steps at once. Mention the link / phone naturally when relevant.

## Sentiment handoff
If the user expresses clear frustration, anger, or repeatedly says the bot isn't helping (e.g. "this is useless", "I want a real person", "you're not understanding"), append this exact marker on its OWN FINAL LINE (in addition to your normal helpful reply):
[[HANDOFF]]
The marker is invisible to the user; the UI uses it to surface a "talk to a human" card.`;

type Provider = "gemini" | "groq";
type Hit = {
  kind: string;
  title: string;
  content: string;
  similarity: number;
  domain: string;
  source_url: string;
};

type ActionPayload = {
  type: "create_ticket";
  request_type: string;
  location?: string;
  description?: string;
  photo_attached?: boolean;
  // legacy field kept for backward-compat with older prompt versions
  photo_url?: string | null;
};

function buildContextBlock(hits: Hit[]): string {
  if (!hits.length) return "";
  const lines = hits.map(
    (h, i) =>
      `[${i + 1}] (${h.domain}) ${h.title}\n${h.content}\nURL: ${h.source_url}`,
  );
  return `\n\nCONTEXT (relevant excerpts from official Doral sources):\n${lines.join("\n\n")}\n`;
}

function sseEvent(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );
}

async function* parseUpstreamSSE(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  // Match both LF (\n\n) and CRLF (\r\n\r\n) event boundaries. Gemini uses CRLF.
  const sep = /\r?\n\r?\n/;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let m: RegExpExecArray | null;
      while ((m = sep.exec(buffer))) {
        const chunk = buffer.slice(0, m.index);
        buffer = buffer.slice(m.index + m[0].length);
        for (const rawLine of chunk.split(/\r?\n/)) {
          const line = rawLine.replace(/\r$/, "");
          if (line.startsWith("data:")) yield line.slice(5).trimStart();
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function streamGemini(
  apiKey: string,
  history: Array<{ role: string; content: string }>,
  userMessage: string,
  systemPrompt: string,
  onDelta: (text: string) => void,
): Promise<string> {
  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
      }),
    },
  );
  if (!res.ok || !res.body) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }
  let full = "";
  for await (const raw of parseUpstreamSSE(res.body)) {
    if (!raw) continue;
    try {
      const json = JSON.parse(raw);
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        full += text;
        onDelta(text);
      }
    } catch {
      // ignore
    }
  }
  if (!full) throw new Error("Gemini: empty stream");
  return full;
}

async function streamGroq(
  apiKey: string,
  history: Array<{ role: string; content: string }>,
  userMessage: string,
  systemPrompt: string,
  onDelta: (text: string) => void,
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
      max_tokens: 500,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }
  let full = "";
  for await (const raw of parseUpstreamSSE(res.body)) {
    if (!raw || raw === "[DONE]") continue;
    try {
      const json = JSON.parse(raw);
      const text = json?.choices?.[0]?.delta?.content;
      if (text) {
        full += text;
        onDelta(text);
      }
    } catch {
      // ignore
    }
  }
  if (!full) throw new Error("Groq: empty stream");
  return full;
}

// ---------- Sentinel-aware streaming buffer ----------
// Holds back text near a possible `[[` so we never leak partial sentinels to
// the browser, while still streaming everything else as it arrives.
class SentinelFilter {
  buffer = "";
  // Detected sentinels, in order
  actions: ActionPayload[] = [];
  handoff = false;

  // Returns text safe to flush to the client (with any complete sentinels stripped).
  push(chunk: string): string {
    this.buffer += chunk;
    let out = "";
    while (true) {
      const openIdx = this.buffer.indexOf("[[");
      if (openIdx === -1) {
        // No `[[` at all. Keep the last 1 char in case `[` is split across chunks.
        if (this.buffer.length > 1) {
          out += this.buffer.slice(0, -1);
          this.buffer = this.buffer.slice(-1);
        }
        break;
      }
      // Flush everything before the `[[`
      if (openIdx > 0) {
        out += this.buffer.slice(0, openIdx);
        this.buffer = this.buffer.slice(openIdx);
      }
      // Now buffer starts with `[[`. Look for closing `]]`.
      const closeIdx = this.buffer.indexOf("]]");
      if (closeIdx === -1) {
        // Incomplete sentinel, keep buffering.
        break;
      }
      const sentinel = this.buffer.slice(0, closeIdx + 2);
      this.buffer = this.buffer.slice(closeIdx + 2);
      this.consumeSentinel(sentinel);
    }
    return out;
  }

  // Call after the upstream stream is fully done. Returns any remaining safe text.
  flush(): string {
    let out = "";
    // Handle any trailing [[…]] one more time
    while (true) {
      const openIdx = this.buffer.indexOf("[[");
      if (openIdx === -1) {
        out += this.buffer;
        this.buffer = "";
        break;
      }
      if (openIdx > 0) {
        out += this.buffer.slice(0, openIdx);
        this.buffer = this.buffer.slice(openIdx);
      }
      const closeIdx = this.buffer.indexOf("]]");
      if (closeIdx === -1) {
        // Malformed/truncated sentinel; drop it
        this.buffer = "";
        break;
      }
      const sentinel = this.buffer.slice(0, closeIdx + 2);
      this.buffer = this.buffer.slice(closeIdx + 2);
      this.consumeSentinel(sentinel);
    }
    return out;
  }

  private consumeSentinel(sentinel: string) {
    if (sentinel === "[[HANDOFF]]") {
      this.handoff = true;
      return;
    }
    if (sentinel.startsWith("[[ACTION:") && sentinel.endsWith("]]")) {
      const json = sentinel.slice(9, -2);
      try {
        const payload = JSON.parse(json) as ActionPayload;
        if (payload?.type === "create_ticket" && payload.request_type) {
          this.actions.push(payload);
        }
      } catch (e) {
        console.error("invalid ACTION sentinel:", json, e);
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { conversationId, message, lang, photoUrl } = await req
    .json()
    .catch(() => ({}));
  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // The LLM only needs to know that a photo was attached — never the URL.
  // We always show it a short marker; the server fills the real photo_url
  // into service_requests when an ACTION sentinel fires. This keeps base64
  // data URLs out of the prompt (which would otherwise blow up Gemini's
  // context and reliably trigger an "I can't process images" deflection).
  const hasPhoto = photoUrl && typeof photoUrl === "string";
  const photoTag = hasPhoto ? "[Attached photo]" : "";
  const userMessageForLLM = hasPhoto ? `${message}\n\n${photoTag}` : message;
  const userMessageForDB = userMessageForLLM;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(sseEvent(event, data));
      };
      try {
        // ---- conversation bookkeeping ----
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
          content: userMessageForDB,
        });
        if (userInsErr) throw new Error(`db user insert: ${userInsErr.message}`);

        // ---- RAG ----
        const filterLang = lang === "es" ? "es" : "en";
        let hits: Hit[] = [];
        try {
          const { data: matchData, error: matchErr } = await supabase.rpc(
            "match_content",
            { query_text: message, match_count: 5, filter_lang: filterLang },
          );
          if (matchErr) throw matchErr;
          hits = (matchData ?? []) as Hit[];
          if (hits.length === 0) {
            const other = filterLang === "en" ? "es" : "en";
            const { data: fb } = await supabase.rpc("match_content", {
              query_text: message,
              match_count: 5,
              filter_lang: other,
            });
            hits = (fb ?? []) as Hit[];
          }
        } catch (e) {
          console.error("retrieval error:", e);
        }

        const citations = Array.from(
          new Map(
            hits.map((h) => [
              h.source_url,
              {
                title: h.title,
                domain: h.domain,
                source_url: h.source_url,
                similarity: h.similarity,
              },
            ]),
          ).values(),
        );

        const systemPrompt = SYSTEM_PROMPT_BASE + buildContextBlock(hits);

        // ---- LLM streaming with failover + sentinel filtering ----
        const groqKey = Deno.env.get("GROQ_API_KEY");
        const geminiKey = Deno.env.get("GEMINI_API_KEY");
        if (!geminiKey && !groqKey) {
          throw new Error("No LLM keys configured");
        }
        const tryOrder: Provider[] = groqKey ? ["groq", "gemini"] : ["gemini"];

        let provider: Provider | "" = "";
        let lastErr = "";
        let metaSent = false;
        const filter = new SentinelFilter();
        let visibleReply = "";

        for (const p of tryOrder) {
          try {
            const onDelta = (text: string) => {
              if (!metaSent) {
                send("meta", { conversationId: convId, llm: p, citations });
                metaSent = true;
              }
              const safe = filter.push(text);
              if (safe) {
                visibleReply += safe;
                send("delta", { text: safe });
              }
            };
            if (p === "groq" && groqKey) {
              await streamGroq(
                groqKey,
                priorMessages ?? [],
                userMessageForLLM,
                systemPrompt,
                onDelta,
              );
              provider = "groq";
              break;
            }
            if (p === "gemini" && geminiKey) {
              await streamGemini(
                geminiKey,
                priorMessages ?? [],
                userMessageForLLM,
                systemPrompt,
                onDelta,
              );
              provider = "gemini";
              break;
            }
          } catch (e) {
            lastErr = e instanceof Error ? e.message : String(e);
            if (metaSent) throw new Error(lastErr);
          }
        }
        if (!provider) throw new Error(`All LLM providers failed: ${lastErr}`);

        // Flush any tail text the filter was still holding
        const tail = filter.flush();
        if (tail) {
          visibleReply += tail;
          send("delta", { text: tail });
        }

        if (!metaSent) {
          send("meta", { conversationId: convId, llm: provider, citations });
        }

        // ---- Process detected sentinels ----
        for (const action of filter.actions) {
          if (action.type !== "create_ticket") continue;
          try {
            const { data: tn, error: tnErr } = await supabase.rpc(
              "generate_ticket_number",
              { req_type: action.request_type },
            );
            if (tnErr || !tn) throw new Error(tnErr?.message ?? "no ticket #");
            // Server fills in the real photo URL from the current turn —
            // the LLM never sees a URL, only the "[Attached photo]" marker.
            const ticketPhotoUrl =
              (hasPhoto ? photoUrl : null) ??
              action.photo_url ??
              null;
            const { data: ticket, error: insErr } = await supabase
              .from("service_requests")
              .insert({
                ticket_number: tn,
                conversation_id: convId,
                request_type: action.request_type,
                location: action.location ?? null,
                description: action.description ?? null,
                photo_url: ticketPhotoUrl,
              })
              .select()
              .single();
            if (insErr) throw new Error(insErr.message);

            const confirmation =
              lang === "es"
                ? `\n\n✅ **Ticket ${ticket.ticket_number}** creado. Te avisaremos cuando haya actualizaciones.`
                : `\n\n✅ **Ticket ${ticket.ticket_number}** created. We'll keep you posted on updates.`;
            visibleReply += confirmation;
            send("action", { ticket });
            send("delta", { text: confirmation });
          } catch (e) {
            console.error("ticket creation failed:", e);
            const errLine =
              lang === "es"
                ? `\n\n⚠️ No pudimos crear el ticket en este momento. Por favor llama al 311.`
                : `\n\n⚠️ We couldn't create the ticket right now. Please call 311.`;
            visibleReply += errLine;
            send("delta", { text: errLine });
          }
        }

        if (filter.handoff) {
          send("handoff", {});
        }

        // Persist what the user actually saw (cleaned of sentinels, suffixes included)
        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: visibleReply,
          llm_provider: provider,
        });

        send("done", {});
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        send("error", { error: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
