export type DonationStatus = "available" | "claimed" | "completed" | "cancelled";

export type DonationDonor = {
  id: number;
  name: string;
  city?: string | null;
  phone?: string | null;
};

export type Donation = {
  id: number;
  donor_id: number;
  receiver_id: number | null;
  title: string;
  description: string;
  quantity: string;
  pickup_address: string;
  pickup_time: string;
  status: DonationStatus;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
  donor?: DonationDonor;
  receiver?: { id: number; name: string } | null;
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
  available: "Tersedia",
  claimed: "Diklaim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_TONE: Record<DonationStatus, string> = {
  available: "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)]",
  claimed: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};
