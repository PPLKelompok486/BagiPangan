// FRONTEND-ONLY MOCK DATA.
// Replace these arrays with real API responses once backend endpoints
// for donor donations exist (e.g. GET /donations/mine?role=donatur).

export type DonorDonationStatus =
  | "draft"
  | "waiting_review"
  | "active"
  | "claimed"
  | "completed";

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
  id: number;
  type: "posted" | "claimed" | "picked_up" | "completed";
  donation_title: string;
  actor?: string;
  timestamp: string; // ISO
  meals?: number;
};

const now = Date.now();
const hours = (h: number) => new Date(now + h * 3_600_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

export const MOCK_DONOR_DONATIONS: DonorDonation[] = [
  {
    id: 101,
    title: "Nasi kotak rapat siang",
    description: "Sisa rapat tim — nasi ayam, sayur, kerupuk. Masih segar, kemasan tertutup.",
    quantity: "12 porsi",
    pickup_address: "Menara Sentra Lt. 7, Jl. Gatot Subroto, Jakarta",
    pickup_time: hours(2.5),
    status: "active",
    created_at: hours(-1.5),
    estimated_meals: 12,
  },
  {
    id: 102,
    title: "Roti tawar & pastry sore",
    description: "Stok bakery yang tidak terjual hari ini, masih dalam kondisi sangat baik.",
    quantity: "30 bungkus",
    pickup_address: "Toko Roti Mawar, Jl. Cikini Raya 88",
    pickup_time: hours(5),
    status: "claimed",
    created_at: hours(-4),
    estimated_meals: 30,
    receiver: {
      name: "Yayasan Senyum Anak",
      org: "Komunitas penerima",
      avatar_color: "from-amber-400 to-amber-600",
      pickup_eta: "Tiba ~15:30",
    },
  },
  {
    id: 103,
    title: "Catering acara kantor",
    description: "Prasmanan acara internal — nasi, rendang, sayur lodeh, buah pisang.",
    quantity: "45 porsi",
    pickup_address: "Auditorium Lt. 2, Jl. Sudirman 12",
    pickup_time: hours(-30),
    status: "completed",
    created_at: daysAgo(2),
    estimated_meals: 45,
    receiver: {
      name: "Dapur Berbagi Cilandak",
      org: "Komunitas penerima",
      avatar_color: "from-emerald-400 to-emerald-600",
      pickup_eta: "Selesai · foto bukti diunggah",
    },
  },
  {
    id: 104,
    title: "Buah pisang segar",
    description: "Kelebihan stok dari distributor harian, masih layak konsumsi 2 hari ke depan.",
    quantity: "8 sisir",
    pickup_address: "Pasar Mayestik Blok C-12",
    pickup_time: hours(20),
    status: "waiting_review",
    created_at: hours(-0.5),
    estimated_meals: 24,
  },
  {
    id: 105,
    title: "Donat & kue manis",
    description: "Stok display sore yang masih sangat layak. Mohon dijemput dengan kotak/kantong sendiri.",
    quantity: "40 buah",
    pickup_address: "Cafe Sudut, Jl. Kemang Raya 5",
    pickup_time: hours(7),
    status: "draft",
    created_at: hours(-0.2),
    estimated_meals: 18,
  },
];

export const MOCK_IMPACT_EVENTS: ImpactEvent[] = [
  {
    id: 1,
    type: "posted",
    donation_title: "Donat & kue manis",
    timestamp: hours(-0.2),
  },
  {
    id: 2,
    type: "claimed",
    donation_title: "Roti tawar & pastry sore",
    actor: "Yayasan Senyum Anak",
    timestamp: hours(-1),
  },
  {
    id: 3,
    type: "completed",
    donation_title: "Catering acara kantor",
    actor: "Dapur Berbagi Cilandak",
    timestamp: hours(-26),
    meals: 45,
  },
  {
    id: 4,
    type: "picked_up",
    donation_title: "Sayur tumis & nasi merah",
    actor: "Komunitas Anak Jalanan Tebet",
    timestamp: daysAgo(2),
    meals: 18,
  },
  {
    id: 5,
    type: "completed",
    donation_title: "Nasi kotak event launch",
    actor: "Rumah Singgah Manggarai",
    timestamp: daysAgo(4),
    meals: 60,
  },
];

export const STATUS_LABEL: Record<DonorDonationStatus, string> = {
  draft: "Draft",
  waiting_review: "Menunggu review",
  active: "Aktif",
  claimed: "Diklaim",
  completed: "Selesai",
};

export const STATUS_TONE: Record<DonorDonationStatus, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  waiting_review: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)]",
  claimed: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
