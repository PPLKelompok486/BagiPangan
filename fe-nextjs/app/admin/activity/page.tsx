"use client";

import { useEffect, useState } from "react";
import { ActivityLogTable } from "../components/activity-log-table";
import type { ActivityLogsResponse } from "../types";

const emptyActivityLogs: ActivityLogsResponse = {
  message: "Fallback activity logs",
  data: {
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1,
    data: [],
  },
};

type Filters = {
  search: string;
  action: string;
  entityType: string;
  dateFrom: string;
  dateTo: string;
};

async function getActivityLogs(filters: Filters) {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.action) params.set("action", filters.action);
    if (filters.entityType) params.set("entity_type", filters.entityType);
    if (filters.dateFrom) params.set("date_from", filters.dateFrom);
    if (filters.dateTo) params.set("date_to", filters.dateTo);
    params.set("per_page", "20");

    const query = params.toString();
    const endpoint = query ? `/api/admin/activity-logs?${query}` : "/api/admin/activity-logs";
    const res = await fetch(endpoint, {
      cache: "no-store",
    });

    if (!res.ok) return emptyActivityLogs;
    return (await res.json()) as ActivityLogsResponse;
  } catch {
    return emptyActivityLogs;
  }
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogsResponse>(emptyActivityLogs);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    action: "",
    entityType: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      const data = await getActivityLogs(filters);
      setLogs(data);
      setLoading(false);
    }

    void bootstrap();
  }, [filters]);

  return (
    <>
      <section className="rounded-[1.6rem] border border-(--brand-100) bg-white p-6 shadow-(--shadow-card)">
        <p className="text-xs uppercase tracking-[0.15em] text-(--brand-600)">Audit</p>
        <h2 className="bagi-display mt-2 text-4xl text-(--brand-900)">Log Aktivitas</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-mid)">
          Pantau jejak perubahan sistem dengan filter berdasarkan aksi, objek, dan rentang waktu.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            className="rounded-xl border border-(--brand-200) px-3 py-2 text-sm outline-none focus:border-(--brand-500)"
            placeholder="Cari actor, aksi, entity, metadata"
          />
          <input
            value={filters.action}
            onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))}
            className="rounded-xl border border-(--brand-200) px-3 py-2 text-sm outline-none focus:border-(--brand-500)"
            placeholder="Aksi (contoh: donation.approved)"
          />
          <input
            value={filters.entityType}
            onChange={(event) => setFilters((prev) => ({ ...prev, entityType: event.target.value }))}
            className="rounded-xl border border-(--brand-200) px-3 py-2 text-sm outline-none focus:border-(--brand-500)"
            placeholder="Entity type (contoh: donation)"
          />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
            className="rounded-xl border border-(--brand-200) px-3 py-2 text-sm outline-none focus:border-(--brand-500)"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
            className="rounded-xl border border-(--brand-200) px-3 py-2 text-sm outline-none focus:border-(--brand-500)"
          />
        </div>
      </section>

      {loading ? (
        <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 text-sm text-(--text-mid) shadow-(--shadow-card)">
          Memuat log aktivitas...
        </section>
      ) : (
        <ActivityLogTable logs={logs.data.data} total={logs.data.total} />
      )}
    </>
  );
}

