"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, type AuthUser } from "@/lib/api";

const ROLE_REDIRECT: Record<AuthUser["role"], string> = {
  admin: "/admin",
  donatur: "/donatur/dashboard",
  penerima: "/receiver/dashboard",
};

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.replace("/login?from=/admin");
      return;
    }

    if (user.role !== "admin") {
      router.replace(ROLE_REDIRECT[user.role] ?? "/");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) return null;

  return <>{children}</>;
}
