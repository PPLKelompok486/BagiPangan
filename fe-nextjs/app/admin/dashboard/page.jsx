"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { apiFetch, getUser, ApiError } from "@/lib/api";

const STATUS_COLORS = {
  Tersedia: "#16a34a",
  Diklaim: "#f59e0b",
  Selesai: "#2563eb",
  Dibatalkan: "#ef4444",
};

const SUMMARY_CARDS = [
  { key: "total_donations", label: "Total Donasi", className: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  { key: "available", label: "Tersedia", className: "bg-green-50 border-green-200 text-green-800" },
  { key: "claimed", label: "Diklaim", className: "bg-amber-50 border-amber-200 text-amber-800" },
  { key: "completed", label: "Selesai", className: "bg-blue-50 border-blue-200 text-blue-800" },
  { key: "cancelled", label: "Dibatalkan", className: "bg-red-50 border-red-200 text-red-800" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgoIso() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function formatDateID(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function formatDateLongID(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgoIso());
  const [dateTo, setDateTo] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (u.role !== "admin") {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.set("date_from", dateFrom);
        if (dateTo) params.set("date_to", dateTo);
        const qs = params.toString();
        const res = await apiFetch(`/admin/dashboard${qs ? `?${qs}` : ""}`);
        if (!cancelled) setData(res);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Gagal memuat data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authChecked, dateFrom, dateTo, router]);

  const statusPieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Tersedia", value: data.summary.available },
      { name: "Diklaim", value: data.summary.claimed },
      { name: "Selesai", value: data.summary.completed },
      { name: "Dibatalkan", value: data.summary.cancelled },
    ].filter((d) => d.value > 0);
  }, [data]);

  const lineData = useMemo(() => {
    if (!data) return [];
    return data.donations_per_day.map((d) => ({
      ...d,
      label: formatDateID(d.date),
    }));
  }, [data]);

  if (!authChecked) {
    return null;
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-green-950">Laporan & Analitik Donasi</h1>
        <p className="text-sm text-slate-600">
          Pantau performa donasi di rentang waktu yang dipilih.
        </p>
      </header>

      <section className="bg-white border border-green-100 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Dari tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Sampai tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              max={todayIso()}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-green-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          {data && !loading && (
            <div className="text-xs text-slate-500 sm:pb-2">
              Periode: {formatDateLongID(data.date_from)} – {formatDateLongID(data.date_to)}
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {SUMMARY_CARDS.map((card) => (
          <div
            key={card.key}
            className={`rounded-2xl border p-4 ${card.className}`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
              {card.label}
            </div>
            {loading ? (
              <div className="mt-2 h-8 w-16 bg-white/50 rounded animate-pulse" />
            ) : (
              <div className="mt-1 text-3xl font-bold">
                {data?.summary[card.key] ?? 0}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Donasi per Hari" loading={loading} empty={!loading && lineData.every((d) => d.count === 0)}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(_, payload) => {
                  const raw = payload?.[0]?.payload?.date;
                  return formatDateLongID(raw);
                }}
                formatter={(value) => [value, "Donasi"]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#16a34a" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribusi Status" loading={loading} empty={!loading && statusPieData.length === 0}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusPieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
              >
                {statusPieData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend verticalAlign="bottom" height={32} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <ChartCard
          title="Distribusi Kategori"
          loading={loading}
          empty={!loading && (data?.category_breakdown?.length ?? 0) === 0}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data?.category_breakdown ?? []}
              margin={{ top: 10, right: 16, bottom: 0, left: -8 }}
            >
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip formatter={(value) => [value, "Donasi"]} />
              <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-white border border-green-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <h2 className="font-semibold text-green-950 mb-3">Top Donatur</h2>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : (data?.top_donors?.length ?? 0) === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">Belum ada donatur.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-green-100">
                    <th className="py-2 px-2 w-12">#</th>
                    <th className="py-2 px-2">Nama</th>
                    <th className="py-2 px-2 text-right">Total Donasi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_donors.map((d, idx) => (
                    <tr key={d.id} className="border-b border-green-50 last:border-0">
                      <td className="py-2.5 px-2">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : idx === 1
                                ? "bg-slate-100 text-slate-700"
                                : idx === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-50 text-green-700"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-medium text-green-950">{d.name}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-green-700">
                        {d.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ChartCard({ title, loading, empty, children }) {
  return (
    <div className="bg-white border border-green-100 rounded-2xl p-4 sm:p-5 shadow-sm">
      <h2 className="font-semibold text-green-950 mb-3">{title}</h2>
      {loading ? (
        <div className="h-[280px] rounded-xl bg-green-50 animate-pulse" />
      ) : empty ? (
        <div className="h-[280px] flex items-center justify-center text-sm text-slate-500">
          Tidak ada data pada periode ini.
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="h-7 w-7 rounded-full bg-green-50 animate-pulse" />
          <div className="flex-1 h-4 bg-green-50 rounded animate-pulse" />
          <div className="h-4 w-12 bg-green-50 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
