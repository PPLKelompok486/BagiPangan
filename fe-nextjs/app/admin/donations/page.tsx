"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatPickupTime, STATUS_LABEL, STATUS_TONE, type DonationStatus } from "@/lib/donations";

type AdminDonation = {
  id: number;
  title: string;
  description?: string | null;
  location_city?: string | null;
  location_address?: string | null;
  available_from?: string | null;
  available_until?: string | null;
  portion_count?: number | null;
  status: DonationStatus;
  created_at: string;
  updated_at: string;
  donor?: {
    id: number;
    name: string;
    email?: string | null;
  } | null;
  user?: {
    id: number;
    name: string;
    email?: string | null;
  } | null;
  category?: { id: number; name: string } | null;
};

type DonationsResponse = {
  message: string;
  data: {
    data: AdminDonation[];
  };
};

const emptyResponse: DonationsResponse = {
  message: "Fallback",
  data: { data: [] },
};

async function fetchDonations(status: "pending" | "all"): Promise<DonationsResponse> {
  try {
    const query = status === "all" ? "status=all" : "status=pending";
    const res = await fetch(`/api/admin/donations?${query}`, { cache: "no-store" });
    if (!res.ok) return emptyResponse;
    return (await res.json()) as DonationsResponse;
  } catch {
    return emptyResponse;
  }
}

function getPickupTime(donation: AdminDonation) {
  const iso = donation.available_until ?? donation.available_from ?? donation.created_at;
  return formatPickupTime(iso);
}

function getDonor(donation: AdminDonation) {
  return donation.donor ?? donation.user ?? null;
}

export default function ManajemenDonasi() {
  const [pending, setPending] = useState<DonationsResponse>(emptyResponse);
  const [all, setAll] = useState<DonationsResponse>(emptyResponse);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      const [pendingRes, allRes] = await Promise.all([
        fetchDonations("pending"),
        fetchDonations("all"),
      ]);
      setPending(pendingRes);
      setAll(allRes);
      setLoading(false);
    }

    void bootstrap();
  }, []);

  const pendingList = pending.data.data;
  const allList = all.data.data;
  const showPending = pendingList.length > 0;

  const actionButtons = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/donations/new"
          className="rounded-full border border-(--brand-100) bg-(--brand-50) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--text-mid) hover:border-(--brand-300) hover:text-(--brand-700)"
        >
          Tambah Donasi
        </Link>
      </div>
    ),
    [],
  );

  return (
    <>
      <section className="rounded-[1.6rem] border border-(--brand-100) bg-white p-6 shadow-(--shadow-card)">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-(--brand-600)">Manajemen</p>
            <h2 className="bagi-display mt-2 text-4xl text-(--brand-900)">Donasi</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-mid)">
              Kelola seluruh donasi yang masuk, pantau status, dan verifikasi kelengkapan data.
            </p>
          </div>
          {actionButtons}
        </div>
      </section>

      {loading ? (
        <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 text-sm text-(--text-mid) shadow-(--shadow-card)">
          Memuat daftar donasi...
        </section>
      ) : null}

      {showPending ? (
        <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 shadow-(--shadow-card)">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-(--brand-900)">Donasi Menunggu Review</h3>
            <span className="text-xs uppercase tracking-[0.12em] text-(--text-mid)">Pending</span>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-(--text-mid)">
                  <th className="px-3 py-2">Donasi</th>
                  <th className="px-3 py-2">Donatur</th>
                  <th className="px-3 py-2">Kategori</th>
                  <th className="px-3 py-2">Lokasi</th>
                  <th className="px-3 py-2">Porsi</th>
                  <th className="px-3 py-2">Jadwal</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((donation) => {
                  const donationId = Number(donation.id);
                  const hasValidId = Number.isFinite(donationId);
                  const donor = getDonor(donation);
                  return (
                    <tr key={donation.id} className="rounded-2xl bg-(--brand-50) text-(--brand-900)">
                      <td className="rounded-l-2xl px-3 py-3">
                        <p className="font-semibold">{donation.title}</p>
                        <p className="text-xs text-(--text-mid)">#{donation.id}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{donor?.name ?? "-"}</p>
                        <p className="text-xs text-(--text-mid)">{donor?.email ?? "-"}</p>
                      </td>
                      <td className="px-3 py-3">{donation.category?.name ?? "-"}</td>
                      <td className="px-3 py-3">
                        {donation.location_address ?? donation.location_city ?? "-"}
                      </td>
                      <td className="px-3 py-3">{donation.portion_count ?? 0}</td>
                      <td className="px-3 py-3">{getPickupTime(donation)}</td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_TONE[donation.status]}`}
                        >
                          {STATUS_LABEL[donation.status]}
                        </span>
                      </td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href="/admin/donations/new"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--brand-100) bg-(--brand-50) text-(--text-mid) hover:border-(--brand-300) hover:text-(--brand-700)"
                            aria-label="Create"
                          >
                            <Plus className="h-4 w-4" />
                          </Link>
                          {hasValidId ? (
                            <Link
                              href={`/admin/donations/${donationId}/edit`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--brand-100) bg-(--brand-50) text-(--text-mid) hover:border-(--brand-300) hover:text-(--brand-700)"
                              aria-label="Update"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          ) : (
                            <span
                              className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-(--brand-100) bg-(--brand-50) text-(--text-mid) opacity-50"
                              aria-label="Update"
                            >
                              <Pencil className="h-4 w-4" />
                            </span>
                          )}
                          {hasValidId ? (
                            <Link
                              href={`/admin/donations/${donationId}/delete`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 hover:border-red-300"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Link>
                          ) : (
                            <span
                              className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 opacity-50"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 shadow-(--shadow-card)">
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-(--brand-900)">Seluruh Donasi</h3>
          <span className="text-xs uppercase tracking-[0.12em] text-(--text-mid)">Read Only</span>
        </header>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-(--text-mid)">
                <th className="px-3 py-2">Donasi</th>
                <th className="px-3 py-2">Donatur</th>
                <th className="px-3 py-2">Kategori</th>
                <th className="px-3 py-2">Lokasi</th>
                <th className="px-3 py-2">Porsi</th>
                <th className="px-3 py-2">Jadwal</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {allList.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-(--text-mid)" colSpan={8}>
                    Belum ada donasi.
                  </td>
                </tr>
              ) : (
                allList.map((donation) => {
                  const donationId = Number(donation.id);
                  const hasValidId = Number.isFinite(donationId);
                  const donor = getDonor(donation);
                  return (
                    <tr key={donation.id} className="rounded-2xl bg-(--brand-50) text-(--brand-900)">
                      <td className="rounded-l-2xl px-3 py-3">
                        <p className="font-semibold">{donation.title}</p>
                        <p className="text-xs text-(--text-mid)">#{donation.id}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{donor?.name ?? "-"}</p>
                        <p className="text-xs text-(--text-mid)">{donor?.email ?? "-"}</p>
                      </td>
                      <td className="px-3 py-3">{donation.category?.name ?? "-"}</td>
                      <td className="px-3 py-3">
                        {donation.location_address ?? donation.location_city ?? "-"}
                      </td>
                      <td className="px-3 py-3">{donation.portion_count ?? 0}</td>
                      <td className="px-3 py-3">{getPickupTime(donation)}</td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_TONE[donation.status]}`}
                        >
                          {STATUS_LABEL[donation.status]}
                        </span>
                      </td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href="/admin/donations/new"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--brand-100) bg-(--brand-50) text-(--text-mid) hover:border-(--brand-300) hover:text-(--brand-700)"
                            aria-label="Create"
                          >
                            <Plus className="h-4 w-4" />
                          </Link>
                          {hasValidId ? (
                            <Link
                              href={`/admin/donations/${donationId}/edit`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--brand-100) bg-(--brand-50) text-(--text-mid) hover:border-(--brand-300) hover:text-(--brand-700)"
                              aria-label="Update"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          ) : (
                            <span
                              className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-(--brand-100) bg-(--brand-50) text-(--text-mid) opacity-50"
                              aria-label="Update"
                            >
                              <Pencil className="h-4 w-4" />
                            </span>
                          )}
                          {hasValidId ? (
                            <Link
                              href={`/admin/donations/${donationId}/delete`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 hover:border-red-300"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Link>
                          ) : (
                            <span
                              className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 opacity-50"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
