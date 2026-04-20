"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, Package, ArrowRight, Flame, Search } from "lucide-react";
import { ApiError, apiFetch, getUser, type AuthUser } from "@/lib/api";
import { type Donation, formatPickupTime } from "@/lib/donations";

const URGENT_WINDOW_HOURS = 6;

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
  const [donations, setDonations] = useState<Donation[] | null>(null);
  const [error, setError] = useState<string>("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{ data: Donation[] }>("/donations");
        if (!cancelled) setDonations(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Gagal memuat donasi");
          setDonations([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (!donations) return { total: 0, endingToday: 0, urgent: 0 };
    const now = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
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
  }, [donations]);

  const filtered = useMemo(() => {
    if (!donations) return null;
    const q = query.trim().toLowerCase();
    if (!q) return donations;
    return donations.filter((d) =>
      [d.title, d.description, d.pickup_address, d.donor?.name ?? "", d.donor?.city ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [donations, query]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl mb-8 border border-[var(--brand-100)]"
      >
        <img
          src="/images/receiver-dashboard-banner.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-90"
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
            {greeting}{firstName ? `, ${firstName}` : ""} — {stats.total > 0 ? `${stats.total} donasi menunggu Anda` : "belum ada donasi, tetap pantau"}
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
              />
            )}
          </div>
        </div>
      </motion.section>

      {donations && donations.length > 0 && (
        <div className="mb-5 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-mid)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari berdasarkan nama, alamat, donatur..."
              aria-label="Cari donasi"
              className="w-full rounded-xl border border-[var(--brand-100)] bg-white py-2.5 pl-9 pr-3 text-sm text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/60 focus:border-[var(--brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
            />
          </div>
          {filtered && query && (
            <span className="text-xs text-[var(--text-mid)]">
              {filtered.length} dari {donations.length}
            </span>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 p-3 rounded-2xl text-sm font-medium bg-red-50 text-red-700 border border-red-200"
        >
          {error}
        </div>
      )}

      {donations === null && <SkeletonGrid />}

      {donations && donations.length === 0 && !error && (
        <EmptyState
          title="Belum ada donasi tersedia"
          body="Donatur baru bergabung setiap hari. Aktifkan notifikasi atau periksa kembali dalam beberapa jam."
        />
      )}

      {donations && donations.length > 0 && filtered && filtered.length === 0 && (
        <EmptyState
          title="Tidak ada hasil untuk pencarian ini"
          body={`Coba kata kunci lain atau hapus filter.`}
          action={
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex items-center gap-2 bg-[var(--brand-600)] text-white px-4 py-2.5 rounded-xl font-semibold text-sm"
            >
              Reset pencarian
            </button>
          }
        />
      )}

      {filtered && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d, i) => {
            const urg = urgencyLabel(d.pickup_time);
            return (
              <motion.article
                key={d.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3 }}
                className="bg-white border border-[var(--brand-100)] rounded-3xl p-5 flex flex-col shadow-[var(--shadow-soft)] hover:border-[var(--brand-300)] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-[var(--brand-950)] leading-tight">
                    {d.title}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] whitespace-nowrap">
                    {d.quantity}
                  </span>
                </div>

                {urg.tone && (
                  <div
                    className={`mb-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      urg.tone === "hot"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <Flame className="h-3 w-3" />
                    {urg.label}
                  </div>
                )}

                <p className="text-sm text-[var(--text-mid)] line-clamp-2 mb-4">
                  {d.description}
                </p>
                <div className="space-y-2 text-sm text-[var(--brand-950)] mb-4">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-[var(--brand-600)] mt-0.5 shrink-0" />
                    <span>{formatPickupTime(d.pickup_time)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-[var(--brand-600)] mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{d.pickup_address}</span>
                  </div>
                </div>
                <div className="text-xs text-[var(--text-mid)] mb-4">
                  Dari{" "}
                  <span className="font-semibold text-[var(--brand-950)]">
                    {d.donor?.name ?? "Donatur"}
                  </span>
                  {d.donor?.city ? ` · ${d.donor.city}` : ""}
                </div>
                <Link
                  href={`/receiver/donations/${d.id}`}
                  className="mt-auto inline-flex items-center justify-center gap-2 bg-[var(--brand-600)] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[var(--brand-700)] transition-colors"
                >
                  Lihat detail
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatChip({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: "default" | "warm" | "hot";
  icon?: React.ReactNode;
}) {
  const toneClass =
    tone === "hot"
      ? "bg-white/95 text-red-700"
      : tone === "warm"
        ? "bg-white/95 text-amber-700"
        : "bg-white/15 text-white border border-white/20 backdrop-blur";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}
    >
      {icon}
      {label}
    </span>
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
    <div className="bg-white border border-[var(--brand-100)] rounded-3xl p-12 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)] mb-4">
        <Package className="h-6 w-6" />
      </div>
      <h2 className="font-bold text-lg text-[var(--brand-950)]">{title}</h2>
      <p className="text-[var(--text-mid)] mt-1 text-sm">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-[var(--brand-100)] rounded-3xl p-5 animate-pulse h-56"
        >
          <div className="h-4 w-2/3 bg-[var(--brand-50)] rounded mb-3" />
          <div className="h-3 w-full bg-[var(--brand-50)] rounded mb-2" />
          <div className="h-3 w-5/6 bg-[var(--brand-50)] rounded mb-6" />
          <div className="h-3 w-1/2 bg-[var(--brand-50)] rounded mb-2" />
          <div className="h-3 w-2/3 bg-[var(--brand-50)] rounded mb-6" />
          <div className="h-9 w-full bg-[var(--brand-50)] rounded-xl" />
        </div>
      ))}
    </div>
  );
}
