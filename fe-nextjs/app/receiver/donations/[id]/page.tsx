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
  type Donation,
  formatPickupTime,
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
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [notification, setNotification] = useState("");

  const load = async () => {
    try {
      const res = await apiFetch<{ data: Donation }>(`/donations/${id}`);
      setDonation(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat donasi");
    }
  };

  useEffect(() => {
    load();
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

  const canClaim = donation.status === "available";
  const isSuccess = notification.includes("berhasil");

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
        className="bg-white border border-[var(--brand-100)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-soft)]"
      >
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

        {/* Desktop / non-sticky CTA */}
        <div className="hidden sm:block">
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

          {!canClaim && (
            <div className="border border-[var(--brand-100)] bg-[var(--cream)] rounded-2xl p-4 text-sm text-[var(--text-mid)]">
              Donasi ini sudah tidak tersedia untuk diklaim.
            </div>
          )}
        </div>
      </motion.article>

      {/* Mobile sticky CTA */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-[var(--brand-100)] p-3 shadow-[0_-8px_24px_rgba(7,23,16,0.08)]">
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
        {!canClaim && (
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
