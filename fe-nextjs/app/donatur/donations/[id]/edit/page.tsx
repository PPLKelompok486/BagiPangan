"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DonationForm, { type DonationFormData, type DonationPayload } from "@/components/donations/DonationForm";
import { ApiError, apiFetch } from "@/lib/api";
import { type ApiDonation } from "@/lib/donations";

type Props = { params: Promise<{ id: string }> };

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function buildInitialForm(donation: ApiDonation): DonationFormData {
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
    imageUrl: donation.image ?? "",
    imageFile: null,
    delete_image: false,
  };
}

export default function DonaturDonationEditPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [donation, setDonation] = useState<ApiDonation | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadDonation = async () => {
      try {
        const res = await apiFetch<{ data: ApiDonation }>(`/donations/${id}`);
        if (!active) return;
        setDonation(res.data);
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Gagal memuat detail donasi");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDonation();
    return () => {
      active = false;
    };
  }, [id]);

  const initialData = useMemo(() => (donation ? buildInitialForm(donation) : undefined), [donation]);

  const handleSubmit = async (payload: DonationPayload) => {
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("location_city", payload.location_city);
    formData.append("location_address", payload.location_address);
    if (payload.latitude !== null && payload.latitude !== undefined) {
      formData.append("latitude", String(payload.latitude));
    }
    if (payload.longitude !== null && payload.longitude !== undefined) {
      formData.append("longitude", String(payload.longitude));
    }
    if (payload.address_detail !== null && payload.address_detail !== undefined) {
      formData.append("address_detail", payload.address_detail);
    }
    formData.append("available_from", payload.available_from);
    formData.append("available_until", payload.available_until);
    formData.append("portion_count", String(payload.portion_count));
    if (payload.category_id !== null && payload.category_id !== undefined) {
      formData.append("category_id", String(payload.category_id));
    }
    if (payload.image) {
      formData.append("image", payload.image);
    }
    if (payload.delete_image) {
      formData.append("delete_image", "true");
    }

    await apiFetch(`/donations/${id}`, {
      method: "POST",
      body: formData,
    });
  };

  if (loading) {
    return (
      <div className="bagi-theme min-h-[50vh] flex items-center justify-center bg-[var(--cream)]">
        <div className="text-sm font-semibold text-[var(--brand-800)]">
          Memuat detail donasi...
        </div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="bagi-theme min-h-[50vh] flex flex-col items-center justify-center bg-[var(--cream)] p-6 text-center">
        <div className="text-sm font-bold text-red-600 mb-4">
          {error || "Donasi tidak ditemukan."}
        </div>
        <button
          type="button"
          onClick={() => router.push("/donatur/donations")}
          className="rounded-xl border border-[var(--brand-200)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-700)] hover:bg-[var(--brand-50)]"
        >
          Kembali ke Daftar Donasi
        </button>
      </div>
    );
  }

  return (
    <DonationForm
      initialData={initialData}
      backHref={`/donatur/donations/${id}`}
      backLabel="Kembali ke Detail Donasi"
      heading="Edit Donasi"
      subheading="Perbarui informasi makanan atau jadwal penjemputan donasi Anda."
      submitLabel="Simpan Perubahan"
      successTitle="Perubahan disimpan!"
      successMessage="Informasi donasi Anda berhasil diperbarui."
      redirectTo={`/donatur/donations/${id}`}
      onSubmit={handleSubmit}
    />
  );
}
