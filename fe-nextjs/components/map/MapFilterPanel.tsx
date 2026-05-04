"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { DonationMapFilters, DonationMapStatus } from "@/types/donation-map";

type CategoryOption = {
  id: number;
  name: string;
};

type MapFilterPanelProps = {
  filters: DonationMapFilters;
  categories: CategoryOption[];
  isOpen: boolean;
  onToggle: () => void;
  onChange: (filters: DonationMapFilters) => void;
  onReset: () => void;
};

const STATUS_OPTIONS: Array<{ value: DonationMapStatus; label: string }> = [
  { value: "available", label: "Tersedia" },
  { value: "claimed", label: "Diklaim" },
];

export default function MapFilterPanel({
  filters,
  categories,
  isOpen,
  onToggle,
  onChange,
  onReset,
}: MapFilterPanelProps) {
  const hasActiveFilter = filters.category_id !== "" || filters.status !== "available" || filters.q.trim() !== "";

  return (
    <section className="rounded-2xl border border-[var(--brand-100)] bg-white p-3 shadow-[var(--shadow-card)] lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-50)] px-3 py-2 text-sm font-bold text-[var(--brand-700)]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter peta
        </button>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset filter"
            className="rounded-xl p-2 text-[var(--text-mid)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className={`${isOpen ? "mt-3 grid" : "hidden"} gap-3 lg:mt-0 lg:grid`}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-mid)]" />
          <input
            type="search"
            value={filters.q}
            onChange={(event) => onChange({ ...filters, q: event.target.value })}
            placeholder="Cari judul atau deskripsi..."
            aria-label="Cari donasi di peta"
            className="w-full rounded-xl border border-[var(--brand-100)] bg-[var(--cream)] py-2.5 pl-9 pr-9 text-sm text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/60 focus:border-[var(--brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
          />
          {filters.q && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, q: "" })}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-mid)] hover:bg-white hover:text-[var(--brand-700)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-mid)]">
            Kategori
            <select
              value={filters.category_id}
              onChange={(event) => onChange({ ...filters, category_id: event.target.value })}
              className="rounded-xl border border-[var(--brand-100)] bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-[var(--brand-950)] focus:border-[var(--brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-mid)]">
            Status
            <select
              value={filters.status}
              onChange={(event) => onChange({ ...filters, status: event.target.value as DonationMapStatus })}
              className="rounded-xl border border-[var(--brand-100)] bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-[var(--brand-950)] focus:border-[var(--brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--brand-100)] bg-white px-3 py-2.5 text-sm font-bold text-[var(--brand-700)] hover:bg-[var(--brand-50)]"
          >
            <X className="h-4 w-4" />
            Reset filter
          </button>
        )}
      </div>
    </section>
  );
}
