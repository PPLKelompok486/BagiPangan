"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";

type AdminDonationDetail = {
  id: number;
  title: string;
  location_city: string;
  location_address: string;
};

type AdminDonationDeleteClientProps = {
  donationId: string;
};

async function fetchDonation(id: string) {
  const res = await fetch(`/api/admin/donations/${id}`, { cache: "no-store" });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : `Gagal memuat donasi (${res.status})`;
    throw new Error(message);
  }

  const payload = data as { data: AdminDonationDetail };
  return payload.data;
}

async function deleteDonation(id: string) {
  const res = await fetch(`/api/admin/donations/${id}`, {
    method: "DELETE",
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : `Gagal menghapus donasi (${res.status})`;
    throw new Error(message);
  }
}

export default function AdminDonationDeleteClient({ donationId }: AdminDonationDeleteClientProps) {
  const router = useRouter();
  const [donation, setDonation] = useState<AdminDonationDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const normalizedId = useMemo(() => {
    const rawId = donationId
      ?? (typeof window !== "undefined"
        ? window.location.pathname.split("/").filter(Boolean)[2]
        : undefined);
    if (!rawId || rawId === "undefined" || rawId === "null") return null;
    const numericId = Number(rawId);
    return Number.isFinite(numericId) ? String(numericId) : null;
  }, [donationId]);

  useEffect(() => {
    let active = true;
    const loadDonation = async () => {
      if (!normalizedId) {
        setError("ID donasi tidak valid.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchDonation(normalizedId);
        if (!active) return;
        setDonation(data);
      } catch (err: unknown) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Gagal memuat detail donasi";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDonation();
    return () => {
      active = false;
    };
  }, [normalizedId]);

  const handleDelete = async () => {
    setSubmitting(true);
    setError("");
    try {
      if (!normalizedId) {
        throw new Error("ID donasi tidak valid.");
      }
      await deleteDonation(normalizedId);
      router.push("/admin/donations");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus donasi";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 text-sm text-(--text-mid) shadow-(--shadow-card)">
        Memuat detail donasi...
      </section>
    );
  }

  return (
    <section className="rounded-[1.6rem] border border-red-200 bg-white p-6 shadow-(--shadow-card)">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="bagi-display text-2xl text-red-700">Hapus Donasi</h2>
          <p className="mt-2 text-sm text-(--text-mid)">
            Tindakan ini akan menghapus donasi dari sistem. Pastikan data sudah tidak dibutuhkan.
          </p>
        </div>
      </div>

      {donation ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/60 p-4 text-sm text-red-700">
          <p className="font-semibold">{donation.title}</p>
          <p className="mt-1 text-xs">
            {donation.location_address}, {donation.location_city}
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/donations"
          className="rounded-full border border-(--brand-100) bg-(--brand-50) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--text-mid)"
        >
          Batal
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-70"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Hapus Donasi
        </button>
      </div>
    </section>
  );
}
