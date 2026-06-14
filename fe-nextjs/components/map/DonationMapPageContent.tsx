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
import { PageHeader } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/section-card";

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

type DonationMapPageContentProps = {
  context?: DonationMapFilters["context"];
  /** When embedded (e.g. inside the dashboard's own card), skip the page header and outer card chrome. */
  embedded?: boolean;
};

export default function DonationMapPageContent({ context = "receiver", embedded = false }: DonationMapPageContentProps) {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <DonationMapScreen context={context} embedded={embedded} />
    </Suspense>
  );
}

function DonationMapScreen({ context, embedded }: { context: DonationMapFilters["context"]; embedded: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<DonationMapFilters>(() => filtersFromParams(searchParams));
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const deferredQuery = useDeferredValue(filters.q);
  const requestFilters = useMemo(
    () => ({ ...filters, q: deferredQuery, context }),
    [filters, deferredQuery, context],
  );
  const { data, error, isLoading, isRefreshing, retry } = useDonationMap(requestFilters);
  const { location, error: locationError, isLocating } = useUserGeolocation();

  useEffect(() => {
    apiFetch<CategoryOption[] | { data?: CategoryOption[] }>("/donations/categories")
      .then((payload) => {
        if (Array.isArray(payload)) {
          setCategories(payload);
          return;
        }
        setCategories(Array.isArray(payload.data) ? payload.data : []);
      })
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
  const totalApproved = data?.meta?.total_approved ?? 0;
  const withoutCoords = data?.meta?.without_coords ?? 0;
  const emptyMessage = totalApproved > 0 && withoutCoords === totalApproved
    ? `Ada ${totalApproved} donasi tersedia, namun belum ada yang memiliki koordinat lokasi.`
    : hasActiveFilter
      ? "Tidak ada donasi yang sesuai dengan filter Anda."
      : "Belum ada donasi tersedia di peta.";

  const locationBadge = (
    <div className="flex items-center gap-2 rounded-2xl border border-(--brand-100) bg-white px-3 py-2 text-xs font-semibold text-(--text-mid)">
      {isLocating ? (
        <Loader2 className="h-4 w-4 animate-spin text-(--brand-600)" />
      ) : location ? (
        <LocateFixed className="h-4 w-4 text-(--brand-600)" />
      ) : (
        <MapPin className="h-4 w-4 text-(--brand-600)" />
      )}
      {location ? "Lokasi Anda aktif" : isLocating ? "Mencari lokasi..." : "Peta Indonesia"}
    </div>
  );

  const errorBanner = locationError ? (
    <div role="status" className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      {locationError}
    </div>
  ) : null;

  const mapGrid = (
    <div className="grid h-full gap-0 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="p-4 border-b border-(--brand-100) lg:border-b-0 lg:border-r lg:border-(--brand-100)">
            <MapFilterPanel
              filters={filters}
              categories={categories}
              isOpen={filterOpen}
              onToggle={() => setFilterOpen((value) => !value)}
              onChange={setFilters}
              onReset={() => setFilters({ category_id: "", status: "available", q: "" })}
            />
          </div>

          <section className="relative overflow-hidden">
            <div className="h-[60vh] min-h-[420px] lg:h-[calc(100vh-220px)]">
              <DonationMap features={features} userLocation={location} />
            </div>

            {(isLoading || isRefreshing) && (
              <div className="absolute inset-0 z-[600] flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-(--brand-700) shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
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
              <div className="absolute inset-x-4 top-4 z-[600] rounded-2xl border border-(--brand-100) bg-white/95 px-4 py-3 text-sm font-bold text-(--brand-900) shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur">
                {emptyMessage}
              </div>
            )}
          </section>
        </div>
  );

  if (embedded) {
    return (
      <div className="flex h-full flex-col gap-3">
        {errorBanner}
        <div className="flex-1 overflow-hidden">{mapGrid}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb="Visualisasi lokasi"
        title="Peta Donasi"
        description="Lihat sebaran donasi pangan aktif, gunakan filter untuk mempersempit area, lalu buka detail dari penanda peta."
        actions={locationBadge}
      />
      {errorBanner}
      <SectionCard className="p-0 overflow-hidden">{mapGrid}</SectionCard>
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
