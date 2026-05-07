"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsData = {
  per_day: { date: string; count: number }[];
  by_status: Record<string, number>;
  by_category: { category: string; count: number }[];
  top_donors: { name: string; total: number }[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  claimed: "Diklaim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#16a34a",
  rejected: "#ef4444",
  claimed: "#d97706",
  completed: "#6366f1",
  cancelled: "#94a3b8",
};

function todayYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function daysAgoYmd(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export default function ReportsAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState<string>(daysAgoYmd(29));
  const [dateTo, setDateTo] = useState<string>(todayYmd());
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) return;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
        const res = await fetch(`/api/admin/reports/analytics?${params}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setAnalytics(json.data);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [dateFrom, dateTo]);

  const totalFromPerDay = useMemo(
    () => (analytics?.per_day ?? []).reduce((sum, d) => sum + d.count, 0),
    [analytics],
  );

  const statusPieData = useMemo(() => {
    if (!analytics?.by_status) return [];
    return Object.entries(analytics.by_status).map(([status, count]) => ({
      name: STATUS_LABEL[status] ?? status,
      key: status,
      value: count,
    }));
  }, [analytics]);

  const lineData = useMemo(
    () => (analytics?.per_day ?? []).map((d) => ({ ...d, label: formatDateLabel(d.date) })),
    [analytics],
  );

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-[var(--brand-900,#0f172a)]">Analitik Donasi</h1>
        <p className="text-sm text-slate-500">
          Pantau tren donasi, distribusi status, kategori, dan donatur teratas dalam rentang waktu.
        </p>
      </header>

      <section className="flex flex-wrap items-end gap-3 rounded-[1.6rem] border border-[var(--brand-100,#e2e8f0)] bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-slate-600">Dari tanggal</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-300,#a7f3d0)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-slate-600">Sampai tanggal</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-300,#a7f3d0)]"
          />
        </label>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Donasi", value: totalFromPerDay, color: "var(--brand-600,#16a34a)" },
          { label: "Disetujui", value: analytics?.by_status?.approved ?? 0, color: "#16a34a" },
          { label: "Diklaim", value: analytics?.by_status?.claimed ?? 0, color: "#d97706" },
          { label: "Selesai", value: analytics?.by_status?.completed ?? 0, color: "#6366f1" },
        ].map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} color={kpi.color} loading={loading} />
        ))}
      </section>

      <section className="rounded-[1.6rem] border border-[var(--brand-100,#e2e8f0)] bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-[var(--brand-900,#0f172a)]">Donasi per Hari</h3>
        {loading ? (
          <SkeletonChart />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Donasi" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[1.6rem] border border-[var(--brand-100,#e2e8f0)] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-[var(--brand-900,#0f172a)]">Distribusi Kategori</h3>
          {loading ? (
            <SkeletonChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics?.by_category ?? []} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} name="Donasi" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="rounded-[1.6rem] border border-[var(--brand-100,#e2e8f0)] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-[var(--brand-900,#0f172a)]">Status Donasi</h3>
          {loading ? (
            <SkeletonChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={45}
                  label={(entry: { name?: string; percent?: number }) =>
                    `${entry.name ?? ""} ${(((entry.percent ?? 0) * 100)).toFixed(0)}%`
                  }
                >
                  {statusPieData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLOR[entry.key] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <section className="rounded-[1.6rem] border border-[var(--brand-100,#e2e8f0)] bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-[var(--brand-900,#0f172a)]">Top 5 Donatur</h3>
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-[var(--brand-50,#f1f5f9)]" />
        ) : !analytics?.top_donors?.length ? (
          <p className="text-sm text-slate-500">Belum ada data donatur dalam rentang ini.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 text-right">Total Donasi</th>
              </tr>
            </thead>
            <tbody>
              {analytics.top_donors.map((d, i) => (
                <tr key={d.name + i} className="border-t border-slate-100">
                  <td className="py-2 pr-4 text-slate-500">{i + 1}</td>
                  <td className="py-2 pr-4 font-medium text-slate-700">{d.name}</td>
                  <td className="py-2 text-right text-slate-700">{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
  loading,
}: {
  label: string;
  value: number;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[var(--brand-100,#e2e8f0)] bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-100" />
      ) : (
        <div className="mt-1 text-3xl font-bold" style={{ color }}>
          {value.toLocaleString("id-ID")}
        </div>
      )}
    </div>
  );
}

function SkeletonChart() {
  return <div className="h-[280px] animate-pulse rounded-xl bg-[var(--brand-50,#f1f5f9)]" />;
}
