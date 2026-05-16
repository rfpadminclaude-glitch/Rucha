import Link from "next/link";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function getKpis() {
  const svc = createServiceClient();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [faqs, openTickets, conv24h, ratings7d] = await Promise.all([
    svc.from("faqs").select("id", { count: "exact", head: true }),
    svc
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    svc
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayAgo),
    svc
      .from("conversations")
      .select("rating")
      .gte("rated_at", weekAgo)
      .not("rating", "is", null),
  ]);

  const ratingValues = (ratings7d.data ?? [])
    .map((r) => r.rating as number | null)
    .filter((n): n is number => typeof n === "number");
  const meanRating =
    ratingValues.length > 0
      ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
      : null;

  return {
    faqCount: faqs.count ?? 0,
    openTickets: openTickets.count ?? 0,
    conversations24h: conv24h.count ?? 0,
    meanRating,
    ratingsCount: ratingValues.length,
  };
}

export default async function OverviewPage() {
  const k = await getKpis();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-doral-navy">Overview</h1>
        <p className="text-sm text-gray-600 mt-1">
          City of Doral assistant dashboard
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="FAQs"
          value={k.faqCount.toString()}
          href="/admin/faqs"
          hint="Rows across EN + ES"
        />
        <Kpi
          label="Open tickets"
          value={k.openTickets.toString()}
          href="/admin/service-requests?status=open"
          hint="311 service requests"
          accent={k.openTickets > 0 ? "amber" : undefined}
        />
        <Kpi
          label="Conversations (24h)"
          value={k.conversations24h.toString()}
          href="/admin/conversations"
          hint="New sessions today"
        />
        <Kpi
          label="Avg rating (7d)"
          value={k.meanRating == null ? "—" : k.meanRating.toFixed(2)}
          hint={`${k.ratingsCount} rating${k.ratingsCount === 1 ? "" : "s"}`}
          accent={k.meanRating != null && k.meanRating < 3 ? "amber" : undefined}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-doral-navy mb-3">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/faqs"
            className="text-xs px-3 py-1.5 rounded bg-doral-navy text-white hover:bg-doral-navy/90"
          >
            Edit FAQs (EN/ES)
          </Link>
          <Link
            href="/admin/announcements"
            className="text-xs px-3 py-1.5 rounded bg-doral-navy text-white hover:bg-doral-navy/90"
          >
            Post announcement
          </Link>
          <Link
            href="/admin/service-requests"
            className="text-xs px-3 py-1.5 rounded border border-doral-navy text-doral-navy hover:bg-doral-navy/5"
          >
            Review service requests
          </Link>
          <Link
            href="/admin/conversations"
            className="text-xs px-3 py-1.5 rounded border border-doral-navy text-doral-navy hover:bg-doral-navy/5"
          >
            Browse conversations
          </Link>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  href,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  accent?: "amber";
}) {
  const inner = (
    <div
      className={`rounded-lg border bg-white p-5 ${
        accent === "amber"
          ? "border-amber-300"
          : "border-gray-200 hover:border-doral-navy/40"
      } transition`}
    >
      <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
        {label}
      </div>
      <div
        className={`mt-1 text-3xl font-bold ${
          accent === "amber" ? "text-amber-700" : "text-doral-navy"
        }`}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-gray-500 mt-1">{hint}</div>}
    </div>
  );
  return href ? (
    <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-doral-gold rounded-lg">
      {inner}
    </Link>
  ) : (
    inner
  );
}
