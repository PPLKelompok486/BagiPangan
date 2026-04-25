"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Package, ListChecks, Map as MapIcon } from "lucide-react";
import { apiFetch, clearAuth, getUser, type AuthUser } from "@/lib/api";

export default function ReceiverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (u.role !== "penerima") {
      router.replace("/");
      return;
    }
    setUser(u);
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch {
      // ignore — we'll clear locally anyway
    }
    clearAuth();
    router.replace("/login");
  };

  if (!user) return null;

  const navItems = [
    { href: "/receiver/dashboard", label: "Donasi tersedia", icon: Package },
    { href: "/receiver/map", label: "Peta donasi", icon: MapIcon },
    { href: "/receiver/my-claims", label: "Klaim saya", icon: ListChecks },
  ];

  return (
    <div className="bagi-theme min-h-screen bg-[var(--cream)]">
      <header className="bg-white border-b border-[var(--brand-100)] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/receiver/dashboard" className="flex items-center gap-2">
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
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-[var(--brand-950)]">{user.name}</div>
              <div className="text-xs text-[var(--text-mid)]">Penerima</div>
            </div>
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

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
