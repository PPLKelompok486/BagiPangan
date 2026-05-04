"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

import type { UserLocation } from "@/hooks/useUserGeolocation";
import type { DonationMapFeature } from "@/types/donation-map";
import { createDonationMarker } from "./DonationMarker";
import MapLegend from "./MapLegend";
import UserLocationMarker from "./UserLocationMarker";

const INDONESIA_CENTER: [number, number] = [-2.5, 118];
const INDONESIA_ZOOM = 5;

function DonationClusterLayer({ features }: { features: DonationMapFeature[] }) {
  const map = useMap();

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 48,
    });

    for (const feature of features) {
      cluster.addLayer(createDonationMarker(feature));
    }

    map.addLayer(cluster);

    return () => {
      map.removeLayer(cluster);
    };
  }, [features, map]);

  return null;
}

function FitDonationBounds({
  features,
  userLocation,
}: {
  features: DonationMapFeature[];
  userLocation: UserLocation | null;
}) {
  const map = useMap();
  const bounds = useMemo(() => {
    const points = features.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      return [lat, lng] as [number, number];
    });
    return points.length > 0 ? L.latLngBounds(points) : null;
  }, [features]);

  useEffect(() => {
    if (userLocation || !bounds) return;
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.setView(bounds.getCenter(), 13, { animate: true });
      return;
    }
    map.fitBounds(bounds, { padding: [42, 42], maxZoom: 14 });
  }, [bounds, map, userLocation]);

  return null;
}

export default function DonationMap({
  features,
  userLocation,
}: {
  features: DonationMapFeature[];
  userLocation: UserLocation | null;
}) {
  const [tileError, setTileError] = useState(false);

  return (
    <div className="relative h-full min-h-[60vh] w-full overflow-hidden rounded-2xl" data-testid="donation-map">
      <MapContainer
        center={INDONESIA_CENTER}
        zoom={INDONESIA_ZOOM}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: (event) => {
              console.warn("Map tile failed to load", event);
              setTileError(true);
            },
          }}
        />
        <DonationClusterLayer features={features} />
        <FitDonationBounds features={features} userLocation={userLocation} />
        <UserLocationMarker location={userLocation} />
      </MapContainer>

      <MapLegend />

      {tileError && (
        <div role="status" className="absolute right-4 top-4 z-[500] max-w-xs rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
          Sebagian tile peta gagal dimuat. Data donasi tetap tersedia.
        </div>
      )}

      <style jsx global>{`
        @keyframes bagi-user-pulse {
          0% { transform: scale(.8); opacity: .85; }
          100% { transform: scale(2.1); opacity: 0; }
        }

        .leaflet-popup-content-wrapper {
          border-radius: 16px;
        }

        .leaflet-popup-content {
          margin: 12px;
        }
      `}</style>
    </div>
  );
}
