"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Package, ArrowRight, Flame, Search, Filter, X, RefreshCw } from "lucide-react";
import useSWR from "swr";
import { ApiError, apiFetch, getUser, type AuthUser } from "@/lib/api";
import { type ApiDonation, type Donation, formatPickupTime, imageForDonation, mapApiDonation } from "@/lib/donations";
import { CountUp } from "@/lib/count-up";

const URGENT_WINDOW_HOURS = 6;
const EASE_OUT_QUART: [number, number, number, number] = [0.16, 1, 0.3, 1];

// SWR fetcher — apiFetch already throws ApiError on non-OK
const fetcher = (path: string) =>
  apiFetch<{ data: ApiDonation[] }>(path).then((r) => r.data.map(mapApiDonation));

type FilterKey = "all" | "urgent" | "today";

function hoursUntil(iso: string): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (t - Date.now()) / (1000 * 60 * 60);
}

function urgencyLabel(iso: string): { label: string; tone: "hot" | "warm" | null } {
  const h = hoursUntil(iso);
  if (h === null || h < 0) return { label: "", tone: null };
  if (h < 2) return { label: `${Math.max(1, Math.round(h * 60))} menit lagi`, tone: "hot" };
  if (h < URGENT_WINDOW_HOURS) return { label: `${Math.round(h)} jam lagi`, tone: "hot" };
  if (h < 24) return { label: "Hari ini", tone: "warm" };
  return { label: "", tone: null };
}

export default function ReceiverDashboard() {
  // ---------------------------------------------------------------------------
  // Auth (client-only, read once)
  // ---------------------------------------------------------------------------
  const user: AuthUser | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getUser();
  }, []);

  // ---------------------------------------------------------------------------
  // Data — SWR with background refresh every 60 s (replaces setInterval + setTick)
  // No full component re-render: only the parts that use `data` will update.
  // ---------------------------------------------------------------------------
  const {
    data: donations,
    error: swrError,
    isLoading,
    mutate,
    isValidating,
  } = useSWR<Donation[]>("/donations", fetcher, {
    refreshInterval: 60_000,      // background poll — no re-render tsunami
    revalidateOnFocus: false,     // don't refetch when user tabs back in
    dedupingInterval: 30_000,
    keepPreviousData: true,       // show stale data while refreshing
    onError: () => {},            // errors handled via swrError below
  });

  const [query, setQuery] = useState("");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");

  const error =
    swrError instanceof ApiError
      ? swrError.message
      : swrError
      ? "Gagal memuat donasi"
      : "";

  // Capture current time once — for time-dependent filtering
  // We rely on hoursUntil() to call Date.now() fresh on each render,
  // which allows real-time urgency calculations.
  // For stats/filtered, we accept a time snapshot per render.
  // Note: We use useMemo with empty deps to capture once, but we mark Date.now() as intentional
  // since it's wrapped in the useMemo factory function
  const now = typeof window === "undefined" ? 0 : Date.now();
  const endOfDay = useMemo(() => {
    if (typeof window === "undefined") return new Date(0);
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // ---------------------------------------------------------------------------
  // Derived stats (memoised — only recomputes when donations changes)
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    if (!donations) return { total: 0, endingToday: 0, urgent: 0 };
    let endingToday = 0;
    let urgent = 0;
    for (const d of donations) {
      const t = Date.parse(d.pickup_time);
      if (Number.isNaN(t)) continue;
      if (t >= now && t <= endOfDay.getTime()) endingToday += 1;
      const hrs = (t - now) / (1000 * 60 * 60);
      if (hrs >= 0 && hrs < URGENT_WINDOW_HOURS) urgent += 1;
    }
    return { total: donations.length, endingToday, urgent };
  }, [donations, now, endOfDay]);

  const filtered = useMemo(() => {
    if (!donations) return null;
    const q = query.trim().toLowerCase();
    return donations.filter((d) => {
      if (q) {
        const hay = [d.title, d.description, d.pickup_address, d.donor?.name ?? "", d.donor?.city ?? ""]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterKey === "urgent") {
        const h = hoursUntil(d.pickup_time);
        if (h === null || h < 0 || h >= URGENT_WINDOW_HOURS) return false;
      } else if (filterKey === "today") {
        const t = Date.parse(d.pickup_time);
        if (Number.isNaN(t) || t < now || t > endOfDay.getTime()) return false;
      }
      return true;
    });
  }, [donations, query, filterKey, now, endOfDay]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "";
  const hasActiveFilter = filterKey !== "all" || query.length > 0;

  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* HERO BANNER                                                          */}
      {/* ------------------------------------------------------------------ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT_QUART }}
        className="relative overflow-hidden rounded-3xl mb-8 border border-[var(--brand-100)]"
      >
        {/* Next.js Image: WebP auto-conversion, lazy, properly sized */}
        <Image
          src="/images/receiver-dashboard-banner.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1152px"
          className="pointer-events-none object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, rgba(7,23,16,0.88) 0%, rgba(13,43,26,0.74) 45%, rgba(26,71,49,0.42) 100%)",
          }}
        />
        <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
            Donasi tersedia
          </span>
          <h1 className="bagi-display mt-2 text-2xl sm:text-3xl font-semibold text-white">
            {greeting}{firstName ? `, ${firstName}` : ""} —{" "}
            {stats.total > 0 ? (
              <>
                <CountUp value={stats.total} /> donasi menunggu Anda
              </>
            ) : (
              "belum ada donasi, tetap pantau"
            )}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
            Pilih yang bisa Anda jemput tepat waktu. Setiap klaim divalidasi foto — tanpa biaya, tanpa komisi.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <StatChip label={`${stats.total} tersedia`} tone="default" />
            {stats.endingToday > 0 && (
              <StatChip label={`${stats.endingToday} berakhir hari ini`} tone="warm" />
            )}
            {stats.urgent > 0 && (
              <StatChip
                label={`${stats.urgent} harus segera diambil`}
                tone="hot"
                icon={<Flame className="h-3 w-3" />}
                pulse
              />
            )}
          </div>
        </div>
      </motion.section>

      {/* ------------------------------------------------------------------ */}
      {/* SEARCH / FILTER BAR                                                 */}
      {/* ------------------------------------------------------------------ */}
      {donations && donations.length > 0 && (
        <div className="mb-5 sticky top-[72px] z-10 -mx-2 px-2 py-3 bg-[var(--cream)]/85 backdrop-blur rounded-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-mid)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari berdasarkan nama, alamat, donatur..."
                aria-label="Cari donasi"
                className="w-full rounded-xl border border-[var(--brand-100)] bg-white py-2.5 pl-9 pr-9 text-sm text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/60 focus:border-[var(--brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
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
              <FilterChip active={filterKey === "all"} onClick={() => setFilterKey("all")}>
                Semua
              </FilterChip>
              <FilterChip
                active={filterKey === "urgent"}
                onClick={() => setFilterKey("urgent")}
                tone="hot"
                count={stats.urgent}
              >
                Mendesak
              </FilterChip>
              <FilterChip
                active={filterKey === "today"}
                onClick={() => setFilterKey("today")}
                tone="warm"
                count={stats.endingToday}
              >
                Hari ini
              </FilterChip>
              {/* Manual refresh button — SWR mutate, no full re-render */}
              <motion.button
                type="button"
                onClick={() => mutate()}
                disabled={isValidating}
                aria-label="Muat ulang daftar donasi"
                whileTap={{ scale: 0.9 }}
                className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--brand-100)] bg-white text-[var(--brand-700)] hover:border-[var(--brand-300)] disabled:opacity-60"
              >
                <motion.span
                  animate={isValidating ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    isValidating
                      ? { duration: 0.8, ease: "linear", repeat: Infinity }
                      : { duration: 0.3 }
                  }
                  className="flex"
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.span>
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {hasActiveFilter && filtered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-[var(--text-mid)] mt-2 px-1"
              >
                Menampilkan <span className="font-semibold text-[var(--brand-700)]">{filtered.length}</span> dari {donations.length} donasi
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ERROR                                                                */}
      {/* ------------------------------------------------------------------ */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 p-3 rounded-2xl text-sm font-medium bg-red-50 text-red-700 border border-red-200"
        >
          {error}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STATES                                                               */}
      {/* ------------------------------------------------------------------ */}
      {isLoading && !donations && <SkeletonGrid />}

      {donations && donations.length === 0 && !error && (
        <EmptyState
          title="Belum ada donasi tersedia"
          body="Donatur baru bergabung setiap hari. Aktifkan notifikasi atau periksa kembali dalam beberapa jam."
        />
      )}

      {donations && donations.length > 0 && filtered && filtered.length === 0 && (
        <EmptyState
          title="Tidak ada hasil"
          body={hasActiveFilter ? "Coba ubah kata kunci atau hapus filter." : "Belum ada donasi yang cocok."}
          action={
            hasActiveFilter && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilterKey("all");
                }}
                className="inline-flex items-center gap-2 bg-[var(--brand-600)] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[var(--brand-700)]"
              >
                Reset pencarian
              </button>
            )
          }
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DONATION GRID                                                        */}
      {/* ------------------------------------------------------------------ */}
      {filtered && filtered.length > 0 && (
        <motion.div layout className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((d, i) => (
              <DonationCard key={d.id} donation={d} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/* ============================================================ */
/* COMPONENTS                                                    */
/* ============================================================ */

function DonationCard({ donation, index }: { donation: Donation; index: number }) {
  const urg = urgencyLabel(donation.pickup_time);
  const image = imageForDonation(donation);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.05, ease: EASE_OUT_QUART }}
      whileHover="hover"
      className="group relative bg-white border border-[var(--brand-100)] rounded-3xl overflow-hidden flex flex-col shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] hover:border-[var(--brand-300)] transition-all"
    >
      <div className="relative h-44 overflow-hidden bg-[var(--brand-50)]">
        <motion.img
          src={image}
          alt={donation.title}
          loading="lazy"
          className="h-full w-full object-cover"
          variants={{ hover: { scale: 1.06 } }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent"
        />
        <span className="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/95 text-[var(--brand-700)] shadow-sm backdrop-blur">
          {donation.quantity}
        </span>
        {urg.tone === "hot" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-red-500/95 text-white px-2.5 py-1 text-[11px] font-semibold shadow-md backdrop-blur"
          >
            <motion.span
              animate={{ scale: [1, 1.25, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="flex"
            >
              <Flame className="h-3 w-3" />
            </motion.span>
            {urg.label}
          </motion.div>
        )}
        {urg.tone === "warm" && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 text-amber-950 px-2.5 py-1 text-[11px] font-semibold shadow-md backdrop-blur">
            {urg.label}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-[var(--brand-950)] leading-tight mb-2 line-clamp-1">
          {donation.title}
        </h3>
        <p className="text-sm text-[var(--text-mid)] line-clamp-2 mb-4">{donation.description}</p>
        <div className="space-y-2 text-sm text-[var(--brand-950)] mb-4">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-[var(--brand-600)] mt-0.5 shrink-0" />
            <span>{formatPickupTime(donation.pickup_time)}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-[var(--brand-600)] mt-0.5 shrink-0" />
            <span className="line-clamp-1">{donation.pickup_address}</span>
          </div>
        </div>
        <div className="text-xs text-[var(--text-mid)] mb-4">
          Dari{" "}
          <span className="font-semibold text-[var(--brand-950)]">
            {donation.donor?.name ?? "Donatur"}
          </span>
          {donation.donor?.city ? ` · ${donation.donor.city}` : ""}
        </div>
        <Link
          href={`/receiver/donations/${donation.id}`}
          className="mt-auto inline-flex items-center justify-center gap-2 bg-[var(--brand-600)] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[var(--brand-700)] transition-all group-hover:gap-3"
        >
          Lihat detail
          <motion.span variants={{ hover: { x: 3 } }} transition={{ duration: 0.25 }} className="inline-flex">
            <ArrowRight className="h-4 w-4" />
          </motion.span>
        </Link>
      </div>
    </motion.article>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  tone,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "hot" | "warm";
  count?: number;
}) {
  const activeClass = active
    ? tone === "hot"
      ? "bg-red-600 text-white border-red-600"
      : tone === "warm"
        ? "bg-amber-500 text-white border-amber-500"
        : "bg-[var(--brand-600)] text-white border-[var(--brand-600)]"
    : "bg-white text-[var(--text-mid)] border-[var(--brand-100)] hover:border-[var(--brand-300)] hover:text-[var(--brand-700)]";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${activeClass}`}
    >
      {children}
      {typeof count === "number" && count > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full inline-flex items-center justify-center ${
            active ? "bg-white/25" : "bg-[var(--brand-50)] text-[var(--brand-700)]"
          }`}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}

function StatChip({
  label,
  tone,
  icon,
  pulse,
}: {
  label: string;
  tone: "default" | "warm" | "hot";
  icon?: React.ReactNode;
  pulse?: boolean;
}) {
  const toneClass =
    tone === "hot"
      ? "bg-white/95 text-red-700"
      : tone === "warm"
        ? "bg-white/95 text-amber-700"
        : "bg-white/15 text-white border border-white/20 backdrop-blur";
  return (
    <motion.span
      animate={pulse ? { scale: [1, 1.04, 1] } : undefined}
      transition={pulse ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}
    >
      {icon}
      {label}
    </motion.span>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-[var(--brand-100)] rounded-3xl p-12 text-center"
    >
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)] mb-4">
        <Package className="h-6 w-6" />
      </div>
      <h2 className="font-bold text-lg text-[var(--brand-950)]">{title}</h2>
      <p className="text-[var(--text-mid)] mt-1 text-sm">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-[var(--brand-100)] rounded-3xl overflow-hidden animate-pulse"
        >
          <div className="h-44 bg-[var(--brand-50)]" />
          <div className="p-5">
            <div className="h-4 w-2/3 bg-[var(--brand-50)] rounded mb-3" />
            <div className="h-3 w-full bg-[var(--brand-50)] rounded mb-2" />
            <div className="h-3 w-5/6 bg-[var(--brand-50)] rounded mb-5" />
            <div className="h-3 w-1/2 bg-[var(--brand-50)] rounded mb-2" />
            <div className="h-3 w-2/3 bg-[var(--brand-50)] rounded mb-5" />
            <div className="h-10 w-full bg-[var(--brand-50)] rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
