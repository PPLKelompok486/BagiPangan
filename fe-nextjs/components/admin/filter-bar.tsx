"use client";

import { Search } from "lucide-react";
import { cn } from "./cn";

export type SelectFilter = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
};

export function FilterBar({
  search,
  onSearch,
  searchPlaceholder = "Cari…",
  filters = [],
  actions,
  className,
}: {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  filters?: SelectFilter[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-mid)" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-(--radius-pill) border border-(--brand-100) bg-white py-2 pl-9 pr-3 text-sm text-(--text-dark) outline-none focus:border-(--brand-400) focus:ring-2 focus:ring-(--brand-100)"
          />
        </div>
        {filters.map((f) => (
          <select
            key={f.label}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            aria-label={f.label}
            className="rounded-(--radius-pill) border border-(--brand-100) bg-white px-3 py-2 text-sm text-(--text-dark) outline-none focus:border-(--brand-400) focus:ring-2 focus:ring-(--brand-100)"
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
