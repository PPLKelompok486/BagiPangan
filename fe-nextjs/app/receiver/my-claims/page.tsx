"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  ListChecks,
  ArrowRight,
  AlarmClock,
  CheckCircle2,
  Camera,
  Upload,
  Loader2,
  X,
  ImageIcon,
} from "lucide-react";
import { ApiError, apiFetch, getToken } from "@/lib/api";
import {
  type Donation,
  type DonationProof,
  formatPickupTime,
  imageForDonation,
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
  { key: "available", label: "Terbuka" },
  { key: "claimed", label: "Diklaim" },
  { key: "completed", label: "Selesai" },
];

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

async function uploadProof(
  donationId: number,
  file: File,
): Promise<{ proof: DonationProof; donation: Donation }> {
  const token = getToken();
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`/api/proxy/donations/${donationId}/proof`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : `Upload gagal (${res.status})`;
    throw new ApiError(res.status, message, data);
  }

  return (data as { data: { proof: DonationProof; donation: Donation } }).data;
}

export default function MyClaimsPage() {
  const [donations, setDonations] = useState<Donation[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{ data: Donation[] }>("/donations/mine");
        if (!cancelled) setDonations(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Gagal memuat klaim");
          setDonations([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDonationUpdated = (updated: Donation) => {
    setDonations((prev) =>
      prev ? prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)) : prev,
    );
  };

  const { active, past, next } = useMemo(() => {
    if (!donations) return { active: [], past: [], next: null as Donation | null };
    const active = donations.filter((d) => d.status === "claimed");
    const past = donations.filter((d) => d.status !== "claimed");
    const upcoming = [...active]
      .filter((d) => {
        const h = hoursUntil(d.pickup_time);
        return h !== null && h >= -1;
      })
      .sort((a, b) => Date.parse(a.pickup_time) - Date.parse(b.pickup_time));
    return { active, past, next: upcoming[0] ?? null };
  }, [donations]);

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

      {donations === null && (
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
              <h2 className="mt-2 text-xl font-bold text-[var(--brand-950)]">{next.title}</h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--brand-950)]">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[var(--brand-600)]" />
                  {formatPickupTime(next.pickup_time)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[var(--brand-600)]" />
                  {next.pickup_address}
                </span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-700)] border border-[var(--brand-200)]">
                {pickupCountdown(next.pickup_time)}
              </div>
            </div>
            <Link
              href={`/receiver/donations/${next.id}`}
              className="inline-flex items-center gap-2 bg-[var(--brand-600)] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[var(--brand-700)]"
            >
              Lihat detail
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.aside>
      )}

      {donations && donations.length === 0 && !error && (
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
            {active.map((d, i) => (
              <ClaimCard
                key={d.id}
                donation={d}
                index={i}
                active
                onUpdated={handleDonationUpdated}
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
            {past.map((d, i) => (
              <ClaimCard key={d.id} donation={d} index={i} onUpdated={handleDonationUpdated} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ClaimCard({
  donation: d,
  index,
  active,
  onUpdated,
}: {
  donation: Donation;
  index: number;
  active?: boolean;
  onUpdated: (donation: Donation) => void;
}) {
  const showUpload = d.status === "claimed" && !d.proof;
  const showProof = d.status === "completed" && d.proof;

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

      {(active || d.status === "completed") && (
        <ClaimProgress status={d.status} />
      )}

      <AnimatePresence mode="wait">
        {showUpload && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProofUploader donation={d} onUpdated={onUpdated} />
          </motion.div>
        )}

        {showProof && d.proof && (
          <motion.div
            key="proof"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3"
          >
            <div className="flex items-start gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-emerald-200 bg-white">
                <img
                  src={d.proof.image_url}
                  alt="Bukti pengambilan"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Bukti pengambilan terkirim
                </div>
                <p className="mt-1 text-xs text-emerald-700/80">
                  Donasi telah selesai. Terima kasih sudah mengonfirmasi.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

function ProofUploader({
  donation,
  onUpdated,
}: {
  donation: Donation;
  onUpdated: (donation: Donation) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (selected: File | null) => {
    setError("");
    setSuccess("");
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFile(null);
      setError("Hanya format JPG, PNG, atau WebP yang didukung");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFile(null);
      setError("Ukuran file maksimal 5MB");
      return;
    }
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadProof(donation.id, file);
      const merged: Donation = {
        ...donation,
        ...result.donation,
        status: "completed",
        proof: result.proof,
      };
      setSuccess("Bukti berhasil diunggah! Donasi selesai.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onUpdated(merged);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengunggah bukti");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]/40 p-4">
      <div className="flex items-start gap-2 mb-3">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[var(--brand-600)] border border-[var(--brand-100)]">
          <Camera className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[var(--brand-950)]">
            Konfirmasi Pengambilan
          </h4>
          <p className="text-xs text-[var(--text-mid)] mt-0.5">
            Unggah foto bukti bahwa Anda sudah mengambil donasi ini.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      {previewUrl ? (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--brand-100)] bg-white p-2">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--brand-50)]">
            <img
              src={previewUrl}
              alt="Pratinjau bukti"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-950)]">
              <ImageIcon className="h-3.5 w-3.5 text-[var(--brand-600)]" />
              <span className="truncate">{file?.name}</span>
            </div>
            <p className="text-[11px] text-[var(--text-mid)] mt-0.5">
              {file ? `${(file.size / 1024).toFixed(0)} KB` : ""}
            </p>
            <button
              type="button"
              onClick={clearFile}
              disabled={uploading}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-mid)] hover:text-[var(--brand-700)] disabled:opacity-50"
            >
              <X className="h-3 w-3" />
              Ganti foto
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--brand-300)] bg-white px-4 py-3 text-sm font-semibold text-[var(--brand-700)] hover:bg-[var(--brand-50)] hover:border-[var(--brand-400)] transition-all disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          Pilih foto bukti
        </button>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!file || uploading}
        className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mengunggah...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Unggah Bukti
          </>
        )}
      </button>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-3 rounded-xl bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-xs font-medium"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          aria-live="polite"
          className="mt-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 text-xs font-medium"
        >
          {success}
        </div>
      )}
    </div>
  );
}

function ClaimProgress({ status }: { status: Donation["status"] }) {
  const currentIdx = status === "completed" ? 2 : status === "claimed" ? 1 : 0;
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
