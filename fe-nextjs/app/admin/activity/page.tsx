"use client";

import { useEffect, useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import type { ActivityLogsResponse } from "../types";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { DatePicker } from "@/components/admin/date-picker";

type ActivityLog = ActivityLogsResponse["data"]["data"][number];

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
  action: string;
  entityType: string;
  dateFrom: string;
  dateTo: string;
};

async function getActivityLogs(filters: Filters) {
  try {
    const params = new URLSearchParams();
    if (filters.action) params.set("action", filters.action);
    if (filters.entityType) params.set("entity_type", filters.entityType);
    if (filters.dateFrom) params.set("date_from", filters.dateFrom);
    if (filters.dateTo) params.set("date_to", filters.dateTo);
    params.set("per_page", "20");

    const query = params.toString();
    const endpoint = query ? `/api/admin/activity-logs?${query}` : "/api/admin/activity-logs";
    const res = await fetch(endpoint, { cache: "no-store" });

    if (!res.ok) return emptyActivityLogs;
    return (await res.json()) as ActivityLogsResponse;
  } catch {
    return emptyActivityLogs;
  }
}

const ACTION_LABELS: Record<string, string> = {
  "donation.approved": "Donasi disetujui",
  "donation.rejected": "Donasi ditolak",
  "donation.created": "Donasi dibuat",
  "donation.updated": "Donasi diperbarui",
  "donation.deleted": "Donasi dihapus",
  "user.updated": "Pengguna diperbarui",
  export_report: "Laporan diekspor",
};

function formatAction(action: string) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  return action
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatEntityType(entityType: string) {
  if (entityType.includes("\\")) {
    const parts = entityType.split("\\");
    return parts[parts.length - 1] ?? entityType;
  }
  return entityType;
}

function metadataSummary(metadata: Record<string, unknown> | null) {
  if (!metadata) return "-";
  const title = metadata.title;
  if (typeof title === "string" && title.trim()) return title;
  const reason = metadata.reason;
  if (typeof reason === "string" && reason.trim()) return reason;
  const keys = Object.keys(metadata);
  if (keys.length === 0) return "-";
  return `Metadata (${keys.length})`;
}

function metadataIp(metadata: Record<string, unknown> | null) {
  if (!metadata) return "-";
  const value = metadata.ip;
  return typeof value === "string" && value.trim() ? value : "-";
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogsResponse>(emptyActivityLogs);
  const [loading, setLoading] = useState(true);

  // Client-side search (on action text / actor name)
  const [search, setSearch] = useState("");

  // Server-side filters (kept from original)
  const [filters, setFilters] = useState<Filters>({
    action: "",
    entityType: "",
    dateFrom: "",
    dateTo: "",
  });

  // Detail panel
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    async function bootstrap() {
      setLoading(true);
      const data = await getActivityLogs(filters);
      if (!ignore) {
        setLogs(data);
        setSelectedLogId(null);
      }
      setLoading(false);
    }

    void bootstrap();
    return () => {
      ignore = true;
    };
  }, [filters]);

  const logList = logs.data.data;

  // Client-side search filter on top of server results
  const filtered = useMemo(() => {
    if (!search.trim()) return logList;
    const q = search.toLowerCase();
    return logList.filter(
      (log) =>
        formatAction(log.action).toLowerCase().includes(q) ||
        (log.actor?.name ?? "").toLowerCase().includes(q) ||
        (log.actor?.email ?? "").toLowerCase().includes(q) ||
        metadataSummary(log.metadata).toLowerCase().includes(q),
    );
  }, [logList, search]);

  const selectedLog = useMemo(
    () => filtered.find((item) => item.id === selectedLogId) ?? null,
    [filtered, selectedLogId],
  );

  const columns: Column<ActivityLog>[] = [
    {
      key: "created_at",
      header: "Waktu",
      sortable: true,
      sortValue: (log) => log.created_at,
      render: (log) => new Date(log.created_at).toLocaleString("id-ID"),
    },
    {
      key: "actor",
      header: "Admin/User",
      render: (log) => (
        <div>
          <p className="font-semibold text-(--brand-900)">{log.actor?.name ?? "Sistem"}</p>
          <p className="text-xs text-(--text-mid)">{log.actor?.email ?? "-"}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Aksi",
      render: (log) => (
        <StatusBadge tone="info">{formatAction(log.action)}</StatusBadge>
      ),
    },
    {
      key: "entity",
      header: "Objek",
      render: (log) =>
        `${formatEntityType(log.entity_type)} #${log.entity_id ?? "-"}`,
    },
    {
      key: "detail",
      header: "Detail",
      render: (log) => metadataSummary(log.metadata),
    },
    {
      key: "ip",
      header: "IP",
      render: (log) => metadataIp(log.metadata),
    },
    {
      key: "expand",
      header: "",
      align: "right",
      render: (log) => (
        <button
          type="button"
          onClick={() => setSelectedLogId(log.id === selectedLogId ? null : log.id)}
          className="rounded-(--radius-pill) border border-(--brand-100) bg-(--brand-50) px-2.5 py-1 text-xs text-(--text-mid) hover:border-(--brand-300) hover:text-(--brand-700)"
        >
          {log.id === selectedLogId ? "Tutup" : "Detail"}
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Log Aktivitas"
        description="Pantau jejak perubahan sistem dengan filter berdasarkan aksi, objek, dan rentang waktu."
      />

      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Cari aksi, aktor, atau detail…"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={filters.action}
              onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
              className="rounded-(--radius-pill) border border-(--brand-100) bg-white px-3 py-2 text-sm text-(--text-dark) outline-none focus:border-(--brand-400) focus:ring-2 focus:ring-(--brand-100)"
              placeholder="Aksi (donation.approved)"
            />
            <input
              value={filters.entityType}
              onChange={(e) => setFilters((prev) => ({ ...prev, entityType: e.target.value }))}
              className="rounded-(--radius-pill) border border-(--brand-100) bg-white px-3 py-2 text-sm text-(--text-dark) outline-none focus:border-(--brand-400) focus:ring-2 focus:ring-(--brand-100)"
              placeholder="Entity (donation)"
            />
            <DatePicker
              value={filters.dateFrom}
              onChange={(iso) => setFilters((prev) => ({ ...prev, dateFrom: iso }))}
              max={filters.dateTo || undefined}
              ariaLabel="Dari tanggal"
              placeholder="Tanggal awal"
            />
            <DatePicker
              value={filters.dateTo}
              onChange={(iso) => setFilters((prev) => ({ ...prev, dateTo: iso }))}
              min={filters.dateFrom || undefined}
              ariaLabel="Sampai tanggal"
              placeholder="Tanggal akhir"
            />
          </div>
        }
      />

      <DataTable<ActivityLog>
        columns={columns}
        data={filtered}
        getRowId={(log) => String(log.id)}
        loading={loading}
        emptyState={
          <EmptyState
            icon={ScrollText}
            title="Belum ada aktivitas"
            description="Aktivitas sistem akan tercatat dan muncul di sini."
          />
        }
      />

      {/* Detail panel */}
      {selectedLog && (
        <div className="rounded-(--radius-card) border border-(--brand-100) bg-(--brand-50) p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-(--brand-900)">
              Detail Aktivitas #{selectedLog.id}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedLogId(null)}
              className="rounded-lg border border-(--brand-200) px-2.5 py-1 text-xs text-(--text-mid) hover:bg-white"
            >
              Tutup
            </button>
          </div>
          <p className="text-sm text-(--brand-900)">
            {formatAction(selectedLog.action)} pada {formatEntityType(selectedLog.entity_type)} #
            {selectedLog.entity_id ?? "-"}
          </p>
          <pre className="mt-3 max-h-[260px] overflow-auto rounded-xl bg-white p-3 text-xs leading-6 text-(--brand-900)">
            {JSON.stringify(selectedLog.metadata ?? {}, null, 2)}
          </pre>
        </div>
      )}

      {/* Total count */}
      <p className="text-right text-xs text-(--text-mid)">
        {logs.data.total.toLocaleString("id-ID")} event total
      </p>
    </>
  );
}
