"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  X,
  Package,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
  TrendingUp,
  HandHeart,
  CalendarClock,
  MapPin,
  Activity,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { ApiError, apiFetch, getUser, type AuthUser } from "@/lib/api";
import {
  buildImpactEvents,
  mapApiDonationToDonor,
  STATUS_LABEL,
  STATUS_TONE,
  type ApiDonation,
  type DonorDonation,
  type DonorDonationStatus,
  type ImpactEvent,
} from "../lib/mock-donations";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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

export default function DonaturDashboard() {
  const [user] = useState<AuthUser | null>(() => getUser());
  const [donations, setDonations] = useState<DonorDonation[] | null>(null);
  const [events, setEvents] = useState<ImpactEvent[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");

  useEffect(() => {
    let active = true;

    const fetchDonations = async () => {
      try {
        const res = await apiFetch<{ data: ApiDonation[] }>("/donations/mine");
        if (!active) return;
        const mapped = res.data.map(mapApiDonationToDonor);
        setDonations(mapped);
        setEvents(buildImpactEvents(res.data));
      } catch (err) {
        if (!active) return;
        const message = err instanceof ApiError ? err.message : "Gagal memuat donasi";
        setError(message);
        setDonations([]);
        setEvents([]);
      }
    };

    void fetchDonations();
    return () => {
      active = false;
    };
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 18) return "Selamat sore";
    return "Selamat malam";
  }, []);

  const stats = useMemo(() => {
    const list = donations ?? [];
    return {
      total: list.length,
      active: list.filter((d) => d.status === "approved" || d.status === "pending").length,
      completed: list.filter((d) => d.status === "completed").length,
      meals: list.reduce((sum, d) => sum + (d.estimated_meals || 0), 0),
    };
  }, [donations]);

  const filtered = useMemo(() => {
    if (!donations) return null;
    const q = query.trim().toLowerCase();
    return donations.filter((d) => {
      if (filterKey !== "all" && d.status !== filterKey) return false;
      if (!q) return true;
      const hay = `${d.title} ${d.description} ${d.pickup_address} ${d.receiver?.name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [donations, query, filterKey]);

  const activeReceivers = useMemo(() => {
    return (donations ?? []).filter((d) => d.receiver && (d.status === "claimed" || d.status === "completed"));
  }, [donations]);

  const firstName = user?.name?.split(" ")[0] ?? "";
  const isFirstTime = donations !== null && donations.length === 0;
  const hasFilter = filterKey !== "all" || query.length > 0;

  return (
    <div>
      {/* HERO / WELCOME */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="relative overflow-hidden rounded-3xl mb-6 border border-[var(--brand-100)]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(125deg, #0d2b1a 0%, #1f5c3e 45%, #2d7a4f 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(168,230,61,0.45) 0, transparent 50%), radial-gradient(circle at 85% 80%, rgba(94,201,137,0.35) 0, transparent 55%)",
          }}
        />
        <div className="relative z-10 grid gap-6 px-6 py-8 sm:px-10 sm:py-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
              Dashboard donatur
            </span>
            <h1 className="bagi-display mt-2 text-2xl sm:text-3xl font-semibold text-white">
              {greeting}{firstName ? `, ${firstName}` : ""}.{" "}
              {stats.active > 0 ? (
                <>
                  Ada <CountUp value={stats.active} /> donasi
                  {" "}sedang berjalan.
                </>
              ) : (
                "Yuk bagikan kelebihan pangan hari ini."
              )}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
              Setiap porsi yang Anda bagikan adalah satu langkah mengurangi food waste dan
              menjaga komunitas tetap kenyang.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href="/donatur/donations/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--lime,#a8e63d)] px-5 py-3 text-sm font-bold text-[var(--brand-950)] shadow-[0_12px_30px_rgba(168,230,61,0.35)] hover:brightness-95 transition"
              >
                <Plus className="h-4 w-4" />
                Buat donasi baru
              </Link>
              <Link
                href="/donatur/donations"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/15 transition"
              >
                <Eye className="h-4 w-4" />
                Lihat donasi saya
              </Link>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end gap-2 text-right">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/85 backdrop-blur">
              <Sparkles className="h-3 w-3" /> Dampak Anda
            </span>
            <div className="bagi-display text-5xl font-semibold text-white leading-none">
              <CountUp value={stats.meals} />
            </div>
            <div className="text-xs text-white/75">porsi diestimasi tersalur lewat Anda</div>
          </div>
        </div>
      </motion.section>

      {/* KPI CARDS */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Package className="h-5 w-5" />}
          label="Donasi diposting"
          value={stats.total}
          tone="brand"
          loading={donations === null}
        />
        <KpiCard
          icon={<Activity className="h-5 w-5" />}
          label="Sedang berjalan"
          value={stats.active}
          tone="amber"
          loading={donations === null}
          hint="Aktif & menunggu review"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Selesai"
          value={stats.completed}
          tone="emerald"
          loading={donations === null}
        />
        <KpiCard
          icon={<HandHeart className="h-5 w-5" />}
          label="Estimasi porsi"
          value={stats.meals}
          tone="lime"
          loading={donations === null}
          hint="Berdasarkan jumlah disumbangkan"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* DONATIONS MANAGEMENT */}
        <section>
          <div className="mb-4 flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="bagi-display text-xl font-semibold text-[var(--brand-950)]">
                Donasi saya
              </h2>
              <p className="text-sm text-[var(--text-mid)]">
                Kelola status, jadwal jemput, dan transparansi setiap donasi.
              </p>
            </div>
            <Link
              href="/donatur/donations/new"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-700)]"
            >
              <Plus className="h-4 w-4" />
              Donasi baru
            </Link>
          </div>

          {/* Search / filter */}
          <div className="mb-4 rounded-2xl border border-[var(--brand-100)] bg-white p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-mid)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari judul, alamat, atau penerima..."
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

          {isFirstTime && <DonorEmptyState />}

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
            <motion.div layout className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((d, i) => (
                  <DonationRow key={d.id} donation={d} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* SIDE COLUMN: ACTIVITY + RECEIVER ENGAGEMENT */}
        <aside className="space-y-6">
          <ImpactTimeline events={events} />
          <ReceiverEngagement donations={activeReceivers} loading={donations === null} />
          <TrustBadge />
        </aside>
      </div>
    </div>
  );
}

/* -------------------- COMPONENTS -------------------- */

function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: EASE });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span aria-label={String(value)}>{rounded}</motion.span>;
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  tone,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  tone: "brand" | "amber" | "emerald" | "lime";
  loading?: boolean;
}) {
  const toneClass = {
    brand: "bg-[var(--brand-50)] text-[var(--brand-700)]",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    lime: "bg-lime-50 text-lime-700",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="relative overflow-hidden rounded-2xl border border-[var(--brand-100)] bg-white p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-mid)]">
            {label}
          </div>
          <div className="bagi-display mt-2 text-3xl font-semibold text-[var(--brand-950)] leading-none">
            {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-[var(--brand-50)]" /> : <CountUp value={value} />}
          </div>
          {hint && <div className="mt-2 text-xs text-[var(--text-mid)]">{hint}</div>}
        </div>
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          {icon}
        </span>
      </div>
    </motion.div>
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

function DonationRow({ donation, index }: { donation: DonorDonation; index: number }) {
  const pickup = formatTime(donation.pickup_time);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.04, ease: EASE }}
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
          <span>{pickup}</span>
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

      {donation.receiver && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--brand-50)]/60 px-3 py-2 border border-[var(--brand-100)]">
          <div className={`h-8 w-8 shrink-0 rounded-full bg-gradient-to-br ${donation.receiver.avatar_color ?? "from-[var(--brand-400)] to-[var(--brand-600)]"} text-white text-xs font-bold flex items-center justify-center`}>
            {donation.receiver.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[var(--brand-950)] truncate">
              {donation.receiver.name}
            </div>
            <div className="text-[11px] text-[var(--text-mid)] truncate">
              {donation.receiver.pickup_eta ?? donation.receiver.org}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <Link
          href="/donatur/donations"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)]"
        >
          <Eye className="h-3.5 w-3.5" />
          Lihat daftar
        </Link>
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-mid)]/70">
          {timeAgo(donation.created_at)}
        </span>
      </div>
    </motion.article>
  );
}

function DonationListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-2xl border border-[var(--brand-100)] bg-white"
        />
      ))}
    </div>
  );
}

function DonorEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="relative overflow-hidden rounded-3xl border border-dashed border-[var(--brand-300)] bg-white p-10 text-center"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 30%, rgba(94,201,137,0.18) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(168,230,61,0.18) 0, transparent 50%)",
        }}
      />
      <div className="relative z-10">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)]">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="bagi-display text-xl font-semibold text-[var(--brand-950)]">
          Belum ada donasi
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--text-mid)]">
          Posting donasi pertama Anda dalam beberapa menit. Kami akan bantu mencocokkan dengan
          komunitas penerima terdekat.
        </p>
        <Link
          href="/donatur/donations/new"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-600)] px-5 py-3 text-sm font-bold text-white hover:bg-[var(--brand-700)]"
        >
          <Plus className="h-4 w-4" />
          Buat donasi pertama
        </Link>
      </div>
    </motion.div>
  );
}

function ImpactTimeline({ events }: { events: ImpactEvent[] | null }) {
  return (
    <section className="rounded-2xl border border-[var(--brand-100)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="bagi-display text-lg font-semibold text-[var(--brand-950)]">
            Aktivitas terkini
          </h3>
          <p className="text-xs text-[var(--text-mid)]">Jejak transparan setiap donasi</p>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-600)]">
          <TrendingUp className="h-4 w-4" />
        </span>
      </div>

      {events === null && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--brand-50)]" />
          ))}
        </div>
      )}

      {events && events.length === 0 && (
        <p className="text-sm text-[var(--text-mid)]">Belum ada aktivitas. Posting donasi pertama untuk memulai.</p>
      )}

      {events && events.length > 0 && (
        <ol className="relative space-y-4 border-l border-[var(--brand-100)] pl-5">
          {events.slice(0, 5).map((ev) => (
            <TimelineItem key={ev.id} event={ev} />
          ))}
        </ol>
      )}
    </section>
  );
}

function TimelineItem({ event }: { event: ImpactEvent }) {
  const meta = TIMELINE_META[event.type];
  return (
    <li className="relative">
      <span
        className={`absolute -left-[27px] top-0 inline-flex h-5 w-5 items-center justify-center rounded-full ${meta.bg} ${meta.fg} ring-4 ring-white`}
      >
        <meta.Icon className="h-3 w-3" />
      </span>
      <div className="text-sm font-semibold text-[var(--brand-950)] leading-tight">
        {meta.label} <span className="font-normal text-[var(--text-mid)]">— {event.donation_title}</span>
      </div>
      <div className="mt-0.5 text-xs text-[var(--text-mid)]">
        {event.actor ? `oleh ${event.actor} · ` : ""}{timeAgo(event.timestamp)}
        {event.meals ? ` · ${event.meals} porsi` : ""}
      </div>
    </li>
  );
}

const TIMELINE_META: Record<
  ImpactEvent["type"],
  { Icon: typeof Package; label: string; bg: string; fg: string }
> = {
  posted: { Icon: Plus, label: "Diposting", bg: "bg-[var(--brand-50)]", fg: "text-[var(--brand-700)]" },
  claimed: { Icon: HandHeart, label: "Diklaim", bg: "bg-sky-50", fg: "text-sky-700" },
  picked_up: { Icon: Package, label: "Dijemput", bg: "bg-amber-50", fg: "text-amber-700" },
  completed: { Icon: CheckCircle2, label: "Selesai", bg: "bg-emerald-50", fg: "text-emerald-700" },
};

function ReceiverEngagement({
  donations,
  loading,
}: {
  donations: DonorDonation[];
  loading: boolean;
}) {
  return (
    <section className="rounded-2xl border border-[var(--brand-100)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="bagi-display text-lg font-semibold text-[var(--brand-950)]">
            Komunitas penerima
          </h3>
          <p className="text-xs text-[var(--text-mid)]">Yang sedang/telah menerima donasi Anda</p>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-600)]">
          <Users className="h-4 w-4" />
        </span>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--brand-50)]" />
          ))}
        </div>
      )}

      {!loading && donations.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--brand-200)] bg-[var(--cream)] p-4 text-sm text-[var(--text-mid)]">
          Belum ada penerima. Setelah donasi Anda diklaim, mereka akan muncul di sini.
        </div>
      )}

      {!loading && donations.length > 0 && (
        <ul className="space-y-3">
          {donations.slice(0, 4).map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--brand-100)] bg-[var(--cream)] px-3 py-2.5"
            >
              <div className={`h-10 w-10 shrink-0 rounded-full bg-gradient-to-br ${d.receiver?.avatar_color ?? "from-[var(--brand-400)] to-[var(--brand-700)]"} text-white text-xs font-bold flex items-center justify-center`}>
                {d.receiver?.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--brand-950)] truncate">
                  {d.receiver?.name}
                </div>
                <div className="text-xs text-[var(--text-mid)] flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {d.receiver?.pickup_eta ?? "Menunggu konfirmasi"}
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${STATUS_TONE[d.status]}`}>
                {STATUS_LABEL[d.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TrustBadge() {
  return (
    <section className="rounded-2xl border border-[var(--brand-200)] bg-[var(--brand-50)]/60 p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--brand-700)] border border-[var(--brand-100)]">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h4 className="text-sm font-bold text-[var(--brand-950)]">Donasi yang transparan</h4>
          <p className="mt-1 text-xs text-[var(--text-mid)] leading-relaxed">
            Setiap penjemputan divalidasi dengan foto bukti dari penerima. Tanpa biaya, tanpa
            komisi, langsung ke tangan komunitas.
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------- HELPERS -------------------- */

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
