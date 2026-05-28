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

async function getUsersData(params?: Record<string, string | undefined>) {
  try {
    const qs = params
      ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v != null && v !== '')))
      : '';

    const res = await fetch(`/api/admin/users${qs}`, {
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
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [registeredFrom, setRegisteredFrom] = useState<string | undefined>(undefined);
  const [registeredTo, setRegisteredTo] = useState<string | undefined>(undefined);

  useEffect(() => {
    let ignore = false;
    async function bootstrap() {
      setLoading(true);
      const params: Record<string, string | undefined> = {
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
        registered_from: registeredFrom || undefined,
        registered_to: registeredTo || undefined,
        per_page: '200',
      };

      const usersData = await getUsersData(params);
      if (!ignore) setUsers(usersData);
      setLoading(false);
    }

    const t = setTimeout(() => void bootstrap(), 150);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [search, role, status, registeredFrom, registeredTo]);

  return (
    <>
      <section className="rounded-[1.6rem] border border-(--brand-100) bg-white p-6 shadow-(--shadow-card)">
        <p className="text-xs uppercase tracking-[0.15em] text-(--brand-600)">Manajemen</p>
        <h2 className="bagi-display mt-2 text-4xl text-(--brand-900)">User</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-mid)">
          Kelola pengguna platform, atur roles, dan monitor aktivitas pengguna.
        </p>
      </section>

        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full md:w-64 rounded-lg border px-3 py-2 text-sm"
            />
            <select value={role ?? ''} onChange={(e) => setRole(e.target.value || undefined)} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">Peran (semua)</option>
              <option value="admin">Administrator</option>
              <option value="donatur">Donatur</option>
              <option value="penerima">Penerima</option>
            </select>
            <select value={status ?? ''} onChange={(e) => setStatus(e.target.value || undefined)} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">Status (semua)</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
              <option value="all">Semua termasuk terhapus</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-(--text-mid)">Dari</label>
            <input type="date" value={registeredFrom ?? ''} onChange={(e) => setRegisteredFrom(e.target.value || undefined)} className="rounded-lg border px-3 py-2 text-sm" />
            <label className="text-xs text-(--text-mid)">Sampai</label>
            <input type="date" value={registeredTo ?? ''} onChange={(e) => setRegisteredTo(e.target.value || undefined)} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>

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
