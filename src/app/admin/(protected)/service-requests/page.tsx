import Link from "next/link";
import { createServiceClient } from "@/lib/supabase-server";
import LiveRefresh from "../LiveRefresh";

export const dynamic = "force-dynamic";

type Ticket = {
  id: string;
  ticket_number: string;
  conversation_id: string | null;
  request_type: string;
  location: string | null;
  description: string | null;
  photo_url: string | null;
  status: "open" | "in_progress" | "closed";
  created_at: string;
};

const STATUSES = ["open", "in_progress", "closed"] as const;
const TYPES = [
  "pothole",
  "streetlight",
  "graffiti",
  "tree",
  "sidewalk",
  "trash",
  "noise",
  "other",
];

export default async function ServiceRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; q?: string };
}) {
  const svc = createServiceClient();
  let q = svc
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (searchParams.status && STATUSES.includes(searchParams.status as never)) {
    q = q.eq("status", searchParams.status);
  }
  if (searchParams.type && TYPES.includes(searchParams.type)) {
    q = q.eq("request_type", searchParams.type);
  }
  if (searchParams.q) {
    const needle = searchParams.q.replace(/[%_]/g, "\\$&");
    q = q.or(
      `location.ilike.%${needle}%,description.ilike.%${needle}%,ticket_number.ilike.%${needle}%`,
    );
  }

  const { data, error } = await q.returns<Ticket[]>();
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-doral-navy">Service requests</h1>
        <p className="text-sm text-gray-600 mt-1">
          311 tickets submitted via the chat assistant.
        </p>
        <div className="mt-2">
          <LiveRefresh tables={["service_requests"]} />
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <FilterSelect
          name="status"
          label="Status"
          value={searchParams.status ?? ""}
          options={[{ value: "", label: "Any" }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
        />
        <FilterSelect
          name="type"
          label="Type"
          value={searchParams.type ?? ""}
          options={[{ value: "", label: "Any" }, ...TYPES.map((t) => ({ value: t, label: t }))]}
        />
        <label className="block text-xs font-medium text-gray-700 flex-1 min-w-[200px]">
          <span className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-1">
            Search
          </span>
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="location, description, ticket #"
            className="block w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-doral-navy"
          />
        </label>
        <button
          type="submit"
          className="px-4 py-1.5 rounded bg-doral-navy text-white text-sm font-semibold border-b-2 border-doral-gold"
        >
          Apply
        </button>
        <Link
          href="/admin/service-requests"
          className="px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          Reset
        </Link>
      </form>

      {error && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {error.message}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-2">Ticket</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-doral-navy">
                  {r.ticket_number}
                </td>
                <td className="px-4 py-3 text-xs">{r.request_type}</td>
                <td className="px-4 py-3 text-xs max-w-xs truncate" title={r.location ?? ""}>
                  {r.location ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.conversation_id && (
                    <Link
                      href={`/admin/conversations/${r.conversation_id}`}
                      className="text-xs text-doral-navy hover:underline"
                    >
                      Chat →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No tickets match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Ticket["status"] }) {
  const cls =
    status === "open"
      ? "bg-amber-100 text-amber-800"
      : status === "in_progress"
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-200 text-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-xs font-medium text-gray-700">
      <span className="block text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-1">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-doral-navy"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
