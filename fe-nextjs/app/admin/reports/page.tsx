"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";

type Donor = {
  id: number;
  name: string;
  email: string;
  organization?: string | null;
  company_name?: string | null;
  city?: string | null;
};

type DonorsResponse = {
  message: string;
  data: Donor[];
};

type Toast = { kind: "success" | "error"; message: string } | null;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Semua status" },
  { value: "pending", label: "Menunggu Moderasi" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
  { value: "claimed", label: "Diklaim" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

function todayYmd(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function firstOfMonthYmd(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState<string>(firstOfMonthYmd());
  const [dateTo, setDateTo] = useState<string>(todayYmd());
  const [status, setStatus] = useState<string>("");

  const [donorQuery, setDonorQuery] = useState<string>("");
  const [donorResults, setDonorResults] = useState<Donor[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [showDonorDropdown, setShowDonorDropdown] = useState(false);
  const [donorLoading, setDonorLoading] = useState(false);

  const [exporting, setExporting] = useState(false);
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

  // Donor autocomplete
  useEffect(() => {
    if (selectedDonor) return;
    const term = donorQuery.trim();
    const handle = setTimeout(async () => {
      try {
        setDonorLoading(true);
        const url = term
          ? `/api/admin/donors?search=${encodeURIComponent(term)}&limit=10`
          : `/api/admin/donors?limit=10`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          setDonorResults([]);
          return;
        }
        const json = (await res.json()) as DonorsResponse;
        setDonorResults(json.data ?? []);
      } catch {
        setDonorResults([]);
      } finally {
        setDonorLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [donorQuery, selectedDonor]);

  const datesValid = useMemo(() => {
    if (!dateFrom || !dateTo) return false;
    return dateFrom <= dateTo;
  }, [dateFrom, dateTo]);

  async function handleExport() {
    if (exporting) return;

    if (!dateFrom || !dateTo) {
      showToast({ kind: "error", message: "Tanggal mulai dan akhir wajib diisi." });
      return;
    }
    if (dateFrom > dateTo) {
      showToast({
        kind: "error",
        message: "Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir.",
      });
      return;
    }

    const params = new URLSearchParams();
    params.set("date_from", dateFrom);
    params.set("date_to", dateTo);
    if (status) params.set("status", status);
    if (selectedDonor) params.set("donor_id", String(selectedDonor.id));

    const url = `/api/admin/reports/export?${params.toString()}`;

    let objectUrl: string | null = null;
    try {
      setExporting(true);
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        let message = `Gagal mengunduh laporan (${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson && typeof errJson.message === "string") {
            message = errJson.message;
          } else if (errJson && errJson.errors) {
            const first = Object.values(errJson.errors)[0];
            if (Array.isArray(first) && typeof first[0] === "string") {
              message = first[0] as string;
            }
          }
        } catch {
          // ignore
        }
        showToast({ kind: "error", message });
        return;
      }

      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);

      const fileName = `donasi_${dateFrom}_to_${dateTo}.csv`;
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast({ kind: "success", message: "Laporan berhasil diunduh" });
    } catch (err) {
      showToast({
        kind: "error",
        message: err instanceof Error ? err.message : "Gagal mengunduh laporan",
      });
    } finally {
      if (objectUrl) {
        // Revoke after a tick to ensure the download has been initiated
        setTimeout(() => URL.revokeObjectURL(objectUrl as string), 1000);
      }
      setExporting(false);
    }
  }

  function donorLabel(donor: Donor): string {
    const org = donor.organization || donor.company_name;
    return org ? `${donor.name} — ${org}` : donor.name;
  }

  function clearDonor() {
    setSelectedDonor(null);
    setDonorQuery("");
    setDonorResults([]);
  }

  return (
    <>
      <section className="rounded-[1.6rem] border border-(--brand-100) bg-white p-6 shadow-(--shadow-card)">
        <p className="text-xs uppercase tracking-[0.15em] text-(--brand-600)">Manajemen</p>
        <h2 className="bagi-display mt-2 text-4xl text-(--brand-900)">Laporan</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-mid)">
          Unduh laporan donasi dalam format CSV. Pilih rentang tanggal dan filter opsional untuk
          menyesuaikan ekspor.
        </p>
      </section>

      <section className="rounded-[1.6rem] border border-(--brand-100) bg-white p-6 shadow-(--shadow-card) space-y-5">
        <h3 className="text-lg font-semibold text-(--brand-900)">Filter Ekspor</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="block text-sm font-medium text-(--text-dark) mb-1">Dari Tanggal</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-(--brand-100) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-500)"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-(--text-dark) mb-1">Sampai Tanggal</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-(--brand-100) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-500)"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-(--text-dark) mb-1">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-(--brand-100) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-500)"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <div className="block relative">
            <span className="block text-sm font-medium text-(--text-dark) mb-1">Donatur</span>
            {selectedDonor ? (
              <div className="flex items-center justify-between rounded-xl border border-(--brand-100) bg-(--brand-50)/40 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{donorLabel(selectedDonor)}</div>
                  <div className="text-xs text-(--text-mid) truncate">{selectedDonor.email}</div>
                </div>
                <button
                  type="button"
                  onClick={clearDonor}
                  className="ml-2 rounded-full p-1 hover:bg-(--brand-100)"
                  aria-label="Hapus donatur"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={donorQuery}
                  onChange={(e) => setDonorQuery(e.target.value)}
                  onFocus={() => setShowDonorDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDonorDropdown(false), 150)}
                  placeholder="Cari donatur (opsional)"
                  className="w-full rounded-xl border border-(--brand-100) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-500)"
                />
                {showDonorDropdown && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-(--brand-100) bg-white shadow-lg max-h-60 overflow-auto">
                    {donorLoading && (
                      <div className="px-3 py-2 text-xs text-(--text-mid)">Mencari...</div>
                    )}
                    {!donorLoading && donorResults.length === 0 && (
                      <div className="px-3 py-2 text-xs text-(--text-mid)">
                        Tidak ada donatur yang cocok.
                      </div>
                    )}
                    {!donorLoading &&
                      donorResults.map((d) => (
                        <button
                          type="button"
                          key={d.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedDonor(d);
                            setDonorQuery("");
                            setShowDonorDropdown(false);
                          }}
                          className="block w-full text-left px-3 py-2 hover:bg-(--brand-50)"
                        >
                          <div className="text-sm font-medium">{donorLabel(d)}</div>
                          <div className="text-xs text-(--text-mid)">{d.email}</div>
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {!datesValid && dateFrom && dateTo && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir.
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || !datesValid}
            className="inline-flex items-center gap-2 rounded-full bg-(--brand-700) hover:bg-(--brand-800) text-white px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengunduh...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            )}
          </button>
        </div>
      </section>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg max-w-sm ${
            toast.kind === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
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
