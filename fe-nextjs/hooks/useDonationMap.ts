"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  DonationMapFeatureCollection,
  DonationMapFilters,
} from "@/types/donation-map";

type DonationMapState = {
  data: DonationMapFeatureCollection | null;
  error: string;
  isLoading: boolean;
  isRefreshing: boolean;
  retry: () => void;
};

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { expiresAt: number; data: DonationMapFeatureCollection }>();

function buildPath(filters: DonationMapFilters): string {
  const params = new URLSearchParams();
  params.set("status", filters.status);
  params.set("limit", "500");
  if (filters.category_id) params.set("category_id", filters.category_id);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  return `/donations/map?${params.toString()}`;
}

/**
 * Fetches the donation map GeoJSON payload with a short in-memory cache so
 * filter changes stay responsive without hammering the Laravel endpoint.
 */
export function useDonationMap(filters: DonationMapFilters): DonationMapState {
  const path = useMemo(() => buildPath(filters), [filters]);
  const [data, setData] = useState<DonationMapFeatureCollection | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const dataRef = useRef<DonationMapFeatureCollection | null>(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    const cached = cache.get(path);

    if (cached && cached.expiresAt > Date.now()) {
      queueMicrotask(() => {
        if (cancelled) return;
        setData(cached.data);
        setError("");
        setIsLoading(false);
        setIsRefreshing(false);
      });
      return;
    }

    queueMicrotask(() => {
      if (cancelled) return;
      const hasData = dataRef.current !== null;
      setIsLoading((current) => current || !hasData);
      setIsRefreshing(hasData);
    });

    apiFetch<DonationMapFeatureCollection>(path)
      .then((payload) => {
        if (cancelled) return;
        cache.set(path, { data: payload, expiresAt: Date.now() + CACHE_TTL_MS });
        setData(payload);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Gagal memuat data peta.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, retryNonce]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    retry: () => {
      cache.delete(path);
      setRetryNonce((value) => value + 1);
    },
  };
}
