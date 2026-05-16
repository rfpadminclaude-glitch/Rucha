"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Citation = {
  title: string;
  domain: string;
  source_url: string;
  similarity: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  llm?: "gemini" | "groq";
  citations?: Citation[];
  streaming?: boolean;
};

const COPY = {
  en: {
    welcome:
      "Hi! I'm the City of Doral assistant. Ask me about permits, BTR, parks, 311 reports, or anything else.",
    subtitle: "Ask anything",
    placeholder: "Type a message…",
    send: "Send",
    thinking: "Thinking",
    suggestionsLabel: "Try one of these",
    suggestions: [
      "How do I apply for a BTR?",
      "Report a pothole",
      "What are the park hours?",
      "Hurricane preparation tips",
      "Non-emergency police number",
    ],
    ratingPrompt: "How was this chat?",
    ratingThanks: "Thanks for the feedback!",
    ratingDismiss: "Not now",
    fileLabel: "Attach a file (coming soon)",
    voiceLabel: "Voice input (coming soon)",
    close: "Close chat",
    open: "Open chat",
  },
  es: {
    welcome:
      "¡Hola! Soy el asistente de la Ciudad de Doral. Pregúntame sobre permisos, BTR, parques, 311, o cualquier otra cosa.",
    subtitle: "Pregunta lo que sea",
    placeholder: "Escribe un mensaje…",
    send: "Enviar",
    thinking: "Pensando",
    suggestionsLabel: "Prueba una de estas",
    suggestions: [
      "¿Cómo solicito un BTR?",
      "Reportar un bache",
      "¿Cuál es el horario de los parques?",
      "Consejos de huracanes",
      "Policía sin emergencia",
    ],
    ratingPrompt: "¿Cómo estuvo este chat?",
    ratingThanks: "¡Gracias por tus comentarios!",
    ratingDismiss: "Ahora no",
    fileLabel: "Adjuntar archivo (próximamente)",
    voiceLabel: "Entrada de voz (próximamente)",
    close: "Cerrar chat",
    open: "Abrir chat",
  },
} as const;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type SSEEvent = { event: string; data: string };

async function* readSSE(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SSEEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        let event = "message";
        let data = "";
        for (const line of chunk.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trimStart();
        }
        yield { event, data };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [ratingState, setRatingState] = useState<
    "hidden" | "prompt" | "submitted" | "dismissed"
  >("hidden");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const t = COPY[lang];

  const assistantTurns = useMemo(
    () => messages.filter((m) => m.role === "assistant" && !m.streaming).length,
    [messages],
  );

  // Show rating prompt once user has had 3+ completed assistant turns
  useEffect(() => {
    if (
      ratingState === "hidden" &&
      assistantTurns >= 3 &&
      conversationId
    ) {
      setRatingState("prompt");
    }
  }, [assistantTurns, conversationId, ratingState]);

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  // Focus management when opening / closing
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      // Defer to next tick so the panel is mounted
      setTimeout(() => inputRef.current?.focus(), 0);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus?.();
      previousFocusRef.current = null;
    }
  }, [open]);

  // Esc closes the panel
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setInput("");
    setError("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);

    // Placeholder assistant message we mutate as deltas arrive
    setMessages((m) => [
      ...m,
      { role: "assistant", content: "", streaming: true },
    ]);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({ message: text, lang, conversationId }),
      });
      if (!res.ok || !res.body) {
        const errTxt = await res.text();
        throw new Error(errTxt || `HTTP ${res.status}`);
      }

      // Back-compat: if the edge function hasn't been redeployed to the
      // streaming version yet, it returns JSON. Render it as a one-shot reply
      // so we never leave the user staring at typing dots.
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("text/event-stream")) {
        const data = await res.json();
        if (data?.error) throw new Error(data.error);
        setConversationId(data.conversationId);
        setMessages((m) => {
          const next = [...m];
          const last = next[next.length - 1];
          if (last?.streaming) {
            next[next.length - 1] = {
              role: "assistant",
              content: data.reply ?? "",
              llm: data.llm,
              citations: data.citations,
              streaming: false,
            };
          }
          return next;
        });
        return;
      }

      let sawDone = false;
      for await (const evt of readSSE(res.body)) {
        if (evt.event === "meta") {
          const meta = JSON.parse(evt.data) as {
            conversationId: string;
            llm: "gemini" | "groq";
            citations: Citation[];
          };
          setConversationId(meta.conversationId);
          setMessages((m) => {
            const next = [...m];
            const last = next[next.length - 1];
            if (last?.streaming) {
              next[next.length - 1] = {
                ...last,
                llm: meta.llm,
                citations: meta.citations,
              };
            }
            return next;
          });
        } else if (evt.event === "delta") {
          const { text: delta } = JSON.parse(evt.data) as { text: string };
          setMessages((m) => {
            const next = [...m];
            const last = next[next.length - 1];
            if (last?.streaming) {
              next[next.length - 1] = {
                ...last,
                content: last.content + delta,
              };
            }
            return next;
          });
        } else if (evt.event === "error") {
          const { error: e } = JSON.parse(evt.data) as { error: string };
          throw new Error(e);
        } else if (evt.event === "done") {
          sawDone = true;
          setMessages((m) => {
            const next = [...m];
            const last = next[next.length - 1];
            if (last?.streaming) {
              next[next.length - 1] = { ...last, streaming: false };
            }
            return next;
          });
        }
      }
      if (!sawDone) {
        throw new Error(
          "Stream ended unexpectedly. The chat function may need to be redeployed (supabase functions deploy chat).",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      // Remove the empty streaming placeholder if the request failed before any text
      setMessages((m) => {
        const last = m[m.length - 1];
        if (last?.streaming && !last.content) return m.slice(0, -1);
        if (last?.streaming) {
          return [...m.slice(0, -1), { ...last, streaming: false }];
        }
        return m;
      });
    } finally {
      setSending(false);
    }
  }

  async function submitRating(stars: number) {
    if (!conversationId) return;
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({ conversationId, rating: stars }),
      });
      setRatingState("submitted");
    } catch {
      // Silent fail — keep prompt open so user can retry
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        ref={launcherRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t.close : t.open}
        aria-expanded={open}
        aria-controls="doral-chat-panel"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-doral-navy text-white shadow-lg hover:scale-105 transition flex items-center justify-center border-b-4 border-doral-gold focus:outline-none focus:ring-4 focus:ring-doral-gold/60"
      >
        <span aria-hidden="true" className="text-xl">
          {open ? "×" : "💬"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="doral-chat-panel"
            role="dialog"
            aria-modal="false"
            aria-label="City of Doral chat assistant"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] rounded-lg shadow-2xl bg-white border border-doral-navy/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-doral-navy text-white p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">City of Doral Assistant</div>
                <div className="text-xs text-white/70">{t.subtitle}</div>
              </div>
              <div
                className="flex gap-1 text-xs"
                role="group"
                aria-label="Language"
              >
                <button
                  onClick={() => setLang("en")}
                  aria-pressed={lang === "en"}
                  className={`px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-doral-gold ${lang === "en" ? "bg-doral-gold text-doral-navy font-semibold" : "bg-white/10 hover:bg-white/20"}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang("es")}
                  aria-pressed={lang === "es"}
                  className={`px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-doral-gold ${lang === "es" ? "bg-doral-gold text-doral-navy font-semibold" : "bg-white/10 hover:bg-white/20"}`}
                >
                  ES
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
            >
              <div className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-3 max-w-[85%]">
                {t.welcome}
              </div>

              {/* Quick replies (only before any messages) */}
              {messages.length === 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
                    {t.suggestionsLabel}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white border border-doral-navy/30 text-doral-navy hover:bg-doral-navy hover:text-white transition focus:outline-none focus:ring-2 focus:ring-doral-gold"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={m.role === "user" ? "flex justify-end" : ""}
                  >
                    <div
                      className={
                        m.role === "user"
                          ? "bg-doral-navy text-white rounded-lg p-3 max-w-[85%] text-sm"
                          : "bg-white border border-gray-200 rounded-lg p-3 max-w-[85%] text-sm text-gray-800"
                      }
                      aria-live={
                        m.role === "assistant" && m.streaming
                          ? "polite"
                          : undefined
                      }
                      aria-atomic={
                        m.role === "assistant" && m.streaming ? false : undefined
                      }
                    >
                      <div className="whitespace-pre-wrap">
                        {m.content || (m.streaming && (
                          <TypingDots label={t.thinking} />
                        ))}
                        {m.streaming && m.content && (
                          <span
                            className="inline-block w-1.5 h-3 ml-0.5 align-middle bg-doral-navy/60 animate-pulse"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      {m.role === "assistant" &&
                        !m.streaming &&
                        m.citations &&
                        m.citations.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {m.citations.map((c) => (
                              <a
                                key={c.source_url}
                                href={c.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={c.title}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-doral-navy/5 border border-doral-navy/20 text-doral-navy hover:bg-doral-navy hover:text-white transition focus:outline-none focus:ring-2 focus:ring-doral-gold"
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${c.domain === "doralpd.com" ? "bg-red-600" : "bg-doral-gold"}`}
                                />
                                {c.domain}
                              </a>
                            ))}
                          </div>
                        )}
                      {m.role === "assistant" && !m.streaming && m.llm && (
                        <div className="mt-2 inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-doral-gold/20 text-doral-navy font-semibold">
                          {m.llm}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {error && (
                <div
                  role="alert"
                  className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Rating prompt */}
            <AnimatePresence>
              {ratingState === "prompt" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t bg-doral-gold/15 px-3 py-2 flex items-center justify-between gap-2"
                >
                  <span className="text-xs text-doral-navy font-medium">
                    {t.ratingPrompt}
                  </span>
                  <div className="flex items-center gap-1">
                    <StarRow onPick={submitRating} />
                    <button
                      onClick={() => setRatingState("dismissed")}
                      className="ml-2 text-[11px] text-doral-navy/70 hover:underline focus:outline-none focus:ring-2 focus:ring-doral-gold rounded"
                    >
                      {t.ratingDismiss}
                    </button>
                  </div>
                </motion.div>
              )}
              {ratingState === "submitted" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-t bg-doral-gold/15 px-3 py-2 text-xs text-doral-navy font-medium"
                  role="status"
                >
                  {t.ratingThanks}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="border-t bg-white p-3 flex items-center gap-2">
              <button
                type="button"
                disabled
                aria-label={t.fileLabel}
                title={t.fileLabel}
                className="p-2 text-gray-400 disabled:cursor-not-allowed"
              >
                <PaperclipIcon />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={t.placeholder}
                aria-label={t.placeholder}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doral-navy"
                disabled={sending}
              />
              <button
                type="button"
                disabled
                aria-label={t.voiceLabel}
                title={t.voiceLabel}
                className="p-2 text-gray-400 disabled:cursor-not-allowed"
              >
                <MicIcon />
              </button>
              <button
                onClick={() => send()}
                disabled={sending || !input.trim()}
                className="px-4 py-2 rounded bg-doral-navy text-white text-sm font-semibold disabled:opacity-50 border-b-2 border-doral-gold focus:outline-none focus:ring-2 focus:ring-doral-gold"
              >
                {t.send}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TypingDots({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-gray-500 italic">
      <span className="sr-only">{label}…</span>
      <Dot delay={0} />
      <Dot delay={0.15} />
      <Dot delay={0.3} />
    </span>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      aria-hidden="true"
      className="inline-block h-1.5 w-1.5 rounded-full bg-doral-navy/50"
      animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
      transition={{
        duration: 0.9,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

function StarRow({ onPick }: { onPick: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div
      className="flex items-center"
      onMouseLeave={() => setHover(0)}
      role="radiogroup"
      aria-label="Rate this chat"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={false}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onPick(n)}
          className="p-0.5 focus:outline-none focus:ring-2 focus:ring-doral-gold rounded"
        >
          <Star filled={n <= hover} />
        </button>
      ))}
    </div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-5 w-5 ${filled ? "fill-doral-gold" : "fill-doral-navy/20"} transition-colors`}
      aria-hidden="true"
    >
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.2 1 5.8L10 14.9 4.8 17.7l1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 1 1 5.66 5.66l-9.2 9.19a2 2 0 1 1-2.83-2.83l8.49-8.49" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}
