"use client";

export default function MapLegend() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-2xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-[var(--brand-950)] shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#16a34a]" />
          Tersedia
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
          Diklaim
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
          Anda
        </span>
      </div>
    </div>
  );
}
