"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Package, RefreshCw, AlertTriangle } from "lucide-react";

import { ApiError, apiFetch } from "@/lib/api";
import { type Donation } from "@/lib/donations";

const EASE_OUT_QUART: [number, number, number, number] = [0.16, 1, 0.3, 1];

type GeoResult = { lat: number; lng: number } | null;
type GeocodingState = "idle" | "geocoding" | "done";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

async function geocodeAddress(address: string): Promise<GeoResult> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "id");

    const res = await fetch(url.toString(), {
      headers: { "Accept-Language": "id" },
    });

    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export default function DonationMapPage() {
  const [donations, setDonations] = useState<Donation[] | null>(null);
  const [error, setError] = useState<string>("");
  const [geoMap, setGeoMap] = useState<Map<number, GeoResult>>(new Map());
  const [geocodingState, setGeocodingState] = useState<GeocodingState>("idle");
  const [geocodedCount, setGeocodedCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDonations = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Donation[] }>("/donations");
      setDonations(res.data);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat donasi");
      setDonations([]);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  useEffect(() => {
    if (!donations || donations.length === 0) {
      setGeocodingState(donations && donations.length === 0 ? "done" : "idle");
      setGeoMap(new Map());
      setGeocodedCount(0);
      return;
    }

    let cancelled = false;
    setGeocodingState("geocoding");
    setGeocodedCount(0);
    const results = new Map<number, GeoResult>();

    (async () => {
      for (const donation of donations) {
        if (cancelled) return;
        const geo = await geocodeAddress(donation.pickup_address);
        if (cancelled) return;
        results.set(donation.id, geo);
        setGeocodedCount((c) => c + 1);
        await new Promise((r) => setTimeout(r, 1100));
      }
      if (!cancelled) {
        setGeoMap(results);
        setGeocodingState("done");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [donations]);

  const total = donations?.length ?? 0;
  const foundCount = useMemo(() => {
    let n = 0;
    geoMap.forEach((v) => {
      if (v) n += 1;
    });
    return n;
  }, [geoMap]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setDonations(null);
    setGeoMap(new Map());
    setGeocodingState("idle");
    await fetchDonations();
    setTimeout(() => setRefreshing(false), 600);
  }, [refreshing, fetchDonations]);

  const allFailed =
    geocodingState === "done" && total > 0 && foundCount === 0;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT_QUART }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--brand-700)]">
            Visualisasi
          </span>
          <h1 className="bagi-display mt-1 text-2xl sm:text-3xl font-semibold text-[var(--brand-950)]">
            Peta donasi tersedia
          </h1>
          <p className="mt-1 text-sm text-[var(--text-mid)] max-w-xl">
            Lihat sebaran donasi di sekitar Anda. Klik penanda untuk melihat detail dan klaim.
          </p>
        </div>

        <motion.button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || geocodingState === "geocoding"}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[var(--brand-100)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-700)] hover:border-[var(--brand-300)] disabled:opacity-60"
        >
          <motion.span
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={
              refreshing
                ? { duration: 0.8, ease: "linear", repeat: Infinity }
                : { duration: 0.3 }
            }
            className="flex"
          >
            <RefreshCw className="h-4 w-4" />
          </motion.span>
          Muat ulang
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {geocodingState === "geocoding" && total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-center gap-3 rounded-2xl border border-[var(--brand-100)] bg-white px-4 py-3 shadow-[var(--shadow-card)]"
          >
            <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-600)]" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--brand-950)]">
                Menemukan lokasi ({geocodedCount}/{total})…
              </p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--brand-50)]">
                <motion.div
                  className="h-full bg-[var(--brand-600)]"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${total === 0 ? 0 : (geocodedCount / total) * 100}%`,
                  }}
                  transition={{ duration: 0.4, ease: EASE_OUT_QUART }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {allFailed && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Tidak dapat menemukan lokasi untuk donasi yang tersedia. Silakan
            periksa daftar di{" "}
            <Link
              href="/receiver/dashboard"
              className="font-semibold underline underline-offset-2"
            >
              halaman donasi
            </Link>
            .
          </p>
        </div>
      )}

      {donations === null && <MapSkeleton />}

      {donations && donations.length === 0 && !error && (
        <EmptyState />
      )}

      {donations && donations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
          className="relative z-0 overflow-hidden rounded-3xl border border-[var(--brand-100)] shadow-[var(--shadow-card)]"
          style={{ height: "min(70vh, 640px)", minHeight: 420 }}
        >
          <LeafletMap donations={donations} geoMap={geoMap} />
        </motion.div>
      )}

      {donations && donations.length > 0 && geocodingState === "done" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[var(--text-mid)]">
          <p>Klik penanda untuk melihat detail donasi.</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: "#2d7a4f" }}
              />
              Tersedia
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: "#dc2626" }}
              />
              Mendesak (&lt; 6 jam)
            </span>
            {foundCount < total && (
              <span>
                {foundCount}/{total} lokasi ditemukan
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MapSkeleton() {
  return (
    <div
      className="flex items-center justify-center rounded-3xl border border-[var(--brand-100)] bg-[var(--brand-50)]"
      style={{ height: "min(70vh, 640px)", minHeight: 420 }}
    >
      <div className="flex flex-col items-center gap-2 text-[var(--text-mid)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)]" />
        <p className="text-sm font-medium">Memuat peta…</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-[var(--brand-100)] bg-white p-12 text-center"
    >
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)]">
        <MapPin className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-[var(--brand-950)]">
        Belum ada donasi tersedia
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--text-mid)]">
        Begitu donatur baru memposting, penanda akan muncul di peta ini.
      </p>
      <Link
        href="/receiver/dashboard"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-700)]"
      >
        <Package className="h-4 w-4" />
        Buka daftar donasi
      </Link>
    </motion.div>
  );
}
