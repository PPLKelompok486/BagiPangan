"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { Marker, Popup, useMap } from "react-leaflet";
import type { UserLocation } from "@/hooks/useUserGeolocation";

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: "bagi-user-marker",
    html: `
      <div style="position:relative;width:30px;height:30px">
        <div style="position:absolute;inset:0;border-radius:999px;background:rgba(37,99,235,.22);animation:bagi-user-pulse 1.8s ease-out infinite"></div>
        <div style="position:absolute;left:7px;top:7px;width:16px;height:16px;border-radius:999px;background:#2563eb;border:3px solid #fff;box-shadow:0 8px 18px rgba(37,99,235,.3)"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function UserLocationMarker({ location }: { location: UserLocation | null }) {
  const map = useMap();
  const icon = useMemo(() => createUserIcon(), []);

  useEffect(() => {
    if (!location) return;
    map.setView([location.lat, location.lng], Math.max(map.getZoom(), 13), { animate: true });
  }, [location, map]);

  if (!location) return null;

  return (
    <Marker position={[location.lat, location.lng]} icon={icon}>
      <Popup>Lokasi Anda saat ini</Popup>
    </Marker>
  );
}
