"use client";

import DonationForm, { type DonationPayload } from "@/components/donations/DonationForm";
import { apiFetch } from "@/lib/api";

export default function CreateDonationPage() {
  const handleSubmit = async (payload: DonationPayload) => {
    const formData = new FormData();
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

    await apiFetch("/donations", {
      method: "POST",
      body: formData,
    });
  };

  return (
    <DonationForm
      backHref="/donatur/dashboard"
      backLabel="Kembali ke Dashboard"
      heading="Buat Donasi Baru"
      subheading="Bagikan kelebihan makanan Anda kepada yang membutuhkan."
      submitLabel="Kirim Pengajuan Donasi"
      successTitle="Berhasil!"
      successMessage="Donasi Anda telah diajukan dan sedang menunggu verifikasi admin. Terima kasih atas kebaikan Anda!"
      redirectTo="/donatur/dashboard"
      onSubmit={handleSubmit}
    />
  );
}
