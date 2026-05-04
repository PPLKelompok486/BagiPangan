"use client";

import { Suspense, useDeferredValue, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2, LocateFixed, MapPin, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useDonationMap } from "@/hooks/useDonationMap";
import { useUserGeolocation } from "@/hooks/useUserGeolocation";
import type { DonationMapFilters, DonationMapStatus } from "@/types/donation-map";
import MapFilterPanel from "./MapFilterPanel";

const DonationMap = dynamic(() => import("./DonationMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

type CategoryOption = {
  id: number;
  name: string;
};

function normalizeStatus(value: string | null): DonationMapStatus {
  return value === "claimed" ? "claimed" : "available";
}

function filtersFromParams(params: URLSearchParams): DonationMapFilters {
  return {
    category_id: params.get("category_id") ?? "",
    status: normalizeStatus(params.get("status")),
    q: params.get("q") ?? "",
  };
}

export default function DonationMapPageContent() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <DonationMapScreen />
    </Suspense>
  );
}

function DonationMapScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<DonationMapFilters>(() => filtersFromParams(searchParams));
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const deferredQuery = useDeferredValue(filters.q);
  const requestFilters = useMemo(
    () => ({ ...filters, q: deferredQuery }),
    [filters, deferredQuery],
  );
  const { data, error, isLoading, isRefreshing, retry } = useDonationMap(requestFilters);
  const { location, error: locationError, isLocating } = useUserGeolocation();

  useEffect(() => {
    apiFetch<{ data: CategoryOption[] }>("/donations/categories")
      .then((payload) => setCategories(payload.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category_id) params.set("category_id", filters.category_id);
    if (filters.status !== "available") params.set("status", filters.status);
    if (filters.q.trim()) params.set("q", filters.q.trim());
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [filters, pathname, router]);

  const features = data?.features ?? [];
  const hasActiveFilter = filters.category_id !== "" || filters.status !== "available" || filters.q.trim() !== "";
  const emptyMessage = hasActiveFilter
    ? "Tidak ada donasi yang sesuai dengan filter Anda."
    : "Data lokasi tidak ditemukan.";

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--brand-700)]">
            Visualisasi lokasi
          </span>
          <h1 className="bagi-display mt-1 text-2xl font-semibold text-[var(--brand-950)] sm:text-3xl">
            Peta Donasi
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-mid)]">
            Lihat sebaran donasi pangan aktif, gunakan filter untuk mempersempit area, lalu buka detail dari penanda peta.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-[var(--brand-100)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text-mid)]">
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-600)]" />
          ) : location ? (
            <LocateFixed className="h-4 w-4 text-blue-600" />
          ) : (
            <MapPin className="h-4 w-4 text-[var(--brand-600)]" />
          )}
          {location ? "Lokasi Anda aktif" : isLocating ? "Mencari lokasi..." : "Peta Indonesia"}
        </div>
      </header>

      {locationError && (
        <div role="status" className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {locationError}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <MapFilterPanel
          filters={filters}
          categories={categories}
          isOpen={filterOpen}
          onToggle={() => setFilterOpen((value) => !value)}
          onChange={setFilters}
          onReset={() => setFilters({ category_id: "", status: "available", q: "" })}
        />

        <section className="relative overflow-hidden rounded-2xl border border-[var(--brand-100)] bg-white shadow-[var(--shadow-card)]">
          <div className="h-[60vh] min-h-[420px] lg:h-[calc(100vh-220px)]">
            <DonationMap features={features} userLocation={location} />
          </div>

          {(isLoading || isRefreshing) && (
            <div className="absolute inset-0 z-[600] flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[var(--brand-700)] shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat data peta...
              </div>
            </div>
          )}

          {!isLoading && error && (
            <div className="absolute inset-0 z-[610] flex items-center justify-center bg-white/80 p-4 backdrop-blur-sm">
              <div role="alert" className="max-w-sm rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700 shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
                <AlertTriangle className="mx-auto mb-2 h-6 w-6" />
                <p className="font-bold">Gagal memuat data peta.</p>
                <p className="mt-1">{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Coba lagi
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && features.length === 0 && (
            <div className="absolute inset-x-4 top-4 z-[600] rounded-2xl border border-[var(--brand-100)] bg-white/95 px-4 py-3 text-sm font-bold text-[var(--brand-950)] shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur">
              {emptyMessage}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-[60vh] min-h-[420px] items-center justify-center rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)]">
      <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[var(--brand-700)] shadow-[var(--shadow-card)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat peta...
      </div>
    </div>
  );
}
