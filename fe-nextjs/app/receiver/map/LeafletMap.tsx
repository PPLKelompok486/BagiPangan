"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { type Donation, formatPickupTime } from "@/lib/donations";

export type GeoResult = { lat: number; lng: number } | null;

type LeafletMapProps = {
  donations: Donation[];
  geoMap: Map<number, GeoResult>;
};

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];
const DEFAULT_ZOOM = 11;
const URGENT_HOURS = 6;

function isUrgent(donation: Donation): boolean {
  const h = (Date.parse(donation.pickup_time) - Date.now()) / 3_600_000;
  return h >= 0 && h < URGENT_HOURS;
}

function createDonationIcon(urgent: boolean): L.DivIcon {
  const color = urgent ? "#dc2626" : "#2d7a4f";
  const ring = urgent ? "rgba(220,38,38,0.18)" : "rgba(45,122,79,0.18)";
  return L.divIcon({
    className: "bagi-donation-marker",
    html: `
      <div style="position: relative; width: 36px; height: 44px;">
        <div style="
          position: absolute;
          top: -2px; left: -2px;
          width: 40px; height: 40px;
          border-radius: 50%;
          background: ${ring};
          ${urgent ? "animation: bagi-marker-pulse 1.6s ease-out infinite;" : ""}
        "></div>
        <div style="
          position: absolute;
          left: 2px; top: 0;
          width: 32px; height: 32px;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2.5px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        "></div>
        <div style="
          position: absolute;
          left: 12px; top: 8px;
          width: 12px; height: 12px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 40],
    popupAnchor: [0, -36],
  });
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);
  return null;
}

function DonationPopup({ donation }: { donation: Donation }) {
  const urgent = isUrgent(donation);
  return (
    <div style={{ minWidth: 220, maxWidth: 260, fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#0a1f12", lineHeight: 1.3 }}>
          {donation.title}
        </p>
        {urgent && (
          <span style={{
            flexShrink: 0,
            background: "#fee2e2",
            color: "#b91c1c",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 999,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}>
            Mendesak
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: "#475569", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
        <span aria-hidden="true">📦</span>
        <span>{donation.quantity}</span>
      </p>
      <p style={{ fontSize: 12, color: "#475569", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
        <span aria-hidden="true">👤</span>
        <span>
          {donation.donor?.name ?? "Donatur"}
          {donation.donor?.city ? ` · ${donation.donor.city}` : ""}
        </span>
      </p>
      <p style={{ fontSize: 12, color: "#475569", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
        <span aria-hidden="true">🕐</span>
        <span>{formatPickupTime(donation.pickup_time)}</span>
      </p>
      <a
        href={`/receiver/donations/${donation.id}`}
        style={{
          display: "block",
          background: "#2d7a4f",
          color: "white",
          padding: "8px 12px",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
          textAlign: "center",
          textDecoration: "none",
        }}
      >
        Lihat detail →
      </a>
    </div>
  );
}

export default function LeafletMap({ donations, geoMap }: LeafletMapProps) {
  const points = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (const d of donations) {
      const g = geoMap.get(d.id);
      if (g) out.push([g.lat, g.lng]);
    }
    return out;
  }, [donations, geoMap]);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {donations.map((donation) => {
        const geo = geoMap.get(donation.id);
        if (!geo) return null;
        return (
          <Marker
            key={donation.id}
            position={[geo.lat, geo.lng]}
            icon={createDonationIcon(isUrgent(donation))}
          >
            <Popup>
              <DonationPopup donation={donation} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
