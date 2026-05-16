import { createServiceClient } from "@/lib/supabase-server";
import AnnouncementForm from "./AnnouncementForm";
import RowControls from "./RowControls";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title_en: string;
  title_es: string;
  body_en: string;
  body_es: string;
  priority: number;
  active: boolean;
  created_at: string;
};

export default async function AnnouncementsPage() {
  const svc = createServiceClient();
  const { data } = await svc
    .from("announcements")
    .select("*")
    .order("active", { ascending: false })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<Row[]>();
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-doral-navy">Announcements</h1>
        <p className="text-sm text-gray-600 mt-1">
          Bilingual notices shown at the top of the public site. Sorted by{" "}
          <code>active</code> then <code>priority</code>.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-doral-navy mb-3">New announcement</h2>
        <AnnouncementForm />
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className={`rounded-lg border p-4 ${
              r.active
                ? "bg-white border-gray-200"
                : "bg-gray-50 border-gray-200 opacity-70"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      r.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {r.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    priority {r.priority}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[10px] font-bold text-doral-navy/60 mb-0.5">EN</div>
                    <div className="font-semibold text-doral-navy">{r.title_en}</div>
                    <div className="text-gray-700 text-xs">{r.body_en}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-doral-navy/60 mb-0.5">ES</div>
                    <div className="font-semibold text-doral-navy">{r.title_es}</div>
                    <div className="text-gray-700 text-xs">{r.body_es}</div>
                  </div>
                </div>
              </div>
              <RowControls id={r.id} active={r.active} />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-lg">
            No announcements yet.
          </div>
        )}
      </div>
    </div>
  );
}
