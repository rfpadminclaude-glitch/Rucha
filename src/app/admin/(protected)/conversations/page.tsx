import Link from "next/link";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type ConvRow = {
  id: string;
  user_lang: "en" | "es";
  rating: number | null;
  created_at: string;
};

export default async function ConversationsListPage() {
  const svc = createServiceClient();
  const { data: convs } = await svc
    .from("conversations")
    .select("id, user_lang, rating, created_at")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<ConvRow[]>();
  const list = convs ?? [];

  // Pull message counts in one go
  const ids = list.map((c) => c.id);
  let counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: msgRows } = await svc
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", ids);
    counts = (msgRows ?? []).reduce<Record<string, number>>((acc, m) => {
      acc[m.conversation_id as string] = (acc[m.conversation_id as string] ?? 0) + 1;
      return acc;
    }, {});
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-doral-navy">Conversations</h1>
        <p className="text-sm text-gray-600 mt-1">
          Most recent 100 chat sessions.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-2">Started</th>
              <th className="px-4 py-2">Lang</th>
              <th className="px-4 py-2">Messages</th>
              <th className="px-4 py-2">Rating</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(c.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-doral-gold/20 text-doral-navy text-[10px] font-bold uppercase">
                    {c.user_lang}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{counts[c.id] ?? 0}</td>
                <td className="px-4 py-3 text-xs">
                  {c.rating == null ? <span className="text-gray-400">—</span> : "★".repeat(c.rating)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/conversations/${c.id}`}
                    className="text-xs text-doral-navy hover:underline font-semibold"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No conversations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
