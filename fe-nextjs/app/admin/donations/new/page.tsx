"use client";

import DonationForm, { type DonationPayload } from "@/components/donations/DonationForm";

async function createDonation(payload: DonationPayload) {
  const res = await fetch("/api/admin/donations", {
    method: "POST",
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
        : `Gagal membuat donasi (${res.status})`;
    throw new Error(message);
  }
}

export default function AdminDonationCreatePage() {
  return (
    <DonationForm
      backHref="/admin/donations"
      backLabel="Kembali ke Manajemen Donasi"
      heading="Tambah Donasi (Admin)"
      subheading="Masukkan detail donasi baru sebelum dipublikasikan."
      submitLabel="Simpan Donasi"
      successTitle="Donasi tersimpan"
      successMessage="Donasi baru sudah tercatat dan siap untuk proses moderasi."
      redirectTo="/admin/donations"
      onSubmit={createDonation}
    />
  );
}
