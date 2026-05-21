"use client";

import { useMemo, useState } from "react";
import type { ActivityLogsResponse } from "../types";

type ActivityLogTableProps = {
  logs: ActivityLogsResponse["data"]["data"];
  total: number;
};

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

export function ActivityLogTable({ logs, total }: ActivityLogTableProps) {
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  const selectedLog = useMemo(
    () => logs.find((item) => item.id === selectedLogId) ?? null,
    [logs, selectedLogId],
  );

  return (
    <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 shadow-(--shadow-card)">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-(--brand-900)">Log Aktivitas</h2>
        <span className="text-xs uppercase tracking-[0.12em] text-(--text-mid)">
          {total.toLocaleString("id-ID")} Event
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-widest text-(--text-mid)">
              <th className="px-3 py-2">Waktu</th>
              <th className="px-3 py-2">Admin/User</th>
              <th className="px-3 py-2">Aksi</th>
              <th className="px-3 py-2">Objek</th>
              <th className="px-3 py-2">Detail</th>
              <th className="px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-(--text-mid)" colSpan={6}>
                  Belum ada aktivitas pada filter ini.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="cursor-pointer rounded-2xl bg-(--brand-50) text-(--brand-900)"
                  onClick={() => setSelectedLogId(log.id)}
                >
                  <td className="rounded-l-2xl px-3 py-3">
                    {new Date(log.created_at).toLocaleString("id-ID")}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold">{log.actor?.name ?? "Sistem"}</p>
                    <p className="text-xs text-(--text-mid)">{log.actor?.email ?? "-"}</p>
                  </td>
                  <td className="px-3 py-3">{formatAction(log.action)}</td>
                  <td className="px-3 py-3">
                    {formatEntityType(log.entity_type)} #{log.entity_id ?? "-"}
                  </td>
                  <td className="px-3 py-3">{metadataSummary(log.metadata)}</td>
                  <td className="rounded-r-2xl px-3 py-3">{metadataIp(log.metadata)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedLog ? (
        <div className="mt-5 rounded-2xl border border-(--brand-100) bg-(--brand-50) p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-(--brand-900)">Detail Aktivitas #{selectedLog.id}</h3>
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
      ) : null}
    </section>
  );
}

