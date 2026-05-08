export type DonationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "claimed"
  | "completed"
  | "cancelled";

export type PaginatedDonations = {
  data: ApiDonation[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type ApiDonation = {
  id: number;
  title: string;
  description: string;
  location_city: string;
  location_address: string | null;
  available_from: string | null;
  available_until: string | null;
  portion_count: number;
  status: DonationStatus;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    city?: string | null;
    phone?: string | null;
  } | null;
  category?: { id: number; name: string } | null;
};

export type DonationDonor = {
  id: number;
  name: string;
  city?: string | null;
  phone?: string | null;
};

export type Donation = {
  id: number;
  title: string;
  description: string;
  quantity: string;
  pickup_address: string;
  pickup_time: string;
  status: DonationStatus;
  created_at: string;
  updated_at: string;
  donor?: DonationDonor;
  category?: { id: number; name: string } | null;
};

export type ClaimStatus = "requested" | "approved" | "rejected" | "completed";

export type ApiClaim = {
  id: number;
  status: ClaimStatus;
  proof_image_url: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  donation: ApiDonation;
};

export type Claim = {
  id: number;
  status: ClaimStatus;
  proof_image_url: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  donation: Donation;
};

export function formatPickupTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const STATUS_LABEL: Record<DonationStatus, string> = {
  pending: "Menunggu review",
  approved: "Tersedia",
  rejected: "Ditolak",
  claimed: "Diklaim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_TONE: Record<DonationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)]",
  rejected: "bg-red-50 text-red-700 border-red-200",
  claimed: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const DONATION_IMAGE_MAP: Array<[RegExp, string]> = [
  [/nasi|rice|bento|kotak/i, "/images/donations/nasi-kotak.jpg"],
  [/roti|bread|baguette/i, "/images/donations/roti-tawar.jpg"],
  [/pisang|banana|buah/i, "/images/donations/pisang.jpg"],
  [/catering|acara|kantor|prasmanan/i, "/images/donations/catering.jpg"],
  [/sayur|tumis|oseng|vegetable/i, "/images/donations/sayur.jpg"],
  [/donat|donut|kue|roll/i, "/images/donations/donat.jpg"],
];

const DONATION_IMAGE_FALLBACK = [
  "/images/donations/catering.jpg",
  "/images/donations/nasi-kotak.jpg",
  "/images/donations/sayur.jpg",
];

function resolvePickupTime(donation: ApiDonation): string {
  return donation.available_until ?? donation.available_from ?? donation.created_at;
}

function resolvePickupAddress(donation: ApiDonation): string {
  const parts = [donation.location_address, donation.location_city].filter(Boolean);
  return parts.join(", ") || donation.location_city || "Lokasi belum diisi";
}

export function mapApiDonation(donation: ApiDonation): Donation {
  return {
    id: donation.id,
    title: donation.title,
    description: donation.description,
    quantity: `${donation.portion_count} porsi`,
    pickup_address: resolvePickupAddress(donation),
    pickup_time: resolvePickupTime(donation),
    status: donation.status,
    created_at: donation.created_at,
    updated_at: donation.updated_at,
    donor: donation.user
      ? {
          id: donation.user.id,
          name: donation.user.name,
          city: donation.user.city ?? null,
          phone: donation.user.phone ?? null,
        }
      : undefined,
    category: donation.category ?? null,
  };
}

export function mapApiClaim(claim: ApiClaim): Claim {
  return {
    id: claim.id,
    status: claim.status,
    proof_image_url: claim.proof_image_url,
    claimed_at: claim.claimed_at,
    completed_at: claim.completed_at,
    donation: mapApiDonation(claim.donation),
  };
}

export function imageForDonation(donation: { id: number; title: string; description?: string }): string {
  const haystack = `${donation.title} ${donation.description ?? ""}`;
  for (const [pattern, path] of DONATION_IMAGE_MAP) {
    if (pattern.test(haystack)) return path;
  }
  return DONATION_IMAGE_FALLBACK[donation.id % DONATION_IMAGE_FALLBACK.length];
}

/* ========================================================================
 * Donor-specific shapes & helpers (migrated from app/donatur/lib/mock-donations.ts)
 * ======================================================================== */

export type DonorDonationStatus = DonationStatus;

export type DonorDonation = {
  id: number;
  title: string;
  description: string;
  quantity: string;
  pickup_address: string;
  pickup_time: string; // ISO
  status: DonorDonationStatus;
  created_at: string;
  estimated_meals: number;
  receiver?: {
    name: string;
    org?: string;
    avatar_color?: string;
    pickup_eta?: string;
  } | null;
};

export type ImpactEvent = {
  id: string;
  type: "posted" | "claimed" | "picked_up" | "completed";
  donation_title: string;
  actor?: string;
  timestamp: string; // ISO
  meals?: number;
};

export function mapApiDonationToDonor(donation: ApiDonation): DonorDonation {
  return {
    id: donation.id,
    title: donation.title,
    description: donation.description,
    quantity: `${donation.portion_count} porsi`,
    pickup_address: resolvePickupAddress(donation),
    pickup_time: resolvePickupTime(donation),
    status: donation.status,
    created_at: donation.created_at,
    estimated_meals: donation.portion_count,
    receiver: null,
  };
}

export function buildImpactEvents(donations: ApiDonation[]): ImpactEvent[] {
  const events: ImpactEvent[] = [];

  donations.forEach((donation) => {
    events.push({
      id: `posted-${donation.id}`,
      type: "posted",
      donation_title: donation.title,
      timestamp: donation.created_at,
      meals: donation.portion_count,
    });

    if (donation.status === "claimed" || donation.status === "completed") {
      events.push({
        id: `claimed-${donation.id}`,
        type: "claimed",
        donation_title: donation.title,
        timestamp: donation.updated_at,
        meals: donation.portion_count,
      });
    }

    if (donation.status === "completed") {
      events.push({
        id: `completed-${donation.id}`,
        type: "completed",
        donation_title: donation.title,
        timestamp: donation.updated_at,
        meals: donation.portion_count,
      });
    }
  });

  return events.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

/* ========================================================================
 * Date formatting helpers (migrated from donatur pages)
 * ======================================================================== */

/** Format an ISO datetime string as a short locale string (id-ID). */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Returns a relative "X menit lalu" / "X jam lalu" / "dalam X" string. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diffMin = Math.round((Date.now() - t) / 60_000);
  if (Math.abs(diffMin) < 1) return "baru saja";
  if (diffMin > 0) {
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const h = Math.round(diffMin / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.round(h / 24);
    return `${d} hari lalu`;
  }
  const fwd = -diffMin;
  if (fwd < 60) return `dalam ${fwd} menit`;
  const h = Math.round(fwd / 60);
  if (h < 24) return `dalam ${h} jam`;
  const d = Math.round(h / 24);
  return `dalam ${d} hari`;
}
