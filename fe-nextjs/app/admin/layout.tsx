import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "../bagipangan/landing.css";
import Link from "next/link";
import AdminAuthGate from "./components/admin-auth-gate";

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
  title: "Admin BagiPangan",
  description: "Panel admin operasional untuk moderasi dan ringkasan distribusi BagiPangan.",
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`${fraunces.variable} ${plusJakartaSans.variable} bagi-theme min-h-screen bg-(--cream) text-(--text-dark)`}
    >
      <div className="grid min-h-screen w-full gap-0 lg:gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border border-(--brand-100) bg-[linear-gradient(160deg,var(--brand-900),var(--brand-700))] p-5 text-white shadow-(--shadow-soft) lg:sticky lg:top-0 lg:h-screen">
          <p className="text-xs uppercase tracking-[0.15em] text-white/70">Admin Console</p>
          <h1 className="bagi-display mt-3 text-3xl">BagiPangan</h1>
          <p className="mt-3 text-sm leading-6 text-white/80">
            Moderasi donasi, pantau performa, dan kelola pengguna dalam satu ruang kerja operasional.
          </p>

          <nav className="mt-8 space-y-2 text-sm">
            <Link className="block rounded-xl bg-white/14 px-3 py-2 font-medium" href="/admin">
              Dashboard
            </Link>
            <Link className="block rounded-xl border border-white/20 px-3 py-2 text-white/80 hover:bg-white/10" href="/admin/donations">
              Manajemen Donasi
            </Link>
            <Link className="block rounded-xl border border-white/20 px-3 py-2 text-white/80 hover:bg-white/10" href="/admin/map">
              Peta Donasi
            </Link>
            <Link className="block rounded-xl border border-white/20 px-3 py-2 text-white/80 hover:bg-white/10" href="/admin/users">
              Manajemen User
            </Link>
            <Link className="block rounded-xl border border-white/20 px-3 py-2 text-white/80 hover:bg-white/10" href="/admin/categories">
              Manajemen Kategori
            </Link>
          </nav>
        </aside>

        <AdminAuthGate>
          <main className="space-y-6">{children}</main>
        </AdminAuthGate>
      </div>
    </div>
  );
}
