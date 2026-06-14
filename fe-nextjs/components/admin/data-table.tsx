"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "./cn";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
};

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

export function DataTable<T>({
  columns,
  data,
  getRowId,
  loading = false,
  error,
  emptyState,
  onRetry,
  selectable = false,
  onSelectionChange,
  className,
}: {
  columns: Column<T>[];
  data: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  emptyState?: React.ReactNode;
  onRetry?: () => void;
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  className?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [data, sortKey, sortDir, columns]);

  function toggleSort(col: Column<T>) {
    if (!col.sortable) return;
    if (sortKey === col.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  }

  function toggleRow(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    onSelectionChange?.([...next]);
  }

  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cn("overflow-hidden rounded-(--radius-card) border border-(--brand-100) bg-white", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-(--brand-100) bg-(--brand-50)/60 text-left text-xs uppercase tracking-[0.08em] text-(--text-mid)">
            {selectable && <th className="w-10 px-4 py-3" />}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-3 font-semibold", ALIGN[col.align ?? "left"], col.sortable && "cursor-pointer select-none")}
                onClick={() => toggleSort(col)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-(--brand-50)">
                <td colSpan={colSpan} className="px-4 py-4">
                  <div className="h-4 w-full animate-pulse rounded bg-(--brand-50)" />
                </td>
              </tr>
            ))}

          {!loading && error && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-(--status-danger)">
                {error}
                {onRetry && (
                  <button onClick={onRetry} className="ml-3 font-semibold underline">
                    Coba lagi
                  </button>
                )}
              </td>
            </tr>
          )}

          {!loading && !error && sorted.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="p-4">
                {emptyState ?? <p className="py-8 text-center text-sm text-(--text-mid)">Tidak ada data.</p>}
              </td>
            </tr>
          )}

          {!loading &&
            !error &&
            sorted.map((row) => {
              const id = getRowId(row);
              return (
                <tr key={id} className="border-b border-(--brand-50) transition-colors hover:bg-(--brand-50)/50">
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleRow(id)}
                        aria-label={`Pilih baris ${id}`}
                        className="h-4 w-4 accent-(--brand-600)"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-(--text-dark)", ALIGN[col.align ?? "left"], col.className)}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
