"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { Search, X, Filter, Calendar, MapPin, Package } from "lucide-react";
import { apiFetch } from "@/lib/api";

const DEFAULT_PER_PAGE = 12;
const KEYWORD_DEBOUNCE_MS = 400;

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "expiry_soon", label: "Segera Kadaluarsa" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "available", label: "Available" },
  { value: "claimed", label: "Claimed" },
  { value: "completed", label: "Completed" },
];

const STATUS_BADGE = {
  approved: { label: "Tersedia", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  claimed: { label: "Diklaim", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "Selesai", tone: "bg-slate-100 text-slate-600 border-slate-200" },
};

function buildQueryString(params) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const str = String(value).trim();
    if (str === "") continue;
    sp.set(key, str);
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

const fetcher = (path) => apiFetch(path);

function formatExpiry(iso) {
  if (!iso) return "Tanpa batas waktu";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DonationsPage() {
  return (
    <Suspense fallback={<PageShell><SkeletonGrid /></PageShell>}>
      <DonationsBrowser />
    </Suspense>
  );
}

function DonationsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read filter values from URL (supports direct link sharing).
  const urlKeyword = searchParams.get("keyword") ?? "";
  const urlCategoryId = searchParams.get("category_id") ?? "";
  const urlLocation = searchParams.get("location") ?? "";
  const urlStatus = searchParams.get("status") ?? "";
  const urlSort = searchParams.get("sort") ?? "newest";
  const urlPage = Number(searchParams.get("page") ?? "1") || 1;

  // Local state for inputs that need debouncing / immediate UI feedback.
  const [keywordInput, setKeywordInput] = useState(urlKeyword);
  const [locationInput, setLocationInput] = useState(urlLocation);

  // Sync local input state when the URL changes from outside (e.g. back/forward).
  useEffect(() => {
    setKeywordInput(urlKeyword);
  }, [urlKeyword]);
  useEffect(() => {
    setLocationInput(urlLocation);
  }, [urlLocation]);

  const updateParams = useCallback(
    (patch, { resetPage = true } = {}) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }
      if (resetPage) next.delete("page");
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Debounce keyword input -> URL.
  const keywordTimerRef = useRef(null);
  useEffect(() => {
    if (keywordInput === urlKeyword) return;
    if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);
    keywordTimerRef.current = setTimeout(() => {
      updateParams({ keyword: keywordInput });
    }, KEYWORD_DEBOUNCE_MS);
    return () => {
      if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);
    };
  }, [keywordInput, urlKeyword, updateParams]);

  // Debounce location input -> URL (same UX rationale as keyword).
  const locationTimerRef = useRef(null);
  useEffect(() => {
    if (locationInput === urlLocation) return;
    if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    locationTimerRef.current = setTimeout(() => {
      updateParams({ location: locationInput });
    }, KEYWORD_DEBOUNCE_MS);
    return () => {
      if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    };
  }, [locationInput, urlLocation, updateParams]);

  // Build the API request key. Memoise so SWR dedupes properly.
  const apiPath = useMemo(() => {
    return `/donations${buildQueryString({
      keyword: urlKeyword,
      category_id: urlCategoryId,
      location: urlLocation,
      status: urlStatus,
      sort: urlSort,
      page: urlPage > 1 ? urlPage : "",
      per_page: DEFAULT_PER_PAGE,
    })}`;
  }, [urlKeyword, urlCategoryId, urlLocation, urlStatus, urlSort, urlPage]);

  const { data, error, isLoading } = useSWR(apiPath, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const { data: categoriesResp } = useSWR("/categories", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60_000,
  });
  const categories = categoriesResp?.data ?? [];

  const items = data?.data ?? [];
  const meta = data?.meta ?? { current_page: 1, last_page: 1, total: 0, per_page: DEFAULT_PER_PAGE };

  const hasActiveFilter =
    Boolean(urlKeyword) ||
    Boolean(urlCategoryId) ||
    Boolean(urlLocation) ||
    Boolean(urlStatus) ||
    urlSort !== "newest";

  const clearAll = () => {
    setKeywordInput("");
    setLocationInput("");
    router.push(pathname, { scroll: false });
  };

  return (
    <PageShell>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--brand-950)]">
          Jelajahi Donasi
        </h1>
        <p className="mt-1 text-sm text-[var(--text-mid)]">
          Cari donasi makanan surplus berdasarkan kata kunci, kategori, atau lokasi.
        </p>
      </header>

      {/* Search bar */}
      <div className="mb-3">
        <label className="relative block">
          <span className="sr-only">Cari donasi</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-mid)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Cari berdasarkan judul atau deskripsi..."
            aria-label="Cari donasi"
            className="w-full rounded-xl border border-[var(--brand-100)] bg-white py-2.5 pl-9 pr-9 text-sm text-[var(--brand-950)] placeholder:text-[var(--text-mid)]/60 focus:border-[var(--brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
          />
          {keywordInput && (
            <button
              type="button"
              onClick={() => setKeywordInput("")}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-mid)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>
      </div>

      {/* Filter bar */}
      <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <FilterField label="Kategori" icon={<Filter className="h-3.5 w-3.5" />}>
          <select
            value={urlCategoryId}
            onChange={(e) => updateParams({ category_id: e.target.value })}
            className="w-full rounded-xl border border-[var(--brand-100)] bg-white px-3 py-2.5 text-sm focus:border-[var(--brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
          >
            <option value="">Semua kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Lokasi" icon={<MapPin className="h-3.5 w-3.5" />}>
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Mis. Jakarta"
            aria-label="Filter lokasi"
            className="w-full rounded-xl border border-[var(--brand-100)] bg-white px-3 py-2.5 text-sm placeholder:text-[var(--text-mid)]/60 focus:border-[var(--brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
          />
        </FilterField>

        <FilterField label="Status" icon={<Package className="h-3.5 w-3.5" />}>
          <select
            value={urlStatus}
            onChange={(e) => updateParams({ status: e.target.value })}
            className="w-full rounded-xl border border-[var(--brand-100)] bg-white px-3 py-2.5 text-sm focus:border-[var(--brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Urutkan" icon={<Calendar className="h-3.5 w-3.5" />}>
          <select
            value={urlSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="w-full rounded-xl border border-[var(--brand-100)] bg-white px-3 py-2.5 text-sm focus:border-[var(--brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-50)]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FilterField>
      </div>

      {hasActiveFilter && (
        <div className="mb-5 flex items-center justify-between">
          <span className="text-xs text-[var(--text-mid)]">
            {meta.total} hasil ditemukan
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-100)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--brand-700)] hover:border-[var(--brand-300)]"
          >
            <X className="h-3 w-3" />
            Bersihkan filter
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {error?.message ?? "Gagal memuat donasi"}
        </div>
      )}

      {isLoading && !data && <SkeletonGrid />}

      {data && items.length === 0 && !error && <EmptyState onReset={hasActiveFilter ? clearAll : null} />}

      {items.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <DonationCard key={d.id} donation={d} />
          ))}
        </div>
      )}

      {data && meta.last_page > 1 && (
        <Pagination
          currentPage={meta.current_page}
          lastPage={meta.last_page}
          onChange={(p) => updateParams({ page: p > 1 ? p : "" }, { resetPage: false })}
        />
      )}
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {children}
    </main>
  );
}

function FilterField({ label, icon, children }) {
  return (
    <label className="block">
      <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-mid)]">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function DonationCard({ donation }) {
  const badge = STATUS_BADGE[donation.status] ?? {
    label: donation.status,
    tone: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const thumb = donation.photo_thumbnail ?? "/images/donations/catering.jpg";

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--brand-100)] bg-white shadow-[var(--shadow-card)] transition-all hover:border-[var(--brand-300)] hover:shadow-[var(--shadow-soft)]">
      <div className="relative h-40 bg-[var(--brand-50)]">
        <Image
          src={thumb}
          alt={donation.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute right-3 top-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.tone}`}
        >
          {badge.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-base font-bold text-[var(--brand-950)]">
          {donation.title}
        </h3>
        {donation.category && (
          <p className="mt-1 text-xs font-medium text-[var(--brand-700)]">
            {donation.category.name}
          </p>
        )}
        <div className="mt-3 space-y-1.5 text-sm text-[var(--brand-950)]">
          <div className="flex items-center gap-2 text-[var(--text-mid)]">
            <MapPin className="h-3.5 w-3.5 text-[var(--brand-600)]" />
            <span className="line-clamp-1">{donation.donor_city ?? "Lokasi tidak tersedia"}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-mid)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--brand-600)]" />
            <span>{formatExpiry(donation.expiry_date)}</span>
          </div>
        </div>
        <Link
          href={`/receiver/donations/${donation.id}`}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-600)] px-3 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--brand-700)]"
        >
          Lihat detail
        </Link>
      </div>
    </article>
  );
}

function Pagination({ currentPage, lastPage, onChange }) {
  // Page numbers shown: a sliding window of up to 5 around currentPage.
  const windowSize = 5;
  const start = Math.max(1, Math.min(currentPage - 2, lastPage - windowSize + 1));
  const end = Math.min(lastPage, start + windowSize - 1);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      <PageButton disabled={currentPage <= 1} onClick={() => onChange(currentPage - 1)}>
        Previous
      </PageButton>
      {start > 1 && (
        <>
          <PageButton onClick={() => onChange(1)}>1</PageButton>
          {start > 2 && <span className="px-1 text-[var(--text-mid)]">…</span>}
        </>
      )}
      {pages.map((p) => (
        <PageButton key={p} active={p === currentPage} onClick={() => onChange(p)}>
          {p}
        </PageButton>
      ))}
      {end < lastPage && (
        <>
          {end < lastPage - 1 && <span className="px-1 text-[var(--text-mid)]">…</span>}
          <PageButton onClick={() => onChange(lastPage)}>{lastPage}</PageButton>
        </>
      )}
      <PageButton disabled={currentPage >= lastPage} onClick={() => onChange(currentPage + 1)}>
        Next
      </PageButton>
    </nav>
  );
}

function PageButton({ children, onClick, disabled, active }) {
  const base = "inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors";
  const tone = active
    ? "border-[var(--brand-600)] bg-[var(--brand-600)] text-white"
    : "border-[var(--brand-100)] bg-white text-[var(--brand-700)] hover:border-[var(--brand-300)]";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`${base} ${tone} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="rounded-3xl border border-[var(--brand-100)] bg-white p-12 text-center">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)]">
        <Package className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-[var(--brand-950)]">
        Belum ada donasi yang sesuai
      </h2>
      <p className="mt-1 text-sm text-[var(--text-mid)]">
        Coba ubah kata kunci atau hapus filter untuk melihat hasil lebih banyak.
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-700)]"
        >
          Bersihkan filter
        </button>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-[var(--brand-100)] bg-white"
        >
          <div className="h-40 animate-pulse bg-[var(--brand-50)]" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--brand-50)]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--brand-50)]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--brand-50)]" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-[var(--brand-50)]" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-[var(--brand-50)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
