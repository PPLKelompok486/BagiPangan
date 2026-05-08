"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Info,
  MapPin,
  Package,
  Phone,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { easeOut } from "@/app/bagipangan/lib/motion";

type Props = { params: Promise<{ id: string }> };

type DonationDetail = {
  id_donation: number;
  id: number;
  title: string;
  description: string;
  category: string | null;
  category_id: number | null;
  portion: number;
  remaining_portion: number;
  location: string;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  expired_at: string | null;
  available_from: string | null;
  status: "pending" | "approved" | "rejected" | "claimed" | "completed" | "cancelled";
  photo_url: string | null;
  created_at: string;
  donor: {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    organization: string | null;
  } | null;
};

const STATUS_LABEL: Record<DonationDetail["status"], string> = {
  pending: "Menunggu review",
  approved: "Aktif",
  rejected: "Ditolak",
  claimed: "Diklaim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_TONE: Record<DonationDetail["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)]",
  rejected: "bg-red-50 text-red-700 border-red-200",
  claimed: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatCoordinates(latitude: number | null, longitude: number | null): string {
  if (latitude == null || longitude == null) return "Koordinat belum diisi";
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export default function DonationDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [donation, setDonation] = useState<DonationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ data: DonationDetail }>(`/donations/${id}`);
      setDonation(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Gagal memuat detail donasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !donation) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link
          href="/donatur/donations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar
        </Link>
        <div className="rounded-3xl border border-red-200 bg-white p-8 text-center">
          <p className="font-semibold text-red-700">{error || "Donasi tidak ditemukan"}</p>
          <button
            onClick={load}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-700)]"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const hasLocation = Boolean(donation.location_address || donation.location);
  const address = donation.location_address ?? donation.location;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <Link
        href="/donatur/donations"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)] mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar donasi
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easeOut }}
        className="overflow-hidden rounded-3xl border border-[var(--brand-100)] bg-white shadow-[var(--shadow-card)]"
      >
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f2c1a_0%,#1f5c3e_48%,#2d7a4f_100%)] px-6 py-8 text-white sm:px-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 18% 20%, rgba(168,230,61,0.34) 0, transparent 36%), radial-gradient(circle at 82% 76%, rgba(255,255,255,0.16) 0, transparent 42%)",
            }}
          />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {donation.category && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                    <Tag className="h-3 w-3" /> {donation.category}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_TONE[donation.status]}`}
                >
                  {STATUS_LABEL[donation.status]}
                </span>
              </div>
              <h1 className="bagi-display text-3xl font-semibold leading-tight sm:text-4xl">
                {donation.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                Detail lengkap donasi yang Anda posting, termasuk lokasi, jadwal, jumlah porsi,
                dan status aktifnya.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/65">
                Porsi tersisa
              </div>
              <div className="mt-1 flex items-end gap-2 text-white">
                <span className="text-3xl font-semibold">{donation.remaining_portion}</span>
                <span className="pb-1 text-sm text-white/75">/ {donation.portion}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={<Package className="h-4 w-4" />} label="Jumlah porsi" value={`${donation.portion} porsi`} />
            <InfoCard icon={<Package className="h-4 w-4" />} label="Sisa porsi" value={`${donation.remaining_portion} porsi`} />
            <InfoCard icon={<CalendarClock className="h-4 w-4" />} label="Tersedia sampai" value={formatDate(donation.expired_at)} />
            <InfoCard icon={<Clock className="h-4 w-4" />} label="Dibuat" value={formatDate(donation.created_at)} />
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-700)]">
                Deskripsi
              </h2>
              <div className="rounded-2xl border border-[var(--brand-100)] bg-[var(--cream)] p-5 text-sm leading-7 text-[var(--brand-950)] whitespace-pre-line">
                {donation.description}
              </div>

              <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-700)]">
                Lokasi
              </h2>
              <div className="space-y-3 rounded-2xl border border-[var(--brand-100)] bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-mid)]">Alamat</div>
                    <div className="mt-1 text-sm font-medium text-[var(--brand-950)]">
                      {hasLocation ? address : "Lokasi belum diisi"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]">
                    <Info className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-mid)]">Koordinat</div>
                    <div className="mt-1 text-sm font-medium text-[var(--brand-950)]">
                      {formatCoordinates(donation.latitude, donation.longitude)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-[var(--brand-100)] bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-700)]">
                  Donatur
                </h2>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-700)]">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-base font-semibold text-[var(--brand-950)]">
                      {donation.donor?.name ?? "—"}
                    </div>
                    {donation.donor?.organization && (
                      <div className="text-sm text-[var(--text-mid)]">{donation.donor.organization}</div>
                    )}
                    {donation.donor?.phone && (
                      <div className="flex items-center gap-2 text-sm text-[var(--brand-950)]">
                        <Phone className="h-4 w-4 text-[var(--brand-600)]" />
                        <a href={`tel:${donation.donor.phone}`} className="hover:text-[var(--brand-700)] hover:underline">
                          {donation.donor.phone}
                        </a>
                      </div>
                    )}
                    {donation.donor?.address && (
                      <div className="text-sm text-[var(--text-mid)]">{donation.donor.address}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)] p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-[var(--brand-700)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--brand-950)]">Aksi cepat</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-mid)]">
                      Lanjutkan pengelolaan donasi ini dari daftar donasi atau buka peta untuk
                      melihat persebarannya.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href="/donatur/donations"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-700)]"
                  >
                    Kembali ke daftar
                  </Link>
                  <Link
                    href="/donatur/map"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--brand-100)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-700)] hover:border-[var(--brand-300)] hover:bg-[var(--brand-50)]"
                  >
                    Lihat peta donasi
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--brand-100)] bg-white p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-mid)]">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-700)]">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-sm font-semibold text-[var(--brand-950)]">{value}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6 h-5 w-40 animate-pulse rounded-full bg-[var(--brand-100)]" />
      <div className="overflow-hidden rounded-3xl border border-[var(--brand-100)] bg-white shadow-[var(--shadow-card)]">
        <div className="h-48 animate-pulse bg-[linear-gradient(135deg,#0f2c1a_0%,#1f5c3e_48%,#2d7a4f_100%)]" />
        <div className="space-y-4 p-6 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-[var(--brand-50)]" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <div className="h-8 w-40 animate-pulse rounded-full bg-[var(--brand-50)]" />
              <div className="h-40 animate-pulse rounded-2xl bg-[var(--brand-50)]" />
            </div>
            <div className="space-y-4">
              <div className="h-36 animate-pulse rounded-2xl bg-[var(--brand-50)]" />
              <div className="h-32 animate-pulse rounded-2xl bg-[var(--brand-50)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}