import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Camera,
  ChartColumn,
  HandHeart,
  ShieldCheck,
  Sparkles,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

export const navLinks = [
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Fitur", href: "#fitur" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "FAQ", href: "#faq" },
] as const;

export const stats = [
  { value: 1200, suffix: "+", label: "Donasi Dibuat", trend: "+18%", trendLabel: "bulan ini" },
  { value: 15000, suffix: "+", label: "Porsi Tersalurkan", trend: "+24%", trendLabel: "bulan ini" },
  { value: 800, suffix: "+", label: "Pengguna Aktif", trend: "+12%", trendLabel: "bulan ini" },
  { value: 20, suffix: "+", label: "Kota", trend: "+3", trendLabel: "kota baru" },
] as const;

type Step = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  image: string;
  imageAlt: string;
  duration: string;
};

export const steps: Step[] = [
  {
    number: "01",
    title: "Posting Donasi",
    description: "Unggah detail makanan berlebih dalam hitungan menit dengan alur yang ringkas.",
    icon: HandHeart,
    image: "/images/how-posting.jpg",
    imageAlt: "Relawan menyiapkan porsi makanan untuk didonasikan",
    duration: "± 2 menit",
  },
  {
    number: "02",
    title: "Klaim & Ambil",
    description: "Penerima melihat listing yang aktif, melakukan klaim, lalu mengambil secara offline.",
    icon: Truck,
    image: "/images/how-pickup.jpg",
    imageAlt: "Penerima mengambil paket makanan dari titik distribusi",
    duration: "± 30 menit",
  },
  {
    number: "03",
    title: "Konfirmasi Foto",
    description: "Bukti pengambilan diunggah untuk menjaga transparansi dan kepercayaan antar pihak.",
    icon: Camera,
    image: "/images/how-confirm.jpg",
    imageAlt: "Nampan makanan terdokumentasi sebagai bukti distribusi",
    duration: "± 30 detik",
  },
] as const;

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
  size?: "large" | "standard" | "wide" | "full";
  image?: string;
};

export const features: Feature[] = [
  {
    title: "Posting Donasi",
    description: "Buat listing makanan berlebih dengan informasi yang jelas dan mudah dipahami.",
    icon: UtensilsCrossed,
    size: "large",
    image: "/images/how-posting.jpg",
  },
  {
    title: "Klaim & Ambil",
    description: "Alur klaim yang cepat membantu makanan sampai ke penerima pada waktu yang tepat.",
    icon: HandHeart,
    size: "standard",
  },
  {
    title: "Konfirmasi Foto",
    description: "Setiap pengambilan dapat divalidasi melalui dokumentasi yang sederhana.",
    icon: Camera,
    size: "standard",
  },
  {
    title: "Dashboard Real-time",
    description: "Pantau performa donasi, status klaim, dan aktivitas terbaru dari satu tampilan.",
    icon: ChartColumn,
    size: "standard",
  },
  {
    title: "Aman & Terverifikasi",
    description: "Listing dan akun dipantau agar distribusi makanan tetap akurat dan terpercaya.",
    icon: ShieldCheck,
    size: "wide",
  },
  {
    title: "Tanpa Biaya",
    description: "Platform ini gratis untuk donatur maupun penerima agar dampaknya bisa tumbuh luas.",
    icon: Sparkles,
    size: "full",
  },
] as const;

export const dashboardBars = [62, 88, 54, 96, 72, 78, 108] as const;

export const donutLegend = [
  { label: "Selesai", value: "55%", color: "bg-[var(--brand-600)]" },
  { label: "Klaim", value: "25%", color: "bg-[var(--lime)]" },
  { label: "Tersedia", value: "20%", color: "bg-[var(--brand-300)]" },
] as const;

export const problemStats = [
  { value: "23 Juta Ton", suffix: "/Tahun", label: "makanan terbuang di Indonesia" },
  { value: "1 dari 4", suffix: "", label: "anak mengalami stunting" },
  { value: "Rp 551T", suffix: "", label: "kerugian ekonomi akibat food waste" },
] as const;

type Testimonial = {
  name: string;
  role: string;
  location: string;
  avatar: string;
  quote: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Rina Susanti",
    role: "Donatur",
    location: "Jakarta",
    avatar: "/images/testimonial-rina.jpg",
    quote:
      "BagiPangan membuat proses donasi makanan jadi sangat mudah. Saya bisa memastikan makanan berlebih dari restoran saya tidak terbuang sia-sia.",
  },
  {
    name: "Ahmad Fauzi",
    role: "Penerima",
    location: "Bandung",
    avatar: "/images/testimonial-ahmad.jpg",
    quote:
      "Sebagai pengelola panti asuhan, platform ini sangat membantu kami mendapatkan makanan berkualitas untuk anak-anak secara rutin.",
  },
  {
    name: "Dewi Lestari",
    role: "Relawan",
    location: "Surabaya",
    avatar: "/images/testimonial-dewi.jpg",
    quote:
      "Transparansi dan kemudahan konfirmasi foto membuat saya yakin setiap donasi benar-benar sampai ke tangan yang membutuhkan.",
  },
] as const;

export const partners = [
  "FoodBank Indonesia",
  "Komunitas Peduli Pangan",
  "Yayasan Berbagi Nusantara",
  "Gerakan Pangan Bijak",
  "Relawan Pangan Nasional",
] as const;

type FaqItem = {
  question: string;
  answer: string;
};

export const faqs: FaqItem[] = [
  {
    question: "Apakah BagiPangan benar-benar gratis?",
    answer:
      "Ya, BagiPangan 100% gratis untuk semua pengguna. Kami percaya akses terhadap makanan adalah hak dasar, sehingga tidak ada biaya tersembunyi untuk donatur maupun penerima.",
  },
  {
    question: "Siapa saja yang bisa mendonasikan makanan?",
    answer:
      "Siapa pun bisa menjadi donatur — individu, restoran, katering, hotel, hingga perusahaan. Selama makanan masih layak konsumsi, Anda bisa memposting donasi di platform kami.",
  },
  {
    question: "Bagaimana cara memulai?",
    answer:
      "Cukup daftar akun dalam 30 detik, lengkapi profil singkat Anda, dan Anda sudah bisa memposting donasi pertama atau mulai mencari makanan yang tersedia di sekitar Anda.",
  },
  {
    question: "Jenis makanan apa saja yang bisa didonasikan?",
    answer:
      "Semua jenis makanan yang masih layak konsumsi: makanan siap saji, bahan mentah, makanan kemasan, roti, buah, sayuran, dan lainnya. Pastikan makanan masih dalam kondisi baik saat diposting.",
  },
  {
    question: "Bagaimana transparansi dijaga di platform ini?",
    answer:
      "Setiap pengambilan donasi dikonfirmasi dengan foto sebagai bukti. Dashboard real-time juga memungkinkan donatur memantau status donasi mereka dari awal hingga diterima.",
  },
  {
    question: "Apakah BagiPangan tersedia di kota saya?",
    answer:
      "Saat ini BagiPangan aktif di 20+ kota di Indonesia dan terus berkembang. Daftar dan cek ketersediaan di area Anda — semakin banyak pengguna, semakin luas jangkauan kami.",
  },
] as const;
