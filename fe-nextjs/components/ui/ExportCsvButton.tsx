"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2 } from "lucide-react";

type ExportState = "idle" | "loading" | "success" | "error";

type Props = {
  /** Next.js API route to fetch, e.g. "/api/donations/mine/export" */
  endpoint: string;
  /** Download filename, e.g. "donasi-saya-2026-05-07.csv" */
  filename: string;
  /** Optional short label. Defaults to "Export CSV" */
  label?: string;
  className?: string;
};

export function ExportCsvButton({ endpoint, filename, label = "Export CSV", className }: Props) {
  const [state, setState] = useState<ExportState>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleClick() {
    if (state === "loading") return;
    abortRef.current?.abort();
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState("loading");
    try {
      const res = await fetch(endpoint, { cache: "no-store", signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      setState("success");
      resetTimerRef.current = setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState("error");
      resetTimerRef.current = setTimeout(() => setState("idle"), 3000);
    }
  }

  const icons: Record<ExportState, React.ReactNode> = {
    idle: <Download className="h-4 w-4" />,
    loading: <Loader2 className="h-4 w-4 animate-spin" />,
    success: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    error: <Download className="h-4 w-4 text-red-500" />,
  };

  const labels: Record<ExportState, string> = {
    idle: label,
    loading: "Mengunduh...",
    success: "Berhasil!",
    error: "Gagal — coba lagi",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      aria-label={labels[state]}
      aria-busy={state === "loading"}
      className={[
        "inline-flex items-center gap-2 rounded-xl border border-[var(--brand-200)]",
        "px-4 py-2.5 text-sm font-semibold text-[var(--brand-700)]",
        "hover:bg-[var(--brand-50)] disabled:opacity-50 transition-colors",
        className ?? "",
      ].join(" ")}
    >
      {icons[state]}
      <span className="hidden sm:inline">{labels[state]}</span>
    </button>
  );
}

export default ExportCsvButton;
