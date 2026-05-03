"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getUser, type AuthUser } from "@/lib/api";

const ROLE_REDIRECT: Record<AuthUser["role"], string> = {
  admin: "/admin",
  donatur: "/donatur/dashboard",
  penerima: "/receiver/dashboard",
};

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getUser();
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/login?from=/admin");
      return;
    }

    if (user.role !== "admin") {
      router.replace(ROLE_REDIRECT[user.role] ?? "/");
      return;
    }

  }, [router, user]);

  if (!user || user.role !== "admin") return null;

  return <>{children}</>;
}
