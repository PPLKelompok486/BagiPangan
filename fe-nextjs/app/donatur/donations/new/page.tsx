"use client";

import DonationForm, { type DonationPayload } from "@/components/donations/DonationForm";
import { apiFetch } from "@/lib/api";

export default function CreateDonationPage() {
  const handleSubmit = async (payload: DonationPayload) => {
    await apiFetch("/donations", {
      method: "POST",
      body: JSON.stringify(payload),
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
