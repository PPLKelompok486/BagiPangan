"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutGrid, Map as MapIcon, Package, PlusCircle, User } from "lucide-react";
import "../bagipangan/landing.css";
import { apiFetch, clearAuth, getUser, type AuthUser } from "@/lib/api";

export default function DonaturLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (u.role !== "donatur") {
      router.replace("/receiver/dashboard");
      return;
    }
    setUser(u);
    // Fetch avatar
    fetchAvatar();
  }, [router]);

  const fetchAvatar = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.user?.avatar) {
          setAvatarUrl(data.user.avatar);
        }
      }
    } catch (error) {
      console.error("Failed to fetch avatar:", error);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch {
      // ignore — clear locally regardless
    }
    clearAuth();
    router.replace("/login");
  };

  if (!user) return null;

  const navItems = [
    { href: "/donatur/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/donatur/donations", label: "Donasi saya", icon: Package },
    { href: "/donatur/map", label: "Peta donasi", icon: MapIcon },
    { href: "/donatur/donations/new", label: "Buat donasi", icon: PlusCircle },
  ];

  return (
    <div className="bagi-theme min-h-screen bg-[var(--cream)]">
      <header className="bg-white border-b border-[var(--brand-100)] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/donatur/dashboard" className="flex items-center gap-2">
            <span className="bg-[var(--brand-600)] text-white font-bold rounded-xl px-2.5 py-1 text-sm">
              BP
            </span>
            <span className="font-bold text-[var(--brand-950)]">Bagi Pangan</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[var(--brand-50)] text-[var(--brand-700)]"
                      : "text-[var(--text-mid)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/profile" className="flex items-center gap-3 hidden sm:block hover:opacity-80 transition-opacity">
              {avatarUrl ? (
                <img
                  src={`${process.env.LARAVEL_API_BASE ?? "http://localhost:8000"}${avatarUrl}`}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[var(--brand-200)]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--brand-100)] flex items-center justify-center border-2 border-[var(--brand-200)]">
                  <User className="h-5 w-5 text-[var(--brand-600)]" />
                </div>
              )}
              <div className="flex flex-col justify-center text-left">
                <div className="text-sm font-semibold text-[var(--brand-950)]">{user.name}</div>
                <div className="text-xs text-[var(--text-mid)]">Donatur</div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-[var(--brand-700)] border border-[var(--brand-100)] hover:bg-[var(--brand-50)]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${
                  active
                    ? "bg-[var(--brand-50)] text-[var(--brand-700)]"
                    : "text-[var(--text-mid)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[var(--brand-950)] mb-2">
              Keluar?
            </h3>
            <p className="text-[var(--text-mid)] mb-6">
              Apakah Anda yakin ingin keluar dari akun?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-[var(--brand-50)] text-[var(--brand-700)] py-3 rounded-xl font-bold hover:bg-[var(--brand-100)] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-[var(--brand-600)] text-white py-3 rounded-xl font-bold hover:bg-[var(--brand-700)] transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
