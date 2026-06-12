"use client";

import { useEffect, useState } from "react";

export type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

type UserGeolocationState = {
  location: UserLocation | null;
  error: string;
  isLocating: boolean;
};

/**
 * Requests browser geolocation on every map page mount and returns a normalized location object.
 * The map can continue with the Indonesia default center when permission fails.
 */
export function useUserGeolocation(): UserGeolocationState {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState("");
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      queueMicrotask(() => {
        setError("Browser tidak mendukung deteksi lokasi.");
        setIsLocating(false);
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setError("");
        setIsLocating(false);
      },
      () => {
        setError("Aktifkan lokasi untuk melihat donasi terdekat.");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8_000,
      },
    );
  }, []);

  return { location, error, isLocating };
}
