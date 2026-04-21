import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./landing.css";
import { SmoothScrollProvider } from "./providers/smooth-scroll-provider";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-bagipangan-display",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-bagipangan-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BagiPangan | Bagi Makanan, Kurangi Pemborosan",
  description:
    "Platform distribusi makanan berlebih yang menghubungkan donatur dengan penerima secara cepat, aman, dan transparan.",
  openGraph: {
    title: "BagiPangan",
    description:
      "Bagi makanan berlebih, kurangi pemborosan, dan bantu sesama lewat satu platform yang rapi dan real-time.",
    type: "website",
    locale: "id_ID",
    siteName: "BagiPangan",
    url: "/bagipangan",
  },
  twitter: {
    card: "summary_large_image",
    title: "BagiPangan",
    description:
      "Platform distribusi makanan berlebih dari donatur ke penerima dalam satu alur yang sederhana dan transparan.",
  },
};

export default function BagiPanganLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${fraunces.variable} ${plusJakartaSans.variable} bagi-theme min-h-screen bg-[var(--cream)] text-[var(--text-dark)]`}
    >
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </div>
  );
}
