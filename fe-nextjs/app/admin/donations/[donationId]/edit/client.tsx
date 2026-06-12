"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DonationForm, { type DonationFormData, type DonationPayload } from "@/components/donations/DonationForm";

type AdminDonationDetail = {
  id: number;
  title: string;
  description: string;
  location_city: string;
  location_address: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  address_detail?: string | null;
  available_from?: string | null;
  available_until?: string | null;
  portion_count: number;
  category_id?: number | null;
  category?: { id: number; name: string } | null;
  created_at: string;
};

type AdminDonationEditClientProps = {
  donationId: string;
};

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function buildInitialForm(donation: AdminDonationDetail): DonationFormData {
  const categoryId = donation.category?.id ?? donation.category_id ?? null;
  return {
    title: donation.title ?? "",
    description: donation.description ?? "",
    location_city: donation.location_city ?? "",
    location_address: donation.location_address ?? "",
    latitude: donation.latitude ? String(donation.latitude) : "",
    longitude: donation.longitude ? String(donation.longitude) : "",
    address_detail: donation.address_detail ?? "",
    available_from: toDateTimeLocal(donation.available_from ?? donation.created_at),
    available_until: toDateTimeLocal(donation.available_until ?? donation.available_from ?? donation.created_at),
    portion_count: donation.portion_count ?? "",
    category_id: categoryId ? String(categoryId) : "",
  };
}

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

async function updateDonation(id: string, payload: DonationPayload) {
  const res = await fetch(`/api/admin/donations/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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
        : `Gagal memperbarui donasi (${res.status})`;
    throw new Error(message);
  }
}

export default function AdminDonationEditClient({ donationId }: AdminDonationEditClientProps) {
  const router = useRouter();
  const [donation, setDonation] = useState<AdminDonationDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
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

  const initialData = useMemo(() => (donation ? buildInitialForm(donation) : undefined), [donation]);

  if (loading) {
    return (
      <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 text-sm text-(--text-mid) shadow-(--shadow-card)">
        Memuat detail donasi...
      </section>
    );
  }

  if (!donation) {
    return (
      <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 text-sm text-red-600 shadow-(--shadow-card)">
        {error || "Donasi tidak ditemukan."}
        <button
          type="button"
          onClick={() => router.push("/admin/donations")}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-(--brand-100) bg-(--brand-50) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--text-mid)"
        >
          Kembali ke Manajemen Donasi
        </button>
      </section>
    );
  }

  const handleSubmit = async (payload: DonationPayload) => {
    if (!normalizedId) {
      throw new Error("ID donasi tidak valid.");
    }
    await updateDonation(normalizedId, payload);
  };

  return (
    <DonationForm
      initialData={initialData}
      backHref="/admin/donations"
      backLabel="Kembali ke Manajemen Donasi"
      heading="Edit Donasi"
      subheading="Perbarui detail donasi sebelum dipublikasikan ke penerima."
      submitLabel="Simpan Perubahan"
      successTitle="Perubahan tersimpan"
      successMessage="Perubahan donasi sudah berhasil diperbarui."
      redirectTo="/admin/donations"
      onSubmit={handleSubmit}
    />
  );
}
