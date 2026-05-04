"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CalendarClock, Filter, MapPin, Package, Plus, Search, X } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import {
  mapApiDonationToDonor,
  STATUS_LABEL,
  STATUS_TONE,
  type ApiDonation,
  type DonorDonation,
  type DonorDonationStatus,
} from "../lib/mock-donations";

type FilterKey = "all" | DonorDonationStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "approved", label: "Aktif" },
  { key: "claimed", label: "Diklaim" },
  { key: "pending", label: "Menunggu" },
  { key: "rejected", label: "Ditolak" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
];

export default function DonorDonationsListPage() {
  const [donations, setDonations] = useState<DonorDonation[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");

  useEffect(() => {
    let active = true;
    const fetchDonations = async () => {
      try {
        const res = await apiFetch<{ data: ApiDonation[] }>("/donations/mine");
        if (!active) return;
        setDonations(res.data.map(mapApiDonationToDonor));
      } catch (err) {
        if (!active) return;
        const message = err instanceof ApiError ? err.message : "Gagal memuat donasi";
        setError(message);
        setDonations([]);
      }
    };

    void fetchDonations();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!donations) return null;
    const q = query.trim().toLowerCase();
    return donations.filter((d) => {
      if (filterKey !== "all" && d.status !== filterKey) return false;
      if (!q) return true;
      const hay = `${d.title} ${d.description} ${d.pickup_address}`.toLowerCase();
      return hay.includes(q);
    });
  }, [donations, query, filterKey]);

  const hasFilter = filterKey !== "all" || query.length > 0;

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/donatur/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)] mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke dashboard
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="bagi-display text-2xl font-semibold text-[var(--brand-950)]">
            Donasi saya
          </h1>
          <p className="text-sm text-[var(--text-mid)]">
            Semua donasi yang pernah Anda posting.
          </p>
        </div>
        <Link
          href="/donatur/donations/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-700)]"
        >
          <Plus className="h-4 w-4" />
          Buat donasi baru
        </Link>
      </div>

      <div className="mb-4 rounded-2xl border border-[var(--brand-100)] bg-white p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-mid)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul atau alamat..."
              aria-label="Cari donasi"
              className="w-full rounded-xl border border-[var(--brand-100)] bg-[var(--cream)] py-2.5 pl-9 pr-9 text-sm text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/60 focus:border-[var(--brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-mid)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-4 w-4 text-[var(--text-mid)] mr-1" aria-hidden="true" />
            {FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                active={filterKey === f.key}
                onClick={() => setFilterKey(f.key)}
              >
                {f.label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {donations === null && <DonationListSkeleton />}

      {donations && donations.length === 0 && !error && (
        <EmptyState />
      )}

      {filtered && filtered.length === 0 && donations && donations.length > 0 && (
        <div className="rounded-3xl border border-[var(--brand-100)] bg-white p-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)] mb-3">
            <Package className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-[var(--brand-950)]">Tidak ada hasil</h3>
          <p className="text-sm text-[var(--text-mid)] mt-1">
            {hasFilter ? "Coba ubah kata kunci atau hapus filter." : "Belum ada donasi yang cocok."}
          </p>
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilterKey("all");
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-700)]"
            >
              Reset pencarian
            </button>
          )}
        </div>
      )}

      {filtered && filtered.length > 0 && (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((donation, index) => (
              <DonationCard key={donation.id} donation={donation} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
        active
          ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)]"
          : "bg-white text-[var(--text-mid)] border-[var(--brand-100)] hover:border-[var(--brand-300)] hover:text-[var(--brand-700)]"
      }`}
    >
      {children}
    </motion.button>
  );
}

function DonationCard({ donation, index }: { donation: DonorDonation; index: number }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="group relative flex flex-col rounded-2xl border border-[var(--brand-100)] bg-white p-5 shadow-[var(--shadow-card)] hover:border-[var(--brand-300)] transition"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-[var(--brand-950)] leading-tight line-clamp-1">
          {donation.title}
        </h3>
        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${STATUS_TONE[donation.status]}`}>
          {STATUS_LABEL[donation.status]}
        </span>
      </div>
      <p className="mt-2 text-sm text-[var(--text-mid)] line-clamp-2">{donation.description}</p>

      <div className="mt-4 space-y-1.5 text-sm text-[var(--brand-950)]">
        <div className="flex items-start gap-2">
          <CalendarClock className="h-4 w-4 text-[var(--brand-600)] mt-0.5 shrink-0" />
          <span>{formatTime(donation.pickup_time)}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-[var(--brand-600)] mt-0.5 shrink-0" />
          <span className="line-clamp-1">{donation.pickup_address}</span>
        </div>
        <div className="flex items-start gap-2">
          <Package className="h-4 w-4 text-[var(--brand-600)] mt-0.5 shrink-0" />
          <span>{donation.quantity} · ~{donation.estimated_meals} porsi</span>
        </div>
      </div>

      <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[var(--text-mid)]/70">
        {timeAgo(donation.created_at)}
      </div>
    </motion.article>
  );
}

function DonationListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-2xl border border-[var(--brand-100)] bg-white"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-3xl border border-[var(--brand-100)] bg-white p-10 text-center"
    >
      <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)]">
        <Package className="h-6 w-6" />
      </div>
      <h2 className="bagi-display text-2xl font-semibold text-[var(--brand-950)]">
        Belum ada donasi
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-mid)]">
        Mulai dengan membuat donasi pertama agar komunitas penerima bisa melihatnya.
      </p>
      <div className="mt-5 flex justify-center">
        <Link
          href="/donatur/donations/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-700)]"
        >
          <Plus className="h-4 w-4" />
          Buat donasi baru
        </Link>
      </div>
    </motion.div>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diffMin = Math.round((Date.now() - t) / 60_000);
  if (Math.abs(diffMin) < 1) return "baru saja";
  if (diffMin > 0) {
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const h = Math.round(diffMin / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.round(h / 24);
    return `${d} hari lalu`;
  }
  const fwd = -diffMin;
  if (fwd < 60) return `dalam ${fwd} menit`;
  const h = Math.round(fwd / 60);
  if (h < 24) return `dalam ${h} jam`;
  const d = Math.round(h / 24);
  return `dalam ${d} hari`;
}
