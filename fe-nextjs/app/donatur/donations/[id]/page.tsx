"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Clock, MapPin, Package, Tag } from "lucide-react";
import { ApiError, apiFetch, getUser } from "@/lib/api";
import { formatPickupTime, type ApiDonation, type Donation, mapApiDonation, STATUS_LABEL, STATUS_TONE } from "@/lib/donations";

type Props = { params: Promise<{ id: string }> };

const EDITABLE_STATUSES = new Set(["pending", "approved"] as const);

const STATUS_NOTE: Record<Donation["status"], string> = {
  pending: "Donasi sedang menunggu verifikasi admin.",
  approved: "Donasi sudah tayang dan dapat diklaim penerima.",
  rejected: "Donasi ditolak admin. Silakan periksa detail donasi Anda.",
  claimed: "Ada 1 penerima mengklaim donasi ini.",
  completed: "Donasi sudah selesai didistribusikan.",
  cancelled: "Donasi ini sudah dibatalkan.",
};

export default function DonorDonationDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [error, setError] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await apiFetch<{ data: ApiDonation }>(`/donations/${id}`);
        if (!active) return;

        const mapped = mapApiDonation(res.data);
        const user = getUser();
        if (!user || mapped.user_id !== user.id) {
          router.replace("/donatur/dashboard?notice=Anda%20tidak%20dapat%20mengakses%20detail%20donasi%20ini");
          return;
        }

        setDonation(mapped);
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Gagal memuat detail donasi");
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [id, router]);

  const canManage = useMemo(() => {
    if (!donation) return false;
    return EDITABLE_STATUSES.has(donation.status);
  }, [donation]);

  const handleCancel = async () => {
    if (!donation || !canManage) return;
    setCanceling(true);
    setNotice("");
    try {
      await apiFetch(`/donations/${donation.id}`, { method: "DELETE" });
      setNotice("Donasi berhasil dibatalkan.");
      setDonation((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Gagal membatalkan donasi");
    } finally {
      setCanceling(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-white p-8 text-center">
        <p className="font-semibold text-red-700">{error}</p>
        <Link href="/donatur/donations" className="mt-4 inline-flex items-center gap-2 text-[var(--brand-600)] font-semibold">
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar
        </Link>
      </div>
    );
  }

  if (!donation) {
    return <div className="h-56 animate-pulse rounded-3xl border border-[var(--brand-100)] bg-white" />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/donatur/donations" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-800)]">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <article className="rounded-3xl border border-[var(--brand-100)] bg-white p-6 sm:p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] font-semibold text-[var(--brand-600)]">Donasi</p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--brand-950)]">{donation.title}</h1>
          </div>
          <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${STATUS_TONE[donation.status]}`}>
            {STATUS_LABEL[donation.status]}
          </span>
        </div>

        <p className="mb-4 rounded-2xl border border-[var(--brand-100)] bg-[var(--cream)] px-4 py-3 text-sm text-[var(--text-mid)]">
          {STATUS_NOTE[donation.status]}
        </p>

        <p className="mb-6 leading-relaxed text-[var(--text-mid)]">{donation.description}</p>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <InfoRow icon={<Package className="h-4 w-4" />} label="Jumlah" value={donation.quantity} />
          <InfoRow
            icon={<Clock className="h-4 w-4" />}
            label="Mulai tersedia"
            value={donation.available_from ? formatPickupTime(donation.available_from) : "—"}
          />
          <InfoRow icon={<CalendarClock className="h-4 w-4" />} label="Batas jemput" value={formatPickupTime(donation.pickup_time)} />
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Alamat" value={donation.pickup_address} />
          {donation.category && <InfoRow icon={<Tag className="h-4 w-4" />} label="Kategori" value={donation.category.name} />}
        </div>

        {notice && (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${notice.includes("berhasil") ? "border-[var(--brand-100)] bg-[var(--brand-50)] text-[var(--brand-700)]" : "border-red-200 bg-red-50 text-red-700"}`}>
            {notice}
          </div>
        )}

        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/donatur/donations/${donation.id}/edit`}
              className="inline-flex items-center rounded-xl border border-[var(--brand-200)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-700)]"
            >
              Edit donasi
            </Link>
            <button
              type="button"
              onClick={handleCancel}
              disabled={canceling}
              className="inline-flex items-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-60"
            >
              {canceling ? "Membatalkan..." : "Batalkan donasi"}
            </button>
          </div>
        )}
      </article>
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
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--brand-100)] p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-600)]">
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--text-mid)]">{label}</div>
        <div className="text-sm font-semibold text-[var(--brand-950)]">{value}</div>
      </div>
    </div>
  );
}
