"use client";

import { useState, useEffect, useRef } from "react";
import type { UsersResponse } from "../types";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

type User = UsersResponse["data"]["data"][number];

type UsersTableProps = {
  users: User[];
};

type Toast = { kind: "success" | "error"; message: string } | null;

type ConfirmModalState = {
  type: "deactivate" | "activate" | "delete" | "restore";
  user: User;
} | null;

export function UsersTable({ users }: UsersTableProps) {
  const [userList, setUserList] = useState<User[]>(users);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [phraseInput, setPhraseInput] = useState("");
  const [safeguardChecked, setSafeguardChecked] = useState(false);

  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state if users prop changes
  useEffect(() => {
    setUserList(users);
  }, [users]);

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

  const getGraceDaysLeft = (deletedAt?: string | null) => {
    if (!deletedAt) return 7;
    const deletedTime = new Date(deletedAt).getTime();
    const diffTime = Date.now() - deletedTime;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = 7 - diffDays;
    return daysLeft > 0 ? daysLeft : 1;
  };

  const handleAction = async () => {
    if (!confirmModal || actionLoading) return;

    const { type, user } = confirmModal;

    // Validation for deletion safeguard
    if (type === "delete") {
      if (!safeguardChecked) {
        showToast({
          kind: "error",
          message: "Anda harus menyetujui pernyataan konsekuensi data.",
        });
        return;
      }
      if (phraseInput.trim().toUpperCase() !== "HAPUS") {
        showToast({
          kind: "error",
          message: "Kata konfirmasi salah. Harap ketik 'HAPUS'.",
        });
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
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || `Operasi gagal (${res.status})`);
      }

      // Update local state for instant responsiveness
      setUserList((prev) =>
        prev.map((u) => {
          if (u.id === user.id) {
            if (type === "deactivate") {
              return { ...u, is_active: false, deactivated_at: new Date().toISOString() };
            } else if (type === "activate") {
              return { ...u, is_active: true, deactivated_at: null };
            } else if (type === "delete") {
              return {
                ...u,
                is_active: false,
                deleted_at: new Date().toISOString(),
              };
            } else if (type === "restore") {
              return { ...u, is_active: true, deleted_at: null, deactivated_at: null };
            }
          }
          return u;
        })
      );

      showToast({
        kind: "success",
        message: json.message || "Tindakan berhasil dijalankan.",
      });

      // Close modal and reset fields
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

  return (
    <>
      <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 shadow-(--shadow-card)">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-(--brand-900)">Daftar Pengguna Platform</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-(--brand-50) text-(--brand-700) uppercase tracking-[0.08em]">
            Panel Administrator
          </span>
        </header>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2.5 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-(--text-mid)">
                <th className="px-4 py-2">Nama & Email</th>
                <th className="px-4 py-2">Peran</th>
                <th className="px-4 py-2">Kota</th>
                <th className="px-4 py-2">Status Akun</th>
                <th className="px-4 py-2 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {userList.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-(--text-mid) text-center" colSpan={5}>
                    Belum ada data pengguna yang terdaftar.
                  </td>
                </tr>
              ) : (
                userList.map((user) => {
                  const isDeleted = !!user.deleted_at;
                  const isDeactivated = !user.is_active && !isDeleted;
                  const isActive = user.is_active && !isDeleted;

                  return (
                    <tr
                      key={user.id}
                      className={`rounded-2xl transition-all duration-300 ${
                        isDeleted
                          ? "bg-red-50/20 text-(--brand-900) border border-red-100"
                          : isDeactivated
                          ? "bg-amber-50/30 text-(--brand-900)"
                          : "bg-(--brand-50) text-(--brand-900) hover:bg-(--brand-100)/50"
                      }`}
                    >
                      <td className="rounded-l-2xl px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{user.name}</p>
                          {user.is_admin && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-(--brand-600) text-white uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-(--text-mid)">{user.email}</p>
                      </td>
                      <td className="px-4 py-3.5 capitalize">
                        {user.is_admin ? "Administrator" : user.role}
                      </td>
                      <td className="px-4 py-3.5">{user.city ?? "-"}</td>
                      <td className="px-4 py-3.5">
                        {isDeleted ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 w-max rounded-full bg-red-100 px-3 py-0.5 text-[11px] font-semibold text-red-700">
                              Menunggu Penghapusan
                            </span>
                            <span className="text-[10px] text-red-600 font-medium pl-1">
                              Permanen dalam {getGraceDaysLeft(user.deleted_at)} hari
                            </span>
                          </div>
                        ) : isDeactivated ? (
                          <span className="inline-flex items-center w-max rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">
                            Nonaktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center w-max rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="rounded-r-2xl px-4 py-3.5 text-right">
                        {user.is_admin ? (
                          <span className="text-xs text-(--text-mid) italic pr-2">Sistem Terkunci</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {isDeleted ? (
                              <button
                                type="button"
                                onClick={() => setConfirmModal({ type: "restore", user })}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200"
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
                                    onClick={() => setConfirmModal({ type: "deactivate", user })}
                                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200"
                                    title="Nonaktifkan Akun"
                                  >
                                    <UserX className="h-3.5 w-3.5" />
                                    Nonaktifkan
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmModal({ type: "activate", user })}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200"
                                    title="Aktifkan Akun"
                                  >
                                    <UserCheck className="h-3.5 w-3.5" />
                                    Aktifkan
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setConfirmModal({ type: "delete", user })}
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Hapus
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
          <div
            className={`w-full max-w-md rounded-2xl bg-white border p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${
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
                className="rounded-full p-1 hover:bg-(--brand-50) text-(--text-mid) hover:text-(--brand-900)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {confirmModal.type === "deactivate" && (
                <div className="text-sm text-(--text-mid) leading-relaxed">
                  Apakah Anda yakin ingin menonaktifkan akun <strong className="text-(--brand-900)">{confirmModal.user.name}</strong>?
                  <ul className="list-disc pl-4 mt-2 space-y-1 text-xs">
                    <li>Semua sesi aktif saat ini akan **langsung dikeluarkan (revoked)**.</li>
                    <li>Pengguna **tidak dapat masuk (login)** ke platform di masa mendatang.</li>
                    <li>Seluruh data profil, donasi, dan klaim pengguna **tetap utuh dan aman**.</li>
                  </ul>
                </div>
              )}

              {confirmModal.type === "activate" && (
                <div className="text-sm text-(--text-mid) leading-relaxed">
                  Apakah Anda yakin ingin mengaktifkan kembali akun <strong className="text-(--brand-900)">{confirmModal.user.name}</strong>?
                  Pengguna akan dapat segera masuk kembali ke platform BagiPangan menggunakan kredensial mereka.
                </div>
              )}

              {confirmModal.type === "restore" && (
                <div className="text-sm text-(--text-mid) leading-relaxed">
                  Apakah Anda yakin ingin memulihkan akun <strong className="text-(--brand-900)">{confirmModal.user.name}</strong>?
                  Ini akan membatalkan status penghapusan dan mengaktifkan kembali akun pengguna secara penuh.
                </div>
              )}

              {confirmModal.type === "delete" && (
                <>
                  <div className="text-sm text-(--text-mid) leading-relaxed bg-red-50/50 rounded-xl p-3.5 border border-red-100">
                    <p className="font-semibold text-red-900 flex items-center gap-1.5">
                      Peringatan Penting Data & Privasi
                    </p>
                    <ul className="list-disc pl-4 mt-1.5 space-y-1 text-xs text-red-800">
                      <li>Akun akan masuk ke **masa tenggang (grace period) 7 hari** sebelum dihapus permanen.</li>
                      <li>Selama masa tenggang, login diblokir namun admin dapat memulihkan akun.</li>
                      <li>Setelah 7 hari, **seluruh data profil, foto bukti klaim, file avatar, serta riwayat donasi/klaim akan dihapus secara fisik dan permanen** tanpa opsi pemulihan.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={safeguardChecked}
                        onChange={(e) => setSafeguardChecked(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-xs text-(--text-mid) leading-relaxed">
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
                        className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-center font-bold tracking-widest uppercase"
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
                className="rounded-full border border-(--brand-150) hover:bg-(--brand-50) text-(--brand-800) px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
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
                className={`inline-flex items-center gap-1.5 rounded-full text-white px-5 py-2 text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
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

      {/* Global Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg max-w-sm transition-all duration-300 animate-in slide-in-from-bottom-5 ${
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
