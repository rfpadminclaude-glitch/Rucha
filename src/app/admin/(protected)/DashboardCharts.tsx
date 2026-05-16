"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LangSlice = { name: string; value: number; key: "en" | "es" };
type LlmSlice = { name: string; value: number };
type DayPoint = { date: string; label: string; count: number };
type Rating = { stars: string; count: number };
type ReqType = { type: string; count: number };

const NAVY = "#052942";
const GOLD = "#FFCF4B";
const SLATE = "#41596b";
const RED = "#c0392b";
const GREEN = "#2e8b57";

export default function DashboardCharts({
  convPerDay,
  langSplit,
  ratingDistribution,
  llmSplit,
  topRequestTypes,
}: {
  convPerDay: DayPoint[];
  langSplit: LangSlice[];
  ratingDistribution: Rating[];
  llmSplit: LlmSlice[];
  topRequestTypes: ReqType[];
}) {
  return (
    <div className="space-y-4">
      {/* Row 1: line + lang donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="Conversations / day"
          subtitle="Last 14 days"
          downloadName="conversations-per-day"
          downloadRows={convPerDay}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={convPerDay}
              margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="convFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={NAVY} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={NAVY} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#9aa3ad"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9aa3ad"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: "1px solid #ddd",
                  borderRadius: 4,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={NAVY}
                strokeWidth={2}
                fill="url(#convFill)"
                name="Conversations"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="EN vs ES"
          subtitle="All-time conversation language"
          downloadName="language-split"
          downloadRows={langSplit}
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={langSplit}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                isAnimationActive={false}
              >
                {langSplit.map((s, i) => (
                  <Cell
                    key={i}
                    fill={s.key === "en" ? NAVY : GOLD}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: "1px solid #ddd",
                  borderRadius: 4,
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: rating distribution + llm donut + top types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="Rating distribution"
          subtitle="All ratings collected"
          downloadName="rating-distribution"
          downloadRows={ratingDistribution}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={ratingDistribution}
              margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
            >
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="stars"
                stroke="#9aa3ad"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9aa3ad"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: "1px solid #ddd",
                  borderRadius: 4,
                }}
              />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                {ratingDistribution.map((r, i) => {
                  const stars = parseInt(r.stars[0], 10);
                  const color =
                    stars >= 4 ? GREEN : stars === 3 ? GOLD : RED;
                  return <Cell key={i} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="LLM provider (14d)"
          subtitle="Proves the Groq → Gemini failover"
          downloadName="llm-provider-split"
          downloadRows={llmSplit}
        >
          {llmSplit.length === 0 ? (
            <EmptyState text="No messages in the last 14 days." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={llmSplit}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {llmSplit.map((s, i) => (
                    <Cell
                      key={i}
                      fill={s.name === "groq" ? RED : NAVY}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: "1px solid #ddd",
                    borderRadius: 4,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Top 311 request types"
          subtitle="Last 14 days"
          downloadName="top-request-types"
          downloadRows={topRequestTypes}
        >
          {topRequestTypes.length === 0 ? (
            <EmptyState text="No service requests in the last 14 days." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topRequestTypes}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#9aa3ad"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="type"
                  stroke="#9aa3ad"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    border: "1px solid #ddd",
                    borderRadius: 4,
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={SLATE}
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  downloadName,
  downloadRows,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  downloadName?: string;
  downloadRows?: Array<Record<string, unknown>>;
  className?: string;
}) {
  function downloadCsv() {
    if (!downloadRows || downloadRows.length === 0) return;
    const keys = Object.keys(downloadRows[0]);
    const lines = [keys.join(",")];
    for (const row of downloadRows) {
      lines.push(keys.map((k) => csvCell(row[k])).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${downloadName ?? "chart"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-5 ${className ?? ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-doral-navy">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {downloadRows && downloadRows.length > 0 && (
          <button
            type="button"
            onClick={downloadCsv}
            title="Download CSV"
            className="text-[11px] px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-doral-navy"
          >
            CSV
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-xs text-gray-400 italic">
      {text}
    </div>
  );
}

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
