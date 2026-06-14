"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ListChecks, Package, Timer, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { ActivityFeed } from "./components/activity-feed";
import { StatCard } from "@/components/admin/stat-card";
import { SectionCard } from "@/components/admin/section-card";
import DonationMapPageContent from "@/components/map/DonationMapPageContent";
import { apiFetch } from "@/lib/api";
import type { DashboardSummaryResponse } from "./types";

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

async function getDashboardData() {
  try {
    return await apiFetch<DashboardSummaryResponse>("/admin/dashboard/summary");
  } catch (err) {
    console.error("Dashboard fetch threw error:", err);
    return emptyDashboard;
  }
}

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<DashboardSummaryResponse>(emptyDashboard);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setDashboard(await getDashboardData());
      setLoading(false);
    }
    void bootstrap();
  }, []);

  const kpis = dashboard.data.kpis;
  const moderationPending = dashboard.data.activity_feed.filter(
    (a) => a.action === "donation.created" || a.action.includes("pending"),
  ).length;

  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="animate-pulse text-sm font-medium text-(--text-mid)">Memuat dashboard…</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <section className="flex flex-col gap-5 rounded-(--radius-card) bg-[linear-gradient(150deg,var(--brand-900),var(--brand-700))] p-6 text-white shadow-(--shadow-card) sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--brand-200)">
            Ringkasan Operasional
          </p>
          <h1 className="bagi-display mt-2 text-3xl sm:text-4xl">Dashboard</h1>
          <p className="mt-1.5 text-sm text-white/75">{todayLabel}</p>
        </div>
        {moderationPending > 0 && (
          <Link
            href="/admin/donations"
            className="group inline-flex items-center justify-between gap-4 rounded-(--radius-pill) bg-(--accent-ochre) px-6 py-3.5 font-semibold text-white transition-all hover:shadow-lg"
          >
            <span>Tinjau {moderationPending} donasi menunggu</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </section>

      {/* KPI cards — real metrics only */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Package}
          label="Total Donasi"
          countUpTo={kpis.total_donations}
          value={kpis.total_donations.toLocaleString("id-ID")}
          hint="Donasi tercatat di sistem"
        />
        <StatCard
          icon={UtensilsCrossed}
          label="Total Porsi"
          countUpTo={kpis.total_portions}
          value={kpis.total_portions.toLocaleString("id-ID")}
          hint="Porsi makanan tersalurkan"
        />
        <StatCard
          icon={CheckCircle2}
          label="Tingkat Penyelesaian"
          value={`${kpis.completion_rate}%`}
          hint="Donasi yang berhasil diselesaikan"
        />
        <StatCard
          icon={moderationPending > 0 ? ListChecks : Timer}
          label="Antrian Moderasi"
          value={moderationPending.toString()}
          hint={moderationPending > 0 ? "Menunggu peninjauan" : "Semua donasi tertinjau"}
          deltaTone={moderationPending > 0 ? "down" : "neutral"}
        />
      </section>

      {/* Operations area */}
      <section className="grid gap-6 xl:grid-cols-[5fr_2fr]">
        <SectionCard
          title="Peta Operasi"
          actions={
            <span className="inline-flex items-center gap-2 rounded-(--radius-pill) border border-(--brand-100) bg-(--brand-50) px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-(--brand-700)">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--brand-400) opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-(--brand-600)" />
              </span>
              Langsung
            </span>
          }
          className="flex min-h-[600px] flex-col"
        >
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-(--brand-100) bg-(--brand-50)/30">
            <DonationMapPageContent context="admin" embedded />
          </div>
        </SectionCard>

        <div className="flex h-full flex-col gap-4">
          <ActivityFeed items={dashboard.data.activity_feed} />
        </div>
      </section>
    </motion.div>
  );
}
