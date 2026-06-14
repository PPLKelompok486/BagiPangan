"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Package } from "lucide-react";
import { formatPickupTime, STATUS_LABEL, type DonationStatus } from "@/lib/donations";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge, type BadgeTone } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";

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

type MutationResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const emptyResponse: DonationsResponse = {
  message: "Fallback",
  data: { data: [] },
};

async function fetchDonations(status: "pending" | "all"): Promise<DonationsResponse> {
  try {
    const params = new URLSearchParams({
      status,
      per_page: status === "all" ? "100" : "10",
    });
    const res = await fetch(`/api/admin/donations?${params.toString()}`, { cache: "no-store" });
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

function getErrorMessage(payload: MutationResponse, fallback: string) {
  const firstError = payload.errors ? Object.values(payload.errors)[0]?.[0] : null;
  return firstError ?? payload.message ?? fallback;
}

export default function ManajemenDonasi() {
  const [all, setAll] = useState<DonationsResponse>(emptyResponse);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<{
    donationId: number;
    action: "approve" | "reject";
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Filter / search state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<{ id: number } | null>(null);

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      setLoading(true);
      setError("");
      const [allRes] = await Promise.all([
        fetchDonations("all"),
      ]);
      if (!ignore) {
        setAll(allRes);
        setLoading(false);
      }
    }

    void bootstrap();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  async function moderateDonation(
    donationId: number,
    action: "approve" | "reject",
    body?: Record<string, string>,
  ) {
    setBusyAction({ donationId, action });
    setError("");
    setNotice("");

    try {
      const res = await fetch(`/api/admin/donations/${donationId}/${action}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = (await res.json()) as MutationResponse;

      if (!res.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            action === "approve" ? "Donasi gagal disetujui" : "Donasi gagal ditolak",
          ),
        );
      }

      setNotice(
        payload.message ??
          (action === "approve" ? "Donasi berhasil disetujui" : "Donasi berhasil ditolak"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status donasi gagal diperbarui");
    } finally {
      setBusyAction(null);
    }
  }

  function handleApprove(donationId: number) {
    void moderateDonation(donationId, "approve");
  }

  // Accepts optional reason from ConfirmDialog; passes it to the API if provided
  function handleReject(donationId: number, reason?: string) {
    const body = reason?.trim() ? { reason: reason.trim() } : undefined;
    void moderateDonation(donationId, "reject", body);
  }

  const allList = all.data.data;

  // Client-side filtering
  const filtered = useMemo(() => {
    return allList.filter((d) => {
      const donor = getDonor(d);
      const matchSearch =
        (d.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (donor?.name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allList, search, statusFilter]);

  const toneFor = (status: DonationStatus): BadgeTone => {
    if (status === "approved" || status === "completed") return "success";
    if (status === "pending") return "warning";
    if (status === "rejected" || status === "cancelled") return "danger";
    if (status === "claimed") return "info";
    return "neutral";
  };

  const columns: Column<AdminDonation>[] = [
    {
      key: "title",
      header: "Donasi",
      sortable: true,
      sortValue: (d) => d.title ?? "",
      render: (d) => (
        <div>
          <p className="font-semibold text-(--brand-900)">{d.title}</p>
          <p className="text-xs text-(--text-mid)">#{d.id}</p>
        </div>
      ),
    },
    {
      key: "donor",
      header: "Donatur",
      render: (d) => {
        const donor = getDonor(d);
        return (
          <div>
            <p className="font-medium">{donor?.name ?? "-"}</p>
            <p className="text-xs text-(--text-mid)">{donor?.email ?? "-"}</p>
          </div>
        );
      },
    },
    {
      key: "category",
      header: "Kategori",
      render: (d) => d.category?.name ?? "-",
    },
    {
      key: "location",
      header: "Lokasi",
      render: (d) => d.location_address ?? d.location_city ?? "-",
    },
    {
      key: "portion_count",
      header: "Porsi",
      align: "right",
      sortable: true,
      sortValue: (d) => d.portion_count ?? 0,
      render: (d) => String(d.portion_count ?? 0),
    },
    {
      key: "schedule",
      header: "Jadwal",
      render: (d) => getPickupTime(d),
    },
    {
      key: "status",
      header: "Status",
      render: (d) => (
        <StatusBadge tone={toneFor(d.status)}>
          {STATUS_LABEL[d.status]}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (d) => {
        const donationId = Number(d.id);
        const hasValidId = Number.isFinite(donationId);
        const isBusy = busyAction?.donationId === donationId;
        return (
          <div className="flex items-center justify-end gap-2">
            {d.status === "pending" && (
              <>
                <button
                  type="button"
                  disabled={!hasValidId || isBusy}
                  onClick={() => handleApprove(donationId)}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 text-xs font-semibold text-green-700 hover:border-green-300 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Setujui ${d.title}`}
                >
                  {isBusy && busyAction?.action === "approve" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Setujui
                </button>
                <button
                  type="button"
                  disabled={!hasValidId || isBusy}
                  onClick={() => setRejectTarget({ id: donationId })}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Tolak ${d.title}`}
                >
                  {isBusy && busyAction?.action === "reject" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Tolak
                </button>
              </>
            )}
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
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Manajemen Donasi"
        description="Kelola seluruh donasi yang masuk, pantau status, dan verifikasi kelengkapan data."
        actions={
          <Link
            href="/admin/donations/new"
            className="rounded-full border border-(--brand-100) bg-(--brand-50) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--text-mid) hover:border-(--brand-300) hover:text-(--brand-700)"
          >
            Tambah Donasi
          </Link>
        }
      />

      {notice ? (
        <section className="flex items-center gap-2 rounded-[1.4rem] border border-green-100 bg-green-50 p-4 text-sm font-medium text-green-700 shadow-(--shadow-card)">
          <Check className="h-4 w-4" />
          {notice}
        </section>
      ) : null}

      {error ? (
        <section className="flex items-center gap-2 rounded-[1.4rem] border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-(--shadow-card)">
          <AlertCircle className="h-4 w-4" />
          {error}
        </section>
      ) : null}

      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Cari donasi atau donatur…"
        filters={[
          {
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "Semua status", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
              { label: "Claimed", value: "claimed" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ],
          },
        ]}
      />

      <DataTable<AdminDonation>
        columns={columns}
        data={filtered}
        getRowId={(d) => String(d.id)}
        loading={loading}
        error={error || null}
        emptyState={
          <EmptyState
            icon={Package}
            title="Belum ada donasi"
            description="Donasi yang masuk akan muncul di sini."
          />
        }
      />

      <ConfirmDialog
        open={rejectTarget !== null}
        title="Tolak donasi?"
        description="Donasi ini akan ditolak. Sertakan alasan untuk audit."
        confirmLabel="Tolak"
        requireReason
        reasonLabel="Alasan penolakan"
        onCancel={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (rejectTarget) handleReject(rejectTarget.id, reason);
          setRejectTarget(null);
        }}
      />
    </>
  );
}
