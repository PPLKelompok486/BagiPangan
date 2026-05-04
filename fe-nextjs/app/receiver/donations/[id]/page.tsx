"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  User,
  Package,
  AlarmClock,
  ShieldCheck,
  Camera,
  MessageCircle,
} from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import {
  type ApiDonation,
  type ApiClaim,
  type Donation,
  type Claim,
  formatPickupTime,
  imageForDonation,
  mapApiClaim,
  mapApiDonation,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/donations";

type Props = { params: Promise<{ id: string }> };

function pickupCountdown(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = (t - Date.now()) / (1000 * 60 * 60);
  if (diff < 0) return "Waktu jemput sudah lewat";
  if (diff < 1) return `${Math.max(1, Math.round(diff * 60))} menit lagi`;
  if (diff < 24) return `${Math.round(diff)} jam lagi`;
  return `${Math.round(diff / 24)} hari lagi`;
}

const SAFETY_TIPS = [
  {
    icon: AlarmClock,
    title: "Datang tepat waktu",
    body: "Jemput sesuai jendela waktu yang tertera. Jika terlambat, beritahu donatur secepatnya.",
  },
  {
    icon: Camera,
    title: "Foto bukti pengambilan",
    body: "Setelah menjemput, unggah foto untuk menyelesaikan donasi dan menjaga transparansi.",
  },
  {
    icon: MessageCircle,
    title: "Konfirmasi via kontak",
    body: "Hubungi donatur untuk memastikan lokasi & waktu sebelum berangkat.",
  },
];

export default function DonationDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [cancelingClaim, setCancelingClaim] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [notification, setNotification] = useState("");

  const load = async () => {
    try {
      const res = await apiFetch<{ data: ApiDonation }>(`/donations/${id}`);
      setDonation(mapApiDonation(res.data));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat donasi");
    }
  };

  const loadClaim = async () => {
    try {
      const res = await apiFetch<{ data: ApiClaim[] }>("/claims/mine");
      const donationId = Number(id);
      const found = res.data.find((item) => item.donation?.id === donationId);
      setClaim(found ? mapApiClaim(found) : null);
      setClaimError("");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setClaim(null);
        return;
      }
      setClaimError(err instanceof ApiError ? err.message : "Gagal memuat klaim");
    }
  };

  useEffect(() => {
    load();
    loadClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const countdown = useMemo(
    () => (donation ? pickupCountdown(donation.pickup_time) : ""),
    [donation],
  );

  const handleClaim = async () => {
    setClaiming(true);
    setNotification("");
    try {
      await apiFetch(`/donations/${id}/claim`, { method: "POST" });
      setNotification("Donasi berhasil diklaim, mengalihkan...");
      setTimeout(() => router.push("/receiver/my-claims"), 600);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNotification("Donasi sudah diklaim orang lain.");
        setConfirming(false);
        await load();
      } else {
        setNotification(err instanceof ApiError ? err.message : "Gagal mengklaim donasi");
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleUploadProof = async (file: File) => {
    if (!claim) return;
    setUploadingProof(true);
    setNotification("");
    const body = new FormData();
    body.append("proof", file);
    try {
      const res = await apiFetch<{ data: ApiClaim }>(`/claims/${claim.id}/proof`, {
        method: "POST",
        body,
      });
      const updated = mapApiClaim(res.data);
      setClaim(updated);
      setDonation(updated.donation);
      setNotification("Bukti pengambilan berhasil diunggah.");
    } catch (err) {
      setNotification(err instanceof ApiError ? err.message : "Gagal mengunggah bukti");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCancelClaim = async () => {
    if (!claim) return;
    setCancelingClaim(true);
    setNotification("");
    try {
      const res = await apiFetch<{ data: ApiClaim }>(`/claims/${claim.id}/cancel`, {
        method: "POST",
      });
      const updated = mapApiClaim(res.data);
      setClaim(updated);
      setDonation(updated.donation);
      setNotification("Klaim berhasil dibatalkan.");
    } catch (err) {
      setNotification(err instanceof ApiError ? err.message : "Gagal membatalkan klaim");
    } finally {
      setCancelingClaim(false);
    }
  };

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-3xl p-8 text-center">
        <p className="text-red-700 font-semibold">{error}</p>
        <Link
          href="/receiver/dashboard"
          className="inline-flex items-center gap-2 mt-4 text-[var(--brand-600)] font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar donasi
        </Link>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="bg-white border border-[var(--brand-100)] rounded-3xl p-8 animate-pulse h-72" />
    );
  }

  const canClaim = donation.status === "approved";
  const hasClaim = Boolean(claim);
  const showClaimActions = hasClaim && donation.status === "claimed";
  const showClaimCompleted = hasClaim && donation.status === "completed";
  const showUnavailable = !canClaim && !showClaimActions && !showClaimCompleted;
  const isSuccess = notification.includes("berhasil");
  const heroImage = imageForDonation(donation);
  const hoursLeft = (Date.parse(donation.pickup_time) - Date.now()) / 3_600_000;
  const isUrgent = hoursLeft >= 0 && hoursLeft < 2;

  return (
    <div className="max-w-3xl mx-auto pb-28 sm:pb-8">
      <Link
        href="/receiver/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)] mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white border border-[var(--brand-100)] rounded-3xl overflow-hidden shadow-[var(--shadow-soft)]"
      >
        <div className="relative h-56 sm:h-72 overflow-hidden bg-[var(--brand-50)]">
          <motion.img
            src={heroImage}
            alt={donation.title}
            className="h-full w-full object-cover"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent"
          />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-semibold text-[var(--brand-700)] shadow-sm">
              <Package className="h-3 w-3" /> {donation.quantity}
            </span>
            {isUrgent && canClaim && (
              <motion.span
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-500 text-white px-3 py-1 text-xs font-semibold shadow-md"
              >
                <AlarmClock className="h-3 w-3" />
                Mendesak
              </motion.span>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <span className="text-xs tracking-[0.24em] text-[var(--brand-600)] font-semibold uppercase">
              Donasi
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--brand-950)] mt-1">
              {donation.title}
            </h1>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS_TONE[donation.status]}`}
          >
            {STATUS_LABEL[donation.status]}
          </span>
        </div>

        {canClaim && countdown && (
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-50)] border border-[var(--brand-200)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-700)]">
            <AlarmClock className="h-3.5 w-3.5" />
            Jendela jemput: {countdown}
          </div>
        )}

        <p className="text-[var(--text-mid)] leading-relaxed mb-6">
          {donation.description}
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <InfoRow icon={<Package className="h-4 w-4" />} label="Jumlah" value={donation.quantity} />
          <InfoRow icon={<Clock className="h-4 w-4" />} label="Waktu jemput" value={formatPickupTime(donation.pickup_time)} />
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Alamat" value={donation.pickup_address} />
          <InfoRow icon={<User className="h-4 w-4" />} label="Donatur" value={donation.donor?.name ?? "—"} />
          {donation.donor?.phone && (
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Kontak donatur" value={donation.donor.phone} />
          )}
        </div>

        <details className="mb-5 rounded-2xl border border-[var(--brand-100)] bg-[var(--cream)] overflow-hidden">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-[var(--brand-950)] select-none">
            <ShieldCheck className="h-4 w-4 text-[var(--brand-600)]" />
            Tips aman menjemput donasi
          </summary>
          <div className="px-4 pb-4 space-y-3">
            {SAFETY_TIPS.map((tip) => {
              const Icon = tip.icon;
              return (
                <div key={tip.title} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-600)] border border-[var(--brand-100)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--brand-950)]">{tip.title}</div>
                    <div className="text-xs text-[var(--text-mid)] leading-relaxed">{tip.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </details>

        <AnimatePresence>
          {notification && (
            <motion.div
              key={notification}
              role={isSuccess ? "status" : "alert"}
              aria-live={isSuccess ? "polite" : "assertive"}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className={`mb-4 p-3 rounded-2xl text-sm font-medium ${
                isSuccess
                  ? "bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        {claimError && (
          <div className="mb-4 p-3 rounded-2xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
            {claimError}
          </div>
        )}

        {/* Desktop / non-sticky CTA */}
        <div className="hidden sm:block">
          {showClaimActions && claim && (
            <ClaimActions
              claim={claim}
              uploading={uploadingProof}
              canceling={cancelingClaim}
              onUploadProof={handleUploadProof}
              onCancelClaim={handleCancelClaim}
            />
          )}

          {showClaimCompleted && claim && (
            <ClaimCompleted claim={claim} />
          )}

          {canClaim && !confirming && (
            <button
              onClick={() => setConfirming(true)}
              className="w-full bg-[var(--brand-600)] text-white py-3.5 rounded-xl font-bold hover:bg-[var(--brand-700)] transition-colors shadow-[0_12px_30px_rgba(45,122,79,0.2)]"
            >
              Klaim donasi ini
            </button>
          )}

          {canClaim && confirming && (
            <ConfirmBlock
              onConfirm={handleClaim}
              onCancel={() => setConfirming(false)}
              claiming={claiming}
            />
          )}

          {showUnavailable && (
            <div className="border border-[var(--brand-100)] bg-[var(--cream)] rounded-2xl p-4 text-sm text-[var(--text-mid)]">
              Donasi ini sudah tidak tersedia untuk diklaim.
            </div>
          )}
        </div>
        </div>
      </motion.article>

      {/* Mobile sticky CTA */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-[var(--brand-100)] p-3 shadow-[0_-8px_24px_rgba(7,23,16,0.08)]">
        {showClaimActions && claim && (
          <ClaimActions
            claim={claim}
            uploading={uploadingProof}
            canceling={cancelingClaim}
            onUploadProof={handleUploadProof}
            onCancelClaim={handleCancelClaim}
            compact
          />
        )}
        {showClaimCompleted && claim && <ClaimCompleted claim={claim} compact />}
        {canClaim && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="w-full bg-[var(--brand-600)] text-white py-3.5 rounded-xl font-bold shadow-[0_12px_30px_rgba(45,122,79,0.2)]"
          >
            Klaim donasi ini
          </button>
        )}
        {canClaim && confirming && (
          <ConfirmBlock
            onConfirm={handleClaim}
            onCancel={() => setConfirming(false)}
            claiming={claiming}
          />
        )}
        {showUnavailable && (
          <div className="rounded-xl bg-[var(--cream)] px-4 py-3 text-center text-sm text-[var(--text-mid)]">
            Donasi ini sudah tidak tersedia.
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmBlock({
  onConfirm,
  onCancel,
  claiming,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  claiming: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[var(--brand-200)] bg-[var(--brand-50)] rounded-2xl p-4"
    >
      <p className="text-sm font-semibold text-[var(--brand-950)] mb-3">
        Yakin ingin mengklaim donasi ini? Pastikan Anda dapat menjemput sesuai waktu yang ditentukan.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={claiming}
          className="flex-1 bg-[var(--brand-600)] text-white py-2.5 rounded-xl font-bold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {claiming && (
            <motion.span
              aria-hidden="true"
              className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
            />
          )}
          {claiming ? "Memproses..." : "Ya, klaim sekarang"}
        </button>
        <button
          onClick={onCancel}
          disabled={claiming}
          className="flex-1 bg-white border border-[var(--brand-200)] text-[var(--brand-700)] py-2.5 rounded-xl font-bold"
        >
          Batal
        </button>
      </div>
    </motion.div>
  );
}

function ClaimActions({
  claim,
  uploading,
  canceling,
  onUploadProof,
  onCancelClaim,
  compact,
}: {
  claim: Claim;
  uploading: boolean;
  canceling: boolean;
  onUploadProof: (file: File) => void;
  onCancelClaim: () => void;
  compact?: boolean;
}) {
  const inputId = `proof-${claim.id}-detail`;
  return (
    <div
      className={`rounded-2xl border border-[var(--brand-100)] bg-[var(--cream)] ${
        compact ? "px-4 py-3" : "p-4"
      }`}
    >
      <div className="text-sm font-semibold text-[var(--brand-950)]">Klaim Anda aktif</div>
      <p className="text-xs text-[var(--text-mid)] mt-1">
        Unggah bukti setelah pengambilan dan batalkan jika tidak jadi menjemput.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading || canceling}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUploadProof(file);
            event.target.value = "";
          }}
        />
        <label
          htmlFor={inputId}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            uploading || canceling
              ? "bg-[var(--brand-50)] text-[var(--brand-400)] border-[var(--brand-100)]"
              : "bg-white text-[var(--brand-700)] border-[var(--brand-200)] hover:border-[var(--brand-400)]"
          }`}
        >
          {uploading ? "Mengunggah..." : "Unggah bukti"}
        </label>
        <button
          type="button"
          onClick={onCancelClaim}
          disabled={uploading || canceling}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            uploading || canceling
              ? "bg-white text-[var(--brand-400)] border-[var(--brand-100)]"
              : "bg-white text-red-600 border-red-200 hover:border-red-300"
          }`}
        >
          {canceling ? "Membatalkan..." : "Batalkan klaim"}
        </button>
        <span className="text-[11px] text-[var(--text-mid)]">JPEG/PNG, maks 4MB</span>
      </div>
    </div>
  );
}

function ClaimCompleted({ claim, compact }: { claim: Claim; compact?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-emerald-200 bg-emerald-50 ${
        compact ? "px-4 py-3" : "p-4"
      }`}
    >
      <div className="text-sm font-semibold text-emerald-700">Bukti sudah diunggah</div>
      <div className="text-xs text-emerald-700 mt-1">
        Terima kasih, donasi sudah selesai.
      </div>
      {claim.proof_image_url && (
        <div className="mt-2 text-xs text-emerald-700">
          Bukti: {" "}
          <a
            href={claim.proof_image_url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            Lihat foto
          </a>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-[var(--brand-100)] rounded-2xl p-3 flex items-start gap-3">
      <div className="h-8 w-8 rounded-xl bg-[var(--brand-50)] text-[var(--brand-600)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs text-[var(--text-mid)] uppercase tracking-wider">{label}</div>
        <div className="text-sm font-semibold text-[var(--brand-950)]">{value}</div>
      </div>
    </div>
  );
}
