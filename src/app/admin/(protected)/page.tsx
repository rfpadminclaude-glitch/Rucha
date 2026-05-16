import Link from "next/link";
import { createServiceClient } from "@/lib/supabase-server";
import DashboardCharts from "./DashboardCharts";
import LiveRefresh from "./LiveRefresh";

export const dynamic = "force-dynamic";

type ConvRow = {
  user_lang: "en" | "es";
  rating: number | null;
  created_at: string;
};

async function getDashboard() {
  const svc = createServiceClient();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fortnightAgoDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const fortnightAgo = fortnightAgoDate.toISOString();

  const [
    faqs,
    openTickets,
    closedTickets,
    convAll,
    convRecent,
    msgsRecent,
    ticketsRecent,
  ] = await Promise.all([
    svc.from("faqs").select("id", { count: "exact", head: true }),
    svc
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    svc
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .neq("status", "open"),
    svc
      .from("conversations")
      .select("user_lang, rating, created_at")
      .returns<ConvRow[]>(),
    svc
      .from("conversations")
      .select("user_lang, rating, created_at")
      .gte("created_at", fortnightAgo)
      .returns<ConvRow[]>(),
    svc
      .from("messages")
      .select("llm_provider, created_at")
      .gte("created_at", fortnightAgo)
      .not("llm_provider", "is", null),
    svc
      .from("service_requests")
      .select("request_type, created_at")
      .gte("created_at", fortnightAgo),
  ]);

  // ----- KPIs -----
  const conv24h = (convAll.data ?? []).filter((c) => c.created_at >= dayAgo).length;
  const ratings7d = (convAll.data ?? [])
    .filter((c) => c.rating != null && c.created_at >= weekAgo)
    .map((c) => c.rating as number);
  const meanRating =
    ratings7d.length > 0
      ? ratings7d.reduce((a, b) => a + b, 0) / ratings7d.length
      : null;

  const ticketsTotal = (openTickets.count ?? 0) + (closedTickets.count ?? 0);
  const resolutionPct =
    ticketsTotal > 0
      ? Math.round(((closedTickets.count ?? 0) / ticketsTotal) * 100)
      : null;

  // ----- Conversations per day (14d) -----
  const dayBuckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dayBuckets.set(key, 0);
  }
  for (const c of convRecent.data ?? []) {
    const key = c.created_at.slice(0, 10);
    if (dayBuckets.has(key)) {
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
    }
  }
  const convPerDay = Array.from(dayBuckets.entries()).map(([date, count]) => ({
    date,
    label: date.slice(5), // MM-DD
    count,
  }));

  // ----- Language split (all-time) -----
  const langCounts = (convAll.data ?? []).reduce(
    (acc, c) => {
      acc[c.user_lang] = (acc[c.user_lang] ?? 0) + 1;
      return acc;
    },
    { en: 0, es: 0 } as Record<"en" | "es", number>,
  );
  const langSplit = [
    { name: "English", value: langCounts.en, key: "en" as const },
    { name: "Spanish", value: langCounts.es, key: "es" as const },
  ];

  // ----- Rating distribution (all-time) -----
  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of convAll.data ?? []) {
    if (c.rating != null) ratingCounts[c.rating] = (ratingCounts[c.rating] ?? 0) + 1;
  }
  const ratingDistribution = [1, 2, 3, 4, 5].map((stars) => ({
    stars: `${stars}★`,
    count: ratingCounts[stars],
  }));

  // ----- LLM provider split (14d) -----
  const llmCounts = (msgsRecent.data ?? []).reduce<Record<string, number>>(
    (acc, m) => {
      const p = (m.llm_provider as string) ?? "unknown";
      acc[p] = (acc[p] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const llmSplit = Object.entries(llmCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // ----- Top request types (14d) -----
  const typeCounts = (ticketsRecent.data ?? []).reduce<Record<string, number>>(
    (acc, t) => {
      const k = (t.request_type as string) ?? "other";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const topRequestTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    kpis: {
      faqCount: faqs.count ?? 0,
      openTickets: openTickets.count ?? 0,
      conversations24h: conv24h,
      meanRating,
      ratingsCount: ratings7d.length,
      resolutionPct,
      ticketsTotal,
    },
    convPerDay,
    langSplit,
    ratingDistribution,
    llmSplit,
    topRequestTypes,
    totals: {
      conversations: (convAll.data ?? []).length,
      ratings: ratings7d.length,
      messages14d: (msgsRecent.data ?? []).length,
    },
  };
}

export default async function OverviewPage() {
  const d = await getDashboard();
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-doral-navy">
            Analytics overview
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Live data from the City of Doral assistant.
          </p>
          <div className="mt-2">
            <LiveRefresh />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PowerBiButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="FAQs"
          value={d.kpis.faqCount.toString()}
          href="/admin/faqs"
          hint="Rows across EN + ES"
        />
        <Kpi
          label="Conversations (24h)"
          value={d.kpis.conversations24h.toString()}
          href="/admin/conversations"
          hint={`${d.totals.conversations} all-time`}
        />
        <Kpi
          label="Open tickets"
          value={d.kpis.openTickets.toString()}
          href="/admin/service-requests?status=open"
          hint={
            d.kpis.resolutionPct == null
              ? "Phase 4 workflow"
              : `${d.kpis.resolutionPct}% resolution rate`
          }
          accent={d.kpis.openTickets > 0 ? "amber" : undefined}
        />
        <Kpi
          label="Avg rating (7d)"
          value={
            d.kpis.meanRating == null ? "—" : d.kpis.meanRating.toFixed(2)
          }
          hint={`${d.kpis.ratingsCount} rating${d.kpis.ratingsCount === 1 ? "" : "s"}`}
          accent={
            d.kpis.meanRating != null && d.kpis.meanRating < 3
              ? "amber"
              : undefined
          }
        />
      </div>

      <DashboardCharts
        convPerDay={d.convPerDay}
        langSplit={d.langSplit}
        ratingDistribution={d.ratingDistribution}
        llmSplit={d.llmSplit}
        topRequestTypes={d.topRequestTypes}
      />

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
    <Link
      href={href}
      className="block focus:outline-none focus:ring-2 focus:ring-doral-gold rounded-lg"
    >
      {inner}
    </Link>
  ) : (
    inner
  );
}

function PowerBiButton() {
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer text-xs px-3 py-1.5 rounded bg-doral-gold text-doral-navy font-semibold hover:bg-doral-gold/90 inline-flex items-center gap-1.5">
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M3 4h4v16H3zM10 9h4v11h-4zM17 13h4v7h-4z" />
        </svg>
        Connect to Power BI
      </summary>
      <div className="absolute right-0 mt-2 w-80 z-10 rounded-lg border border-gray-200 bg-white shadow-xl p-4 text-xs text-gray-700 space-y-2">
        <div className="font-semibold text-doral-navy">Power BI sync</div>
        <p>
          The City of Doral assistant can publish a live OData feed of these
          analytics to your Power BI workspace. Once configured, the dataset
          refreshes every 15 minutes and supports the standard Power BI
          visuals (Card, Line, Donut, Treemap, KPI).
        </p>
        <p className="text-gray-500 italic">
          OData endpoint will be provisioned during onboarding. Contact:
          procurement@cityofdoral.com
        </p>
      </div>
    </details>
  );
}
