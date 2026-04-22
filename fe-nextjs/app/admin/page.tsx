"use client";

import { useEffect, useState } from "react";
import { ActivityFeed } from "./components/activity-feed";
import { KpiCard } from "./components/kpi-card";
import { UsersTable } from "./components/users-table";
import type { DashboardSummaryResponse, UsersResponse } from "./types";

const emptyDashboard: DashboardSummaryResponse = {
  message: "Fallback dashboard",
  data: {
    kpis: {
      total_donations: 0,
      completion_rate: 0,
      total_portions: 0,
      avg_claim_minutes: 0,
    },
    activity_feed: [],
  },
};

const emptyUsers: UsersResponse = {
  message: "Fallback users",
  data: {
    data: [],
  },
};

async function getDashboardData() {
  try {
    const res = await fetch("/api/admin/dashboard/summary", {
      cache: "no-store",
    });

    if (!res.ok) {
      return emptyDashboard;
    }

    return (await res.json()) as DashboardSummaryResponse;
  } catch {
    return emptyDashboard;
  }
}

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

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<DashboardSummaryResponse>(emptyDashboard);
  const [users, setUsers] = useState<UsersResponse>(emptyUsers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      const [dashboardData, usersData] = await Promise.all([getDashboardData(), getUsersData()]);
      setDashboard(dashboardData);
      setUsers(usersData);
      setLoading(false);
    }

    void bootstrap();
  }, []);

  const kpis = dashboard.data.kpis;

  return (
    <>
      <section className="rounded-[1.6rem] border border-(--brand-100) bg-white p-6 shadow-(--shadow-card)">
        <p className="text-xs uppercase tracking-[0.15em] text-(--brand-600)">Dashboard Ringkas</p>
        <h2 className="bagi-display mt-2 text-4xl text-(--brand-900)">Operasional Hari Ini</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-(--text-mid)">
          Tampilan admin ini mengikuti identitas visual landing page BagiPangan, namun dengan komposisi yang lebih padat untuk pengambilan keputusan cepat.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard hint="Akumulasi donasi masuk" label="Total Donasi" value={kpis.total_donations.toLocaleString("id-ID")} />
        <KpiCard hint="Proporsi selesai" label="Penyelesaian" value={`${kpis.completion_rate}%`} />
        <KpiCard hint="Porsi siap distribusi" label="Porsi" value={kpis.total_portions.toLocaleString("id-ID")} />
        <KpiCard hint="Rata-rata waktu klaim" label="Rata Klaim" value={`${kpis.avg_claim_minutes}m`} />
      </section>

      {loading ? (
        <section className="rounded-[1.4rem] border border-(--brand-100) bg-white p-5 text-sm text-(--text-mid) shadow-(--shadow-card)">
          Memuat ringkasan admin...
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <ActivityFeed items={dashboard.data.activity_feed} />
        <UsersTable users={users.data.data} />
      </section>
    </>
  );
}
