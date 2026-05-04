"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Home } from "lucide-react";
import { clearAuth } from "@/lib/api";

export default function AdminNavbar() {
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="border-b border-(--brand-100) bg-white px-6 py-4 flex items-center justify-between">
      <div></div>
      <div className="flex items-center gap-3">
        <Link
          href="/donatur/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-(--brand-200) text-(--brand-700) hover:bg-(--brand-50) font-semibold text-sm transition-colors"
        >
          <Home className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 font-semibold text-sm transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
