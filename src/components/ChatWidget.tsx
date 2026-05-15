"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Message = {
  role: "user" | "assistant";
  content: string;
  llm?: "gemini" | "groq";
};

const WELCOME: Record<"en" | "es", string> = {
  en: "Hi! I'm the City of Doral assistant. Ask me about permits, BTR, parks, 311 reports, or anything else.",
  es: "¡Hola! Soy el asistente de la Ciudad de Doral. Pregúntame sobre permisos, BTR, parques, 311, o cualquier otra cosa.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { message: text, lang, conversationId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setConversationId(data.conversationId);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply, llm: data.llm },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating launcher (bottom-left) */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-doral-navy text-white shadow-lg hover:scale-105 transition flex items-center justify-center border-b-4 border-doral-gold"
      >
        {open ? "×" : "💬"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] rounded-lg shadow-2xl bg-white border border-doral-navy/20 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-doral-navy text-white p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">City of Doral Assistant</div>
              <div className="text-xs text-white/70">
                {lang === "en" ? "Ask anything" : "Pregunta lo que sea"}
              </div>
            </div>
            <div className="flex gap-1 text-xs">
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-1 rounded ${lang === "en" ? "bg-doral-gold text-doral-navy font-semibold" : "bg-white/10"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("es")}
                className={`px-2 py-1 rounded ${lang === "es" ? "bg-doral-gold text-doral-navy font-semibold" : "bg-white/10"}`}
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
              {WELCOME[lang]}
            </div>
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : ""}
              >
                <div
                  className={
                    m.role === "user"
                      ? "bg-doral-navy text-white rounded-lg p-3 max-w-[85%] text-sm"
                      : "bg-white border border-gray-200 rounded-lg p-3 max-w-[85%] text-sm text-gray-800"
                  }
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {m.role === "assistant" && m.llm && (
                    <div className="mt-2 inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-doral-gold/20 text-doral-navy font-semibold">
                      {m.llm}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="text-sm text-gray-500 italic">
                {lang === "en" ? "Thinking…" : "Pensando…"}
              </div>
            )}
            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t bg-white p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={
                lang === "en" ? "Type a message…" : "Escribe un mensaje…"
              }
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doral-navy"
              disabled={sending}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="px-4 py-2 rounded bg-doral-navy text-white text-sm font-semibold disabled:opacity-50 border-b-2 border-doral-gold"
            >
              {lang === "en" ? "Send" : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
