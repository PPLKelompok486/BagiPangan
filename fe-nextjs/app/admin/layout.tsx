"use client";

import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "../bagipangan/landing.css";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LogOut,
  Home,
  LayoutDashboard,
  Package,
  Map as MapIcon,
  Users,
  ScrollText,
  Tags,
  FileBarChart,
  Menu,
  X,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { clearAuth } from "@/lib/api";
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

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/donations", label: "Manajemen Donasi", icon: Package },
  { href: "/admin/map", label: "Peta Donasi", icon: MapIcon },
  { href: "/admin/users", label: "Manajemen User", icon: Users },
  { href: "/admin/activity", label: "Log Aktivitas", icon: ScrollText },
  { href: "/admin/categories", label: "Manajemen Kategori", icon: Tags },
  { href: "/admin/reports", label: "Ekspor Laporan", icon: FileBarChart },
];

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const navLinks = (onNavigate?: () => void) => (
    <nav className="space-y-1.5 text-sm">
      {navItems.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={
            isActive(href, exact)
              ? "flex items-center gap-2.5 rounded-xl bg-white/15 px-3 py-2 font-semibold text-white"
              : "flex items-center gap-2.5 rounded-xl px-3 py-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );

  const sidebarFooter = (onNavigate?: () => void) => (
    <div className="mt-auto space-y-2 border-t border-white/15 pt-6">
      <Link
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        href="/"
      >
        <Home className="h-4 w-4" />
        Kembali ke Beranda
      </Link>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Keluar
      </button>
    </div>
  );

  return (
    <div
      className={`${fraunces.variable} ${plusJakartaSans.variable} bagi-theme min-h-screen bg-(--cream) text-(--text-dark)`}
    >
      <div className="flex min-h-screen w-full">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[260px] flex-col overflow-y-auto border-r border-(--brand-100) bg-[linear-gradient(160deg,var(--brand-900),var(--brand-700))] p-5 text-white shadow-(--shadow-soft) lg:flex">
          <p className="text-xs uppercase tracking-[0.15em] text-white/70">Admin Console</p>
          <h1 className="bagi-display mt-3 text-3xl">BagiPangan</h1>
          <p className="mt-3 text-sm leading-6 text-white/80">
            Moderasi donasi, pantau performa, dan kelola pengguna dalam satu ruang kerja operasional.
          </p>
          <div className="mt-8">{navLinks()}</div>
          {sidebarFooter()}
        </aside>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {navOpen && (
            <motion.div
              className="fixed inset-0 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/40" onClick={() => setNavOpen(false)} />
              <motion.aside
                className="absolute left-0 top-0 flex h-full w-[280px] flex-col overflow-y-auto bg-[linear-gradient(160deg,var(--brand-900),var(--brand-700))] p-5 text-white shadow-(--shadow-soft)"
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "tween", duration: 0.22 }}
              >
                <div className="flex items-center justify-between">
                  <h1 className="bagi-display text-2xl">BagiPangan</h1>
                  <button
                    onClick={() => setNavOpen(false)}
                    aria-label="Tutup menu"
                    className="rounded-lg p-1.5 text-white/80 hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-6">{navLinks(() => setNavOpen(false))}</div>
                {sidebarFooter(() => setNavOpen(false))}
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminAuthGate>
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-(--brand-100) bg-(--cream)/85 px-4 py-3 backdrop-blur lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNavOpen(true)}
                  aria-label="Buka menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-(--brand-100) text-(--brand-700) hover:bg-(--brand-50) lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <span className="bagi-display text-xl text-(--brand-900) lg:hidden">BagiPangan</span>
                <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-(--text-mid) lg:block">
                  Ruang Kerja Admin
                </span>
              </div>

              <div className="flex items-center gap-2">
                <NotificationBell />
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-xl border border-(--brand-100) px-3 py-2 text-sm font-semibold text-(--brand-700) transition-colors hover:bg-(--brand-50)"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </header>

            <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 lg:p-8">{children}</main>
          </AdminAuthGate>
        </div>
      </div>
    </div>
  );
}
