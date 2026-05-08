"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CalendarClock,
  Phone,
  User as UserIcon,
  Building2,
  Package,
  AlarmClock,
  Tag,
  ImageOff,
} from "lucide-react";
import { ApiError, apiFetch, getUser, type AuthUser } from "@/lib/api";
import { imageForDonation } from "@/lib/donations";

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
  pending: "Menunggu",
  approved: "Tersedia",
  rejected: "Ditolak",
  claimed: "Diklaim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_TONE: Record<DonationDetail["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  claimed: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
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

function hoursUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (t - Date.now()) / 3_600_000;
}

export default function DonationDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [donation, setDonation] = useState<DonationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");

  useEffect(() => {
    setUser(getUser());
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ data: DonationDetail }>(`/donations/${id}`);
      setDonation(res.data);
      setImgFailed(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Gagal memuat donasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleClaim = async () => {
    if (!donation) return;
    setClaiming(true);
    setClaimMessage("");
    try {
      await apiFetch(`/donations/${donation.id}/claim`, { method: "POST" });
      setClaimMessage("Donasi berhasil diklaim.");
      await load();
    } catch (err) {
      setClaimMessage(err instanceof ApiError ? err.message : "Gagal mengklaim donasi");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !donation) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-700 font-semibold">{error || "Donasi tidak ditemukan"}</p>
          <button
            onClick={load}
            className="mt-4 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const heroImage = donation.photo_url && !imgFailed
    ? donation.photo_url
    : imageForDonation({ id: donation.id, title: donation.title, description: donation.description });

  const hoursLeft = hoursUntil(donation.expired_at);
  const isNearlyExpired = hoursLeft !== null && hoursLeft >= 0 && hoursLeft <= 6;
  const isExpired = hoursLeft !== null && hoursLeft < 0;
  const role = user?.role;
  const isReceiver = role === "penerima" || (role as string) === "receiver";
  const canClaim = donation.status === "approved" && isReceiver && !isExpired;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <article className="bg-white border border-green-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="relative h-56 sm:h-80 bg-green-50">
          {heroImage ? (
            <img
              src={heroImage}
              alt={donation.title}
              className="h-full w-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-green-600">
              <ImageOff className="h-10 w-10 mb-2" />
              <span className="text-sm">Foto tidak tersedia</span>
            </div>
          )}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent"
          />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
            {donation.category && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-green-700 shadow-sm">
                <Tag className="h-3 w-3" /> {donation.category}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_TONE[donation.status]}`}
            >
              {STATUS_LABEL[donation.status]}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-950 mb-2">
            {donation.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                isNearlyExpired
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Berakhir: {formatDate(donation.expired_at)}
              {isNearlyExpired && " (segera)"}
              {isExpired && " (kadaluarsa)"}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                isNearlyExpired
                  ? "bg-red-50 border-red-200 text-red-700 ring-2 ring-red-200"
                  : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              {donation.remaining_portion} / {donation.portion} porsi
            </span>
            {isNearlyExpired && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-3 py-1 text-xs font-semibold">
                <AlarmClock className="h-3 w-3" /> Hampir kadaluarsa
              </span>
            )}
          </div>

          <h2 className="text-sm font-semibold text-green-900 uppercase tracking-wide mb-2">
            Deskripsi
          </h2>
          <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-line">
            {donation.description}
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Lokasi (kecamatan)"
              value={donation.location || "—"}
            />
            <InfoRow
              icon={<Package className="h-4 w-4" />}
              label="Sisa porsi"
              value={`${donation.remaining_portion} dari ${donation.portion}`}
              highlight={isNearlyExpired}
            />
          </div>

          <h2 className="text-sm font-semibold text-green-900 uppercase tracking-wide mb-2">
            Donatur
          </h2>
          <div className="border border-green-100 rounded-2xl bg-green-50/40 p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-semibold text-green-950">
                  {donation.donor?.name ?? "—"}
                </div>
                {donation.donor?.organization && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-green-600" />
                    {donation.donor.organization}
                  </div>
                )}
                {donation.donor?.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-green-600" />
                    <a
                      href={`tel:${donation.donor.phone}`}
                      className="hover:text-green-700 hover:underline"
                    >
                      {donation.donor.phone}
                    </a>
                  </div>
                )}
                {donation.donor?.address && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-green-600" />
                    {donation.donor.address}
                  </div>
                )}
              </div>
            </div>
          </div>

          {claimMessage && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm font-medium border ${
                claimMessage.includes("berhasil")
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {claimMessage}
            </div>
          )}

          {canClaim ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {claiming ? "Memproses..." : "Klaim Donasi"}
            </button>
          ) : (
            <div className="border border-green-100 bg-green-50/50 rounded-xl p-4 text-sm text-slate-600 text-center">
              {donation.status !== "approved"
                ? "Donasi ini sudah tidak tersedia untuk diklaim."
                : isExpired
                  ? "Waktu pengambilan donasi sudah lewat."
                  : !user
                    ? "Masuk sebagai penerima untuk mengklaim donasi."
                    : "Hanya akun penerima yang dapat mengklaim donasi."}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border rounded-2xl p-3 flex items-start gap-3 ${
        highlight ? "border-red-200 bg-red-50/50" : "border-green-100"
      }`}
    >
      <div
        className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
          highlight ? "bg-red-100 text-red-700" : "bg-green-50 text-green-600"
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
        <div className={`text-sm font-semibold ${highlight ? "text-red-700" : "text-green-950"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="h-4 w-24 bg-green-100 rounded mb-6 animate-pulse" />
      <div className="bg-white border border-green-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="h-56 sm:h-80 bg-green-100 animate-pulse" />
        <div className="p-6 sm:p-8 space-y-4">
          <div className="h-7 w-2/3 bg-green-100 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 w-32 bg-green-50 rounded-full animate-pulse" />
            <div className="h-6 w-24 bg-green-50 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-green-50 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-green-50 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-green-50 rounded animate-pulse" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="h-16 bg-green-50 rounded-2xl animate-pulse" />
            <div className="h-16 bg-green-50 rounded-2xl animate-pulse" />
          </div>
          <div className="h-24 bg-green-50 rounded-2xl animate-pulse" />
          <div className="h-12 bg-green-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
