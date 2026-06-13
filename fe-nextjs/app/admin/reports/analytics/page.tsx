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
import { BarChart2, CheckCircle2, Clock, Leaf } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/section-card";

// Brand palette literal hex values (recharts props don't read CSS variables)
const BRAND_600 = "#2d7a4f";
const BRAND_400 = "#5ec989";
const OCHRE   = "#c98a2b";
const BRAND_100 = "#d6f5e3";
const MUTED   = "#94a3b8";

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

// Brand-palette chart colors for pie slices (all on-brand)
const STATUS_COLOR: Record<string, string> = {
  pending:   OCHRE,
  approved:  BRAND_600,
  rejected:  "#b3261e",
  claimed:   BRAND_400,
  completed: "#1a5c3a",
  cancelled: MUTED,
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

/**
 * Animates an integer value from 0 -> target over `duration` ms.
 */
function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    let start: number | null = null;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function ReportsAnalyticsPage() {
  // Default to last 30 days so charts populate immediately on first paint.
  const [dateFrom, setDateFrom] = useState<string>(() => daysAgoYmd(29));
  const [dateTo, setDateTo] = useState<string>(() => todayYmd());
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) return;

    // AbortController guards against stale responses winning a race
    // when the user changes the date range faster than the network.
    const controller = new AbortController();

    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
        const res = await fetch(`/api/admin/reports/analytics?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (res.ok) {
          const json = await res.json();
          setAnalytics(json.data);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Analytics fetch failed", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
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
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Laporan"
        title="Analitik Donasi"
        description="Pantau tren donasi, distribusi status, kategori, dan donatur teratas dalam rentang waktu."
      />

      <SectionCard title="Rentang Waktu">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-(--text-mid)">Dari tanggal</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-(--brand-100) px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-(--brand-400)"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-(--text-mid)">Sampai tanggal</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-(--brand-100) px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-(--brand-400)"
            />
          </label>
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AnimatedStatCard
          label="Total Donasi"
          value={totalFromPerDay}
          icon={BarChart2}
          loading={loading}
        />
        <AnimatedStatCard
          label="Disetujui"
          value={analytics?.by_status?.approved ?? 0}
          icon={CheckCircle2}
          loading={loading}
        />
        <AnimatedStatCard
          label="Diklaim"
          value={analytics?.by_status?.claimed ?? 0}
          icon={Leaf}
          loading={loading}
        />
        <AnimatedStatCard
          label="Selesai"
          value={analytics?.by_status?.completed ?? 0}
          icon={Clock}
          loading={loading}
        />
      </div>

      <SectionCard title="Donasi per Hari">
        {loading ? (
          <ChartSkeleton height={280} />
        ) : lineData.length === 0 ? (
          <EmptyDataState />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND_100} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={BRAND_600} strokeWidth={2} dot={{ r: 3 }} name="Donasi" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Distribusi Kategori">
          {loading ? (
            <ChartSkeleton height={280} />
          ) : (analytics?.by_category ?? []).length === 0 ? (
            <EmptyDataState />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics?.by_category ?? []} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BRAND_100} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill={BRAND_600} radius={[6, 6, 0, 0]} name="Donasi" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Status Donasi">
          {loading ? (
            <ChartSkeleton height={280} />
          ) : statusPieData.length === 0 ? (
            <EmptyDataState />
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
                    <Cell key={entry.key} fill={STATUS_COLOR[entry.key] ?? MUTED} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Top 5 Donatur">
        {loading ? (
          <ChartSkeleton height={128} />
        ) : !analytics?.top_donors?.length ? (
          <p className="text-sm text-(--text-mid)">Belum ada data donatur dalam rentang ini.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-(--text-mid)">
              <tr>
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 text-right">Total Donasi</th>
              </tr>
            </thead>
            <tbody>
              {analytics.top_donors.map((d, i) => (
                <tr key={d.name + i} className="border-t border-(--brand-100)">
                  <td className="py-2 pr-4 text-(--text-mid)">{i + 1}</td>
                  <td className="py-2 pr-4 font-medium text-(--text-dark)">{d.name}</td>
                  <td className="py-2 text-right text-(--text-dark)">{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}

function AnimatedStatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  const animated = useCountUp(value);
  const Icon = icon;
  return (
    <article className="rounded-(--radius-card) border border-(--brand-100) bg-white p-5 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-soft)">
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-[0.12em] text-(--text-mid)">{label}</p>
        <span className="rounded-full bg-(--brand-50) p-2 text-(--brand-700)">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-(--brand-50)" />
      ) : (
        <p className="bagi-display mt-3 text-4xl text-(--brand-900)">
          {animated.toLocaleString("id-ID")}
        </p>
      )}
    </article>
  );
}

/**
 * Pulse skeleton sized to match the chart card it replaces, so
 * the layout doesn't jump when analytics finish loading.
 */
function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-(--radius-card) bg-(--brand-50)"
      style={{ height }}
      aria-hidden
    />
  );
}

function EmptyDataState() {
  return (
    <p className="py-12 text-center text-sm text-(--text-mid)">
      Tidak ada data untuk rentang tanggal ini
    </p>
  );
}
