"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

type Props = {
  endpoint: string;
  filenamePrefix: string;
  label?: string;
  className?: string;
};

export default function ExportCsvButton({ endpoint, filenamePrefix, label = "Export CSV", className }: Props) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengunduh laporan");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunduh");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        title={label}
        aria-label={label}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-xl border border-[var(--brand-200,#bbf7d0)] px-3 py-2.5 text-sm font-semibold text-[var(--brand-700,#15803d)] hover:bg-[var(--brand-50,#f0fdf4)] disabled:opacity-50 sm:px-4"
        }
      >
        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        <span className="hidden sm:inline">{label}</span>
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
