"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import type { UsersResponse } from "../types";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge, type BadgeTone } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { DatePicker } from "@/components/admin/date-picker";

type User = UsersResponse["data"]["data"][number];

type Toast = { kind: "success" | "error"; message: string } | null;

type ConfirmModalState = {
  type: "deactivate" | "activate" | "delete" | "restore";
  user: User;
} | null;

const emptyUsers: UsersResponse = {
  message: "Fallback users",
  data: {
    data: [],
  },
};

async function getUsersData(params?: Record<string, string | undefined>) {
  try {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value) {
        searchParams.set(key, value);
      }
    }
    const qs = params ? `?${searchParams.toString()}` : "";

    const res = await fetch(`/api/admin/users${qs}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return emptyUsers;
    }

    return (await res.json()) as UsersResponse;
  } catch {
    return emptyUsers;
  }
}

const getGraceDaysLeft = (deletedAt?: string | null) => {
  if (!deletedAt) return 7;
  const deletedTime = new Date(deletedAt).getTime();
  const diffTime = Date.now() - deletedTime;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysLeft = 7 - diffDays;
  return daysLeft > 0 ? daysLeft : 1;
};

export default function ManajemenUser() {
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // FilterBar search — client-side against the already-fetched list
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Server-side date range filters kept as-is
  const [registeredFrom, setRegisteredFrom] = useState<string | undefined>(undefined);
  const [registeredTo, setRegisteredTo] = useState<string | undefined>(undefined);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [phraseInput, setPhraseInput] = useState("");
  const [safeguardChecked, setSafeguardChecked] = useState(false);

  // Toast
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(next: NonNullable<Toast>) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    let ignore = false;
    async function bootstrap() {
      setLoading(true);
      const params: Record<string, string | undefined> = {
        registered_from: registeredFrom || undefined,
        registered_to: registeredTo || undefined,
        per_page: "200",
      };

      const data = await getUsersData(params);
      if (!ignore) {
        setUserList(data.data.data);
      }
      setLoading(false);
    }

    const t = setTimeout(() => void bootstrap(), 150);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [registeredFrom, registeredTo]);

  // Client-side filtering
  const filtered = useMemo(() => {
    return userList.filter((u) => {
      const matchSearch =
        search.trim() === "" ||
        `${u.name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "" || (u.is_admin ? "admin" : u.role) === roleFilter;
      const matchStatus =
        statusFilter === "" ||
        (statusFilter === "deleted" ? !!u.deleted_at : statusFilter === "active" ? u.is_active && !u.deleted_at : !u.is_active && !u.deleted_at);
      return matchSearch && matchRole && matchStatus;
    });
  }, [userList, search, roleFilter, statusFilter]);

  const roleTone = (user: User): BadgeTone => {
    if (user.is_admin) return "warning";
    if (user.role === "donatur") return "info";
    return "neutral";
  };

  const statusTone = (user: User): BadgeTone => {
    if (user.deleted_at) return "danger";
    if (!user.is_active) return "warning";
    return "success";
  };

  const statusLabel = (user: User): string => {
    if (user.deleted_at) return `Menunggu Hapus (${getGraceDaysLeft(user.deleted_at)}h)`;
    if (!user.is_active) return "Nonaktif";
    return "Aktif";
  };

  const handleAction = async () => {
    if (!confirmModal || actionLoading) return;

    const { type, user } = confirmModal;

    if (type === "delete") {
      if (!safeguardChecked) {
        showToast({ kind: "error", message: "Anda harus menyetujui pernyataan konsekuensi data." });
        return;
      }
      if (phraseInput.trim().toUpperCase() !== "HAPUS") {
        showToast({ kind: "error", message: "Kata konfirmasi salah. Harap ketik 'HAPUS'." });
        return;
      }
    }

    try {
      setActionLoading(true);

      let url = `/api/admin/users/${user.id}`;
      let method = "PATCH";

      if (type === "deactivate") {
        url += "?action=deactivate";
      } else if (type === "activate") {
        url += "?action=activate";
      } else if (type === "delete") {
        method = "DELETE";
      } else if (type === "restore") {
        url += "?action=restore";
        method = "POST";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || `Operasi gagal (${res.status})`);
      }

      setUserList((prev) =>
        prev.map((u) => {
          if (u.id === user.id) {
            if (type === "deactivate") return { ...u, is_active: false, deactivated_at: new Date().toISOString() };
            if (type === "activate") return { ...u, is_active: true, deactivated_at: null };
            if (type === "delete") return { ...u, is_active: false, deleted_at: new Date().toISOString() };
            if (type === "restore") return { ...u, is_active: true, deleted_at: null, deactivated_at: null };
          }
          return u;
        }),
      );

      showToast({ kind: "success", message: json.message || "Tindakan berhasil dijalankan." });
      setConfirmModal(null);
      setPhraseInput("");
      setSafeguardChecked(false);
    } catch (err) {
      showToast({
        kind: "error",
        message: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses permintaan.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Nama & Email",
      sortable: true,
      sortValue: (u) => u.name ?? "",
      render: (u) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-(--brand-900)">{u.name}</p>
            {u.is_admin && (
              <span className="rounded bg-(--brand-600) px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-(--text-mid)">{u.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Peran",
      render: (u) => (
        <StatusBadge tone={roleTone(u)}>
          {u.is_admin ? "Administrator" : u.role}
        </StatusBadge>
      ),
    },
    {
      key: "city",
      header: "Kota",
      render: (u) => u.city ?? "-",
    },
    {
      key: "created_at",
      header: "Terdaftar",
      sortable: true,
      sortValue: (u) => u.created_at,
      render: (u) =>
        u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID") : "-",
    },
    {
      key: "status",
      header: "Status Akun",
      render: (u) => <StatusBadge tone={statusTone(u)}>{statusLabel(u)}</StatusBadge>,
    },
    {
      key: "actions",
      header: "Tindakan",
      align: "right",
      render: (u) => {
        if (u.is_admin) {
          return <span className="pr-2 text-xs italic text-(--text-mid)">Sistem Terkunci</span>;
        }
        const isDeleted = !!u.deleted_at;
        const isActive = u.is_active && !isDeleted;

        return (
          <div className="flex items-center justify-end gap-1.5">
            {isDeleted ? (
              <button
                type="button"
                onClick={() => setConfirmModal({ type: "restore", user: u })}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
                title="Pulihkan Akun"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Pulihkan
              </button>
            ) : (
              <>
                {isActive ? (
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ type: "deactivate", user: u })}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-amber-600"
                    title="Nonaktifkan Akun"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Nonaktifkan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ type: "activate", user: u })}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
                    title="Aktifkan Akun"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Aktifkan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmModal({ type: "delete", user: u })}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-red-700"
                  title="Hapus Akun"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Manajemen User"
        description="Kelola pengguna platform, atur roles, dan monitor aktivitas pengguna."
      />

      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Cari nama atau email…"
        filters={[
          {
            label: "Peran",
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { label: "Peran (semua)", value: "" },
              { label: "Administrator", value: "admin" },
              { label: "Donatur", value: "donatur" },
              { label: "Penerima", value: "penerima" },
            ],
          },
          {
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "Status (semua)", value: "" },
              { label: "Aktif", value: "active" },
              { label: "Nonaktif", value: "inactive" },
              { label: "Menunggu Hapus", value: "deleted" },
            ],
          },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-(--text-mid)">Dari</span>
            <DatePicker
              value={registeredFrom ?? ""}
              onChange={(iso) => setRegisteredFrom(iso || undefined)}
              max={registeredTo}
              ariaLabel="Terdaftar dari tanggal"
              placeholder="Tanggal awal"
            />
            <span className="text-xs font-medium text-(--text-mid)">Sampai</span>
            <DatePicker
              value={registeredTo ?? ""}
              onChange={(iso) => setRegisteredTo(iso || undefined)}
              min={registeredFrom}
              ariaLabel="Terdaftar sampai tanggal"
              placeholder="Tanggal akhir"
            />
          </div>
        }
      />

      <DataTable<User>
        columns={columns}
        data={filtered}
        getRowId={(u) => String(u.id)}
        loading={loading}
        emptyState={
          <EmptyState
            icon={Users}
            title="Belum ada pengguna"
            description="Pengguna yang terdaftar akan muncul di sini."
          />
        }
      />

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl border bg-white p-6 shadow-2xl duration-200 ${
              confirmModal.type === "delete" ? "border-red-100" : "border-(--brand-100)"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full p-2.5 ${
                    confirmModal.type === "delete"
                      ? "bg-red-100 text-red-700"
                      : confirmModal.type === "deactivate"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {confirmModal.type === "delete" ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : confirmModal.type === "deactivate" ? (
                    <UserX className="h-6 w-6" />
                  ) : (
                    <UserCheck className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-(--brand-900)">
                    {confirmModal.type === "delete"
                      ? "Konfirmasi Hapus Akun"
                      : confirmModal.type === "deactivate"
                        ? "Konfirmasi Nonaktifkan Akun"
                        : confirmModal.type === "restore"
                          ? "Konfirmasi Pulihkan Akun"
                          : "Konfirmasi Aktifkan Akun"}
                  </h3>
                  <p className="text-xs text-(--text-mid)">Target: {confirmModal.user.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal(null);
                  setPhraseInput("");
                  setSafeguardChecked(false);
                }}
                className="rounded-full p-1 text-(--text-mid) hover:bg-(--brand-50) hover:text-(--brand-900)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {confirmModal.type === "deactivate" && (
                <div className="text-sm leading-relaxed text-(--text-mid)">
                  Apakah Anda yakin ingin menonaktifkan akun{" "}
                  <strong className="text-(--brand-900)">{confirmModal.user.name}</strong>?
                </div>
              )}
              {confirmModal.type === "activate" && (
                <div className="text-sm leading-relaxed text-(--text-mid)">
                  Apakah Anda yakin ingin mengaktifkan kembali akun{" "}
                  <strong className="text-(--brand-900)">{confirmModal.user.name}</strong>?
                </div>
              )}
              {confirmModal.type === "restore" && (
                <div className="text-sm leading-relaxed text-(--text-mid)">
                  Apakah Anda yakin ingin memulihkan akun{" "}
                  <strong className="text-(--brand-900)">{confirmModal.user.name}</strong>?
                </div>
              )}
              {confirmModal.type === "delete" && (
                <>
                  <div className="rounded-xl border border-red-100 bg-red-50/50 p-3.5 text-sm leading-relaxed text-(--text-mid)">
                    <p className="flex items-center gap-1.5 font-semibold text-red-900">
                      Peringatan Penting Data &amp; Privasi
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-red-800">
                      <li>Akun akan masuk ke masa tenggang 7 hari sebelum dihapus permanen.</li>
                      <li>Setelah 7 hari, seluruh data dihapus secara fisik dan permanen.</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <label className="flex cursor-pointer select-none items-start gap-2">
                      <input
                        type="checkbox"
                        checked={safeguardChecked}
                        onChange={(e) => setSafeguardChecked(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-xs leading-relaxed text-(--text-mid)">
                        Saya memahami konsekuensi penghapusan data ini dan setuju untuk melanjutkan.
                      </span>
                    </label>
                    <div className="space-y-1">
                      <span className="block text-xs font-semibold text-(--brand-900)">
                        Ketik <strong className="text-red-700">HAPUS</strong> untuk mengonfirmasi:
                      </span>
                      <input
                        type="text"
                        value={phraseInput}
                        onChange={(e) => setPhraseInput(e.target.value)}
                        placeholder="Ketik kata konfirmasi"
                        className="w-full rounded-xl border border-red-200 px-3 py-2 text-center text-sm font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmModal(null);
                  setPhraseInput("");
                  setSafeguardChecked(false);
                }}
                disabled={actionLoading}
                className="rounded-full border border-(--brand-100) px-5 py-2 text-sm font-semibold text-(--brand-800) transition-colors hover:bg-(--brand-50) disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAction}
                disabled={
                  actionLoading ||
                  (confirmModal.type === "delete" &&
                    (!safeguardChecked || phraseInput.trim().toUpperCase() !== "HAPUS"))
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  confirmModal.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : confirmModal.type === "deactivate"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirmModal.type === "delete"
                  ? "Hapus Akun"
                  : confirmModal.type === "deactivate"
                    ? "Nonaktifkan"
                    : "Aktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex max-w-sm animate-in slide-in-from-bottom-5 items-start gap-3 rounded-xl px-4 py-3 shadow-lg transition-all duration-300 ${
            toast.kind === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.kind === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <div className="text-sm leading-5">{toast.message}</div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 rounded-full p-1 hover:bg-white/10"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
