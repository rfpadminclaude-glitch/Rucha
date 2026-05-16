export const dynamic = "force-dynamic";

const PLANNED_SOURCES = [
  {
    domain: "cityofdoral.com",
    urls: [
      "https://www.cityofdoral.com/",
      "https://www.cityofdoral.com/services",
      "https://www.cityofdoral.com/services/info-doral",
      "https://www.cityofdoral.com/government/departments/business-tax-receipt",
      "https://www.cityofdoral.com/services/parks",
    ],
  },
  {
    domain: "doralpd.com",
    urls: [
      "https://www.doralpd.com/",
      "https://www.doralpd.com/crime-mapping",
      "https://www.doralpd.com/citizens-police-academy",
      "https://www.doralpd.com/special-needs-registry",
    ],
  },
];

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-doral-navy">Sources</h1>
        <p className="text-sm text-gray-600 mt-1">
          The URLs the assistant indexes for retrieval.
        </p>
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
        <strong>Phase 7 placeholder.</strong> Re-scrape buttons and per-URL last-scraped
        timestamps will land in the scraping-pipeline phase. The list below is what we
        plan to crawl.
      </div>

      <div className="space-y-4">
        {PLANNED_SOURCES.map((s) => (
          <div
            key={s.domain}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`h-2 w-2 rounded-full ${
                  s.domain === "doralpd.com" ? "bg-red-600" : "bg-doral-gold"
                }`}
              />
              <span className="font-semibold text-doral-navy">{s.domain}</span>
              <span className="text-xs text-gray-500">
                · {s.urls.length} URL{s.urls.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="space-y-1">
              {s.urls.map((u) => (
                <li key={u} className="text-xs flex items-center justify-between">
                  <a
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-doral-navy hover:underline truncate"
                  >
                    {u}
                  </a>
                  <button
                    type="button"
                    disabled
                    className="ml-2 text-[10px] px-2 py-0.5 rounded border border-gray-300 text-gray-400 cursor-not-allowed"
                    title="Available in Phase 7"
                  >
                    Re-scrape
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
