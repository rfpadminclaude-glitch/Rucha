import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Conv = {
  id: string;
  user_lang: "en" | "es";
  rating: number | null;
  rating_comment: string | null;
  rated_at: string | null;
  created_at: string;
};

type Msg = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  llm_provider: "gemini" | "groq" | null;
  created_at: string;
};

type Ticket = {
  id: string;
  ticket_number: string;
  request_type: string;
  status: string;
  location: string | null;
};

export default async function ConversationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const svc = createServiceClient();
  const { data: conv } = await svc
    .from("conversations")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Conv>();
  if (!conv) notFound();

  const [{ data: msgs }, { data: tickets }] = await Promise.all([
    svc
      .from("messages")
      .select("id, role, content, llm_provider, created_at")
      .eq("conversation_id", params.id)
      .order("created_at", { ascending: true })
      .returns<Msg[]>(),
    svc
      .from("service_requests")
      .select("id, ticket_number, request_type, status, location")
      .eq("conversation_id", params.id)
      .returns<Ticket[]>(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/conversations"
          className="text-xs text-doral-navy hover:underline"
        >
          ← All conversations
        </Link>
        <h1 className="text-2xl font-semibold text-doral-navy mt-2">
          Conversation
        </h1>
        <div className="text-xs text-gray-500 mt-1 font-mono">{conv.id}</div>
        <div className="text-xs text-gray-600 mt-1">
          {new Date(conv.created_at).toLocaleString()} ·{" "}
          <span className="uppercase">{conv.user_lang}</span>
          {conv.rating != null && (
            <>
              {" "}
              · Rating: <span className="text-doral-gold">{"★".repeat(conv.rating)}</span>
              <span className="text-gray-300">{"★".repeat(5 - conv.rating)}</span>
            </>
          )}
        </div>
        {conv.rating_comment && (
          <div className="mt-2 text-xs text-gray-700 italic">
            “{conv.rating_comment}”
          </div>
        )}
      </div>

      {(tickets ?? []).length > 0 && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4">
          <div className="text-xs font-semibold text-green-900 mb-2">
            Tickets created in this conversation
          </div>
          <div className="space-y-1">
            {(tickets ?? []).map((t) => (
              <div key={t.id} className="text-xs flex items-center gap-2">
                <span className="font-mono font-bold text-doral-navy">
                  {t.ticket_number}
                </span>
                <span>·</span>
                <span>{t.request_type}</span>
                {t.location && (
                  <>
                    <span>·</span>
                    <span className="truncate">{t.location}</span>
                  </>
                )}
                <span>·</span>
                <span className="uppercase text-gray-600">{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        {(msgs ?? []).map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-doral-navy text-white"
                  : m.role === "system"
                    ? "bg-gray-100 text-gray-600 text-xs italic"
                    : "bg-gray-50 border border-gray-200 text-gray-800"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              <div
                className={`mt-1 text-[10px] ${
                  m.role === "user" ? "text-white/60" : "text-gray-400"
                }`}
              >
                {new Date(m.created_at).toLocaleTimeString()}
                {m.llm_provider && (
                  <> · <span className="uppercase">{m.llm_provider}</span></>
                )}
              </div>
            </div>
          </div>
        ))}
        {(msgs ?? []).length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">
            No messages.
          </div>
        )}
      </div>
    </div>
  );
}
