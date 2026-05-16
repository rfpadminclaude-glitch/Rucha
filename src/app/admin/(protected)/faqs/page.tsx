import Link from "next/link";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Row = {
  topic_key: string | null;
  lang: "en" | "es";
  question: string;
  category: string | null;
  domain: string | null;
};

export default async function FaqsListPage() {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("faqs")
    .select("topic_key, lang, question, category, domain")
    .order("topic_key", { ascending: true })
    .returns<Row[]>();

  if (error) {
    return <ErrorBox message={error.message} />;
  }

  const byTopic = new Map<
    string,
    { topic_key: string; category: string | null; domain: string | null; en?: string; es?: string }
  >();
  for (const r of data ?? []) {
    if (!r.topic_key) continue;
    const entry =
      byTopic.get(r.topic_key) ??
      { topic_key: r.topic_key, category: r.category, domain: r.domain };
    entry[r.lang] = r.question;
    byTopic.set(r.topic_key, entry);
  }
  const topics = Array.from(byTopic.values()).sort((a, b) =>
    a.topic_key.localeCompare(b.topic_key),
  );

  const orphans = (data ?? []).filter((r) => !r.topic_key);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-doral-navy">FAQs</h1>
          <p className="text-sm text-gray-600 mt-1">
            {topics.length} topic{topics.length === 1 ? "" : "s"} · {(data ?? []).length} rows
          </p>
        </div>
        <Link
          href="/admin/faqs/new"
          className="text-xs px-3 py-1.5 rounded bg-doral-navy text-white hover:bg-doral-navy/90"
        >
          + New topic
        </Link>
      </div>

      {orphans.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          {orphans.length} legacy row{orphans.length === 1 ? "" : "s"} have no{" "}
          <code>topic_key</code>. Re-run <code>npm run seed:faqs</code> to backfill.
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-2">Topic</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Languages</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.topic_key} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-doral-navy">{t.topic_key}</div>
                  <div className="text-xs text-gray-500 truncate max-w-md">
                    {t.en ?? t.es}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{t.category ?? "—"}</td>
                <td className="px-4 py-3 text-xs">
                  {t.domain && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${
                        t.domain === "doralpd.com"
                          ? "border-red-300 text-red-700"
                          : "border-doral-navy/30 text-doral-navy"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          t.domain === "doralpd.com" ? "bg-red-600" : "bg-doral-gold"
                        }`}
                      />
                      {t.domain}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  <LangPill present={!!t.en} label="EN" />
                  <LangPill present={!!t.es} label="ES" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/faqs/${encodeURIComponent(t.topic_key)}`}
                    className="text-xs text-doral-navy hover:underline font-semibold"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
            {topics.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No topics yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LangPill({ present, label }: { present: boolean; label: string }) {
  return (
    <span
      className={`inline-block mr-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
        present
          ? "bg-doral-gold/20 text-doral-navy"
          : "bg-gray-100 text-gray-400 line-through"
      }`}
    >
      {label}
    </span>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
      {message}
    </div>
  );
}
