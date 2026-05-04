"use client";

import L from "leaflet";
import { imageForDonation } from "@/lib/donations";
import type { DonationMapFeature } from "@/types/donation-map";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export function createDonationIcon(status: DonationMapFeature["properties"]["status"]): L.DivIcon {
  const color = status === "claimed" ? "#64748b" : "#16a34a";
  const ring = status === "claimed" ? "rgba(100,116,139,0.2)" : "rgba(22,163,74,0.2)";

  return L.divIcon({
    className: "bagi-map-marker",
    html: `
      <div style="position:relative;width:36px;height:44px">
        <div style="position:absolute;left:-2px;top:-2px;width:40px;height:40px;border-radius:999px;background:${ring}"></div>
        <div style="position:absolute;left:3px;top:1px;width:30px;height:30px;background:${color};border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 10px 20px rgba(15,23,42,.24)"></div>
        <div style="position:absolute;left:13px;top:10px;width:10px;height:10px;border-radius:999px;background:#fff"></div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 40],
    popupAnchor: [0, -34],
  });
}

export function createDonationMarker(feature: DonationMapFeature): L.Marker {
  const [lng, lat] = feature.geometry.coordinates;
  const props = feature.properties;
  const image = props.thumbnail_url || imageForDonation({
    id: props.id,
    title: props.title,
    description: props.description ?? "",
  });

  const marker = L.marker([lat, lng], {
    icon: createDonationIcon(props.status),
    title: props.title,
  });

  marker.bindPopup(`
    <article style="width:240px;font-family:inherit">
      <img src="${escapeHtml(image)}" alt="" style="height:96px;width:100%;object-fit:cover;border-radius:10px;margin-bottom:10px;background:#ecfdf5" />
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
        <h3 style="margin:0;color:#0f2419;font-size:14px;line-height:1.3;font-weight:800">${escapeHtml(props.title)}</h3>
        <span style="border-radius:999px;background:${props.status === "claimed" ? "#f1f5f9" : "#dcfce7"};color:${props.status === "claimed" ? "#475569" : "#15803d"};font-size:10px;font-weight:800;padding:3px 7px;text-transform:uppercase">${props.status === "claimed" ? "Diklaim" : "Tersedia"}</span>
      </div>
      <dl style="margin:10px 0 12px;display:grid;gap:5px;color:#475569;font-size:12px">
        <div><strong style="color:#163222">Kategori:</strong> ${escapeHtml(props.category)}</div>
        <div><strong style="color:#163222">Porsi:</strong> ${escapeHtml(props.portion)} tersisa</div>
        <div><strong style="color:#163222">Donatur:</strong> ${escapeHtml(props.donor_name)}</div>
        <div><strong style="color:#163222">Kedaluwarsa:</strong> ${escapeHtml(formatDate(props.expired_at))}</div>
      </dl>
      <a href="${escapeHtml(props.detail_url)}" style="display:block;border-radius:10px;background:#16a34a;color:#fff;padding:9px 12px;text-align:center;text-decoration:none;font-size:12px;font-weight:800">Lihat Detail</a>
    </article>
  `);

  return marker;
}
