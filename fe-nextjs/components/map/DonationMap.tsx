"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L, { type LatLngBounds } from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

import type { UserLocation } from "@/hooks/useUserGeolocation";
import type { DonationMapFeature } from "@/types/donation-map";
import { createDonationMarker } from "./DonationMarker";
import MapLegend from "./MapLegend";
import UserLocationMarker from "./UserLocationMarker";

function FlyToUserLocationButton({
  location,
  loading,
}: {
  location: UserLocation | null;
  loading: boolean;
}) {
  const map = useMap();
  if (!location && !loading) return null;
  const disabled = !location || loading;
  return (
    <button
      type="button"
      onClick={() => location && map.flyTo([location.lat, location.lng], 15, { animate: true })}
      disabled={disabled}
      title={loading ? "Mendeteksi lokasi..." : "Pergi ke lokasi saya"}
      aria-label={loading ? "Mendeteksi lokasi" : "Pergi ke lokasi saya"}
      className="absolute bottom-6 right-4 z-[500] inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--brand-200,#bbf7d0)] bg-white text-[var(--brand-700,#15803d)] shadow-[0_8px_20px_rgba(15,23,42,0.18)] hover:bg-[var(--brand-50,#f0fdf4)] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-200,#bbf7d0)] border-t-[var(--brand-600,#16a34a)]"
        />
      ) : (
        <LocateFixed className="h-5 w-5" />
      )}
    </button>
  );
}

const INDONESIA_CENTER: [number, number] = [-2.5, 118];
const INDONESIA_ZOOM = 5;

type MarkerWithDonationId = L.Marker & {
  options: L.MarkerOptions & { donationId?: number };
};

function DonationClusterLayer({ features }: { features: DonationMapFeature[] }) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  // Create the cluster group once and attach/detach from the map.
  useEffect(() => {
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 60,
    });
    clusterRef.current = cluster;
    map.addLayer(cluster);

    return () => {
      map.removeLayer(cluster);
      clusterRef.current = null;
    };
  }, [map]);

  // Incrementally diff markers when `features` changes — avoid full clearLayers rebuild.
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    const existingMarkers = cluster.getLayers() as MarkerWithDonationId[];
    const existingIds = new Set<number>();
    for (const layer of existingMarkers) {
      const id = layer.options.donationId;
      if (typeof id === "number") existingIds.add(id);
    }

    const newIds = new Set<number>(features.map((feature) => feature.properties.id));

    // Remove markers that are no longer in the data.
    for (const layer of existingMarkers) {
      const id = layer.options.donationId;
      if (typeof id !== "number" || !newIds.has(id)) {
        cluster.removeLayer(layer);
      }
    }

    // Add markers that aren't already on the cluster.
    for (const feature of features) {
      if (!existingIds.has(feature.properties.id)) {
        cluster.addLayer(createDonationMarker(feature));
      }
    }
  }, [features]);

  return null;
}

function FitDonationBounds({
  bounds,
  resetKey,
}: {
  bounds: LatLngBounds | null;
  resetKey: string;
}) {
  const map = useMap();
  const fittedRef = useRef(false);

  // Reset the "have we fitted yet" flag whenever the filter key changes
  // so a fresh filter run re-fits to the new bounds.
  useEffect(() => {
    fittedRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (!bounds || fittedRef.current) return;
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.setView(bounds.getCenter(), 13, { animate: true });
    } else {
      map.fitBounds(bounds, { padding: [42, 42], maxZoom: 14 });
    }
    fittedRef.current = true;
  }, [bounds, map]);

  return null;
}

export default function DonationMap({
  features,
  userLocation,
  geolocationLoading = false,
  filterKey = "",
}: {
  features: DonationMapFeature[];
  userLocation: UserLocation | null;
  geolocationLoading?: boolean;
  filterKey?: string;
}) {
  const [tileError, setTileError] = useState(false);

  const bounds = useMemo<LatLngBounds | null>(() => {
    if (features.length === 0) return null;
    const points = features.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      return [lat, lng] as [number, number];
    });
    return L.latLngBounds(points);
  }, [features]);

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
        <FitDonationBounds bounds={bounds} resetKey={filterKey} />
        <UserLocationMarker location={userLocation} />
        <FlyToUserLocationButton location={userLocation} loading={geolocationLoading} />
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
