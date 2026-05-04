"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, ListChecks, ArrowRight, AlarmClock, CheckCircle2 } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import {
  type ApiClaim,
  type Claim,
  type Donation,
  formatPickupTime,
  imageForDonation,
  mapApiClaim,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/donations";

function hoursUntil(iso: string): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (t - Date.now()) / (1000 * 60 * 60);
}

function pickupCountdown(iso: string): string {
  const h = hoursUntil(iso);
  if (h === null) return "";
  if (h < 0) return "Waktu jemput sudah lewat";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} menit lagi`;
  if (h < 24) return `${Math.round(h)} jam lagi`;
  const d = Math.round(h / 24);
  return `${d} hari lagi`;
}

const STEPS: { key: Donation["status"]; label: string }[] = [
  { key: "claimed", label: "Diklaim" },
  { key: "completed", label: "Selesai" },
];

export default function MyClaimsPage() {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadNotice, setUploadNotice] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const loadClaims = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: ApiClaim[] }>("/claims/mine");
      setClaims(res.data.map(mapApiClaim));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat klaim");
      setClaims([]);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const handleUploadProof = useCallback(
    async (claimId: number, file: File) => {
      setUploadError("");
      setUploadNotice("");
      setUploadingId(claimId);
      const body = new FormData();
      body.append("proof", file);
      try {
        const res = await apiFetch<{ data: ApiClaim }>(`/claims/${claimId}/proof`, {
          method: "POST",
          body,
        });
        setClaims((prev) =>
          prev ? prev.map((c) => (c.id === claimId ? mapApiClaim(res.data) : c)) : prev,
        );
        setUploadNotice("Bukti berhasil diunggah.");
      } catch (err) {
        setUploadError(err instanceof ApiError ? err.message : "Gagal mengunggah bukti");
      } finally {
        setUploadingId(null);
      }
    },
    [],
  );

  const { active, past, next } = useMemo(() => {
    if (!claims) return { active: [], past: [], next: null as Claim | null };
    const active = claims.filter((c) => c.donation.status === "claimed");
    const past = claims.filter((c) => c.donation.status !== "claimed");
    const upcoming = [...active]
      .filter((c) => {
        const h = hoursUntil(c.donation.pickup_time);
        return h !== null && h >= -1;
      })
      .sort((a, b) => Date.parse(a.donation.pickup_time) - Date.parse(b.donation.pickup_time));
    return { active, past, next: upcoming[0] ?? null };
  }, [claims]);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <span className="text-xs tracking-[0.24em] text-[var(--brand-600)] font-semibold uppercase">
          Riwayat
        </span>
        <h1 className="text-3xl font-bold mt-2 text-[var(--brand-950)]">Klaim saya</h1>
        <p className="text-[var(--text-mid)] mt-2">
          Donasi yang Anda klaim dan jadwal penjemputannya.
        </p>
      </motion.div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 p-3 rounded-2xl text-sm font-medium bg-red-50 text-red-700 border border-red-200"
        >
          {error}
        </div>
      )}

      {uploadNotice && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 p-3 rounded-2xl text-sm font-medium bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]"
        >
          {uploadNotice}
        </div>
      )}

      {uploadError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 p-3 rounded-2xl text-sm font-medium bg-red-50 text-red-700 border border-red-200"
        >
          {uploadError}
        </div>
      )}

      {claims === null && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[var(--brand-100)] rounded-3xl p-5 animate-pulse h-44"
            />
          ))}
        </div>
      )}

      {next && (
        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 overflow-hidden rounded-3xl border border-[var(--brand-200)] bg-[var(--brand-50)] p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-700)]">
                <AlarmClock className="h-3.5 w-3.5" />
                Jemput berikutnya
              </div>
              <h2 className="mt-2 text-xl font-bold text-[var(--brand-950)]">{next.donation.title}</h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--brand-950)]">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[var(--brand-600)]" />
                  {formatPickupTime(next.donation.pickup_time)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[var(--brand-600)]" />
                  {next.donation.pickup_address}
                </span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-700)] border border-[var(--brand-200)]">
                {pickupCountdown(next.donation.pickup_time)}
              </div>
            </div>
            <Link
              href={`/receiver/donations/${next.donation.id}`}
              className="inline-flex items-center gap-2 bg-[var(--brand-600)] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[var(--brand-700)]"
            >
              Lihat detail
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.aside>
      )}

      {claims && claims.length === 0 && !error && (
        <div className="bg-white border border-[var(--brand-100)] rounded-3xl p-12 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)] mb-4">
            <ListChecks className="h-6 w-6" />
          </div>
          <h2 className="font-bold text-lg text-[var(--brand-950)]">
            Belum ada klaim
          </h2>
          <p className="text-[var(--text-mid)] mt-1 text-sm mb-4">
            Mulai dengan memilih donasi yang tersedia.
          </p>
          <Link
            href="/receiver/dashboard"
            className="inline-flex items-center gap-2 bg-[var(--brand-600)] text-white px-4 py-2.5 rounded-xl font-semibold text-sm"
          >
            Lihat donasi tersedia
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-bold text-[var(--brand-950)] mb-3">
            Aktif ({active.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((claim, i) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                index={i}
                active
                uploading={uploadingId === claim.id}
                onUploadProof={handleUploadProof}
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-[var(--brand-950)] mb-3">
            Riwayat ({past.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {past.map((claim, i) => (
              <ClaimCard key={claim.id} claim={claim} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ClaimCard({
  claim,
  index,
  active,
  onUploadProof,
  uploading,
}: {
  claim: Claim;
  index: number;
  active?: boolean;
  onUploadProof?: (claimId: number, file: File) => void;
  uploading?: boolean;
}) {
  const d = claim.donation;
  const inputId = `proof-${claim.id}`;
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="group bg-white border border-[var(--brand-100)] rounded-3xl p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] hover:border-[var(--brand-300)] transition-all"
    >
      <div className="flex items-start gap-4 mb-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[var(--brand-50)]">
          <motion.img
            src={imageForDonation(d)}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[var(--brand-950)] leading-tight line-clamp-1">{d.title}</h3>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${STATUS_TONE[d.status]}`}
            >
              {STATUS_LABEL[d.status]}
            </span>
          </div>
        </div>
      </div>
      <div className="text-xs text-[var(--text-mid)] mb-3">
        Dari{" "}
        <span className="font-semibold text-[var(--brand-950)]">
          {d.donor?.name ?? "Donatur"}
        </span>
        {d.donor?.phone ? ` · ${d.donor.phone}` : ""}
      </div>
      <div className="space-y-1.5 text-sm text-[var(--brand-950)] mb-4">
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-[var(--brand-600)] mt-0.5 shrink-0" />
          <span>
            {formatPickupTime(d.pickup_time)}
            {active && (
              <span className="ml-2 text-xs font-semibold text-[var(--brand-700)]">
                · {pickupCountdown(d.pickup_time)}
              </span>
            )}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-[var(--brand-600)] mt-0.5 shrink-0" />
          <span>{d.pickup_address}</span>
        </div>
      </div>

      {active && <ClaimProgress status={d.status} />}

      {active && onUploadProof && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUploadProof(claim.id, file);
              event.target.value = "";
            }}
          />
          <label
            htmlFor={inputId}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              uploading
                ? "bg-[var(--brand-50)] text-[var(--brand-400)] border-[var(--brand-100)]"
                : "bg-white text-[var(--brand-700)] border-[var(--brand-200)] hover:border-[var(--brand-400)]"
            }`}
          >
            {uploading ? "Mengunggah..." : "Unggah bukti"}
          </label>
          <span className="text-[11px] text-[var(--text-mid)]">JPEG/PNG, maks 4MB</span>
        </div>
      )}

      {!active && claim.proof_image_url && (
        <div className="mt-3 text-xs text-[var(--text-mid)]">
          Bukti: {" "}
          <a
            href={claim.proof_image_url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)]"
          >
            Lihat foto
          </a>
        </div>
      )}

      <Link
        href={`/receiver/donations/${d.id}`}
        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)]"
      >
        Lihat detail
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.article>
  );
}

function ClaimProgress({ status }: { status: Donation["status"] }) {
  const currentIdx = status === "completed" ? 1 : 0;
  return (
    <div aria-label="Progress klaim" className="mb-2">
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => {
          const done = i <= currentIdx;
          return (
            <div key={s.key} className="flex items-center gap-1.5 flex-1">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-[var(--brand-600)] text-white"
                    : "bg-[var(--brand-50)] text-[var(--brand-400)] border border-[var(--brand-100)]"
                }`}
              >
                {done && i < currentIdx ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  done ? "text-[var(--brand-700)]" : "text-[var(--text-mid)]"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={`h-px flex-1 ${
                    i < currentIdx ? "bg-[var(--brand-400)]" : "bg-[var(--brand-100)]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
