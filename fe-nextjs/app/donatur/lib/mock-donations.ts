export type DonorDonationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "claimed"
  | "completed"
  | "cancelled";

export type ApiClaimReceiver = {
  id: number;
  name: string;
  organization?: string | null;
  city?: string | null;
};

export type ApiDonationClaim = {
  id: number;
  status: string;
  receiver?: ApiClaimReceiver | null;
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
  status: DonorDonationStatus;
  active_claims_count?: number;
  created_at: string;
  updated_at: string;
  category?: { id: number; name: string } | null;
  claims?: ApiDonationClaim[];
};

export type DonorDonation = {
  id: number;
  title: string;
  description: string;
  quantity: string;
  pickup_address: string;
  pickup_time: string; // ISO
  status: DonorDonationStatus;
  active_claims_count: number;
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

export const STATUS_LABEL: Record<DonorDonationStatus, string> = {
  pending: "Menunggu review",
  approved: "Aktif",
  rejected: "Ditolak",
  claimed: "Diklaim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_TONE: Record<DonorDonationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)]",
  rejected: "bg-red-50 text-red-700 border-red-200",
  claimed: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

export const STATUS_SUMMARY: Record<DonorDonationStatus, string> = {
  pending: "Menunggu verifikasi admin sebelum donasi tampil untuk penerima.",
  approved: "Donasi sudah tayang dan bisa diklaim penerima.",
  rejected: "Donasi ditolak admin. Periksa alasan penolakan sebelum membuat ulang.",
  claimed: "Penerima sudah mengajukan klaim. Tunggu proses penjemputan dan bukti selesai.",
  completed: "Donasi sudah selesai disalurkan dan bukti pengambilan tercatat.",
  cancelled: "Donasi dibatalkan dan tidak lagi tersedia untuk penerima.",
};

export function donorStatusSummary(status: DonorDonationStatus, activeClaimsCount = 0): string {
  if (status === "claimed" && activeClaimsCount > 0) {
    return `${activeClaimsCount} penerima sedang memproses donasi ini.`;
  }

  if (status === "completed" && activeClaimsCount > 0) {
    return `${activeClaimsCount} klaim selesai tercatat untuk donasi ini.`;
  }

  return STATUS_SUMMARY[status];
}

function resolvePickupTime(donation: ApiDonation): string {
  return donation.available_until ?? donation.available_from ?? donation.created_at;
}

function resolvePickupAddress(donation: ApiDonation): string {
  const parts = [donation.location_address, donation.location_city].filter(Boolean);
  return parts.join(", ") || donation.location_city || "Lokasi belum diisi";
}

export function mapApiDonationToDonor(donation: ApiDonation): DonorDonation {
  // The backend returns the active claims (latest first) with their receiver.
  // Surface the most recent claimant for the "Komunitas penerima" card.
  const claimant = donation.claims?.find((claim) => claim.receiver)?.receiver ?? null;

  return {
    id: donation.id,
    title: donation.title,
    description: donation.description,
    quantity: `${donation.portion_count} porsi`,
    pickup_address: resolvePickupAddress(donation),
    pickup_time: resolvePickupTime(donation),
    status: donation.status,
    active_claims_count: donation.active_claims_count ?? 0,
    created_at: donation.created_at,
    estimated_meals: donation.portion_count,
    receiver: claimant
      ? {
          name: claimant.name,
          org: claimant.organization ?? claimant.city ?? undefined,
        }
      : null,
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
