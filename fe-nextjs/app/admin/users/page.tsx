"use client";

import { useEffect, useState } from "react";
import { UsersTable } from "../components/users-table";
import type { UsersResponse } from "../types";

const emptyUsers: UsersResponse = {
  message: "Fallback users",
  data: {
    data: [],
  },
};

async function getUsersData() {
  try {
    const res = await fetch("/api/admin/users", {
      cache: "no-store",
    });

    if (!res.ok) {
      return emptyUsers;
    }

    return (await res.json()) as UsersResponse;
  } catch {
    return emptyUsers;
  }
}

export default function ManajemenUser() {
  const [users, setUsers] = useState<UsersResponse>(emptyUsers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      const usersData = await getUsersData();
      setUsers(usersData);
      setLoading(false);
    }

    void bootstrap();
  }, []);

  return (
    <>
      <section className="rounded-[1.6rem] border border-(--brand-100) bg-white p-6 shadow-(--shadow-card)">
        <p className="text-xs uppercase tracking-[0.15em] text-(--brand-600)">Manajemen</p>
        <h2 className="bagi-display mt-2 text-4xl text-(--brand-900)">User</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-mid)">
          Kelola pengguna platform, atur roles, dan monitor aktivitas pengguna.
        </p>
      </section>

      {loading ? (
        <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 text-sm text-(--text-mid) shadow-(--shadow-card)">
          Memuat daftar pengguna...
        </section>
      ) : (
        <UsersTable users={users.data.data} />
      )}
    </>
  );
}
