"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { ActivityFeed } from "./components/activity-feed";
import { KpiCard } from "./components/kpi-card";
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
    const res = await apiFetch<DashboardSummaryResponse>("/admin/dashboard/summary");
    return res;
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
      const dashboardData = await getDashboardData();
      setDashboard(dashboardData);
      setLoading(false);
    }
    void bootstrap();
  }, []);

  const kpis = dashboard.data.kpis;
  const foodSavedKg = (kpis.total_portions * 0.25).toFixed(1);
  const co2SavedKg = (kpis.total_portions * 0.6).toFixed(1);
  const activeCommunity = kpis.total_donations * 2; // Simulated for MVP unique metric demonstration
  
  // Real dynamic data
  const moderationPending = dashboard.data.activity_feed.filter(a => a.action === 'donation.created' || a.action.includes('pending')).length;

  const dynamicInsight = kpis.total_portions > 0 
    ? `Sistem mendeteksi tren positif hari ini: ${kpis.total_portions} porsi telah diolah dengan tingkat penyelesaian ${kpis.completion_rate}%. Berdasarkan aktivitas donasi (${kpis.total_donations} donasi), Anda berpotensi menyelamatkan ${foodSavedKg}kg makanan. Segera tinjau ${moderationPending} laporan yang tertunda untuk mempercepat distribusi.`
    : `Sistem belum mendeteksi aktivitas donasi hari ini. Galakkan donatur melalui notifikasi atau pantau peta operasi untuk melihat titik-titik potensi bantuan.`;

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-sm text-(--text-mid) animate-pulse font-medium">Memuat Operation Command Center...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6 pb-12"
    >
      {/* Header & Action Center */}
      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-linear-to-r from-(--brand-900) to-(--brand-700) rounded-[1.6rem] p-8 text-white shadow-xl overflow-hidden relative">
        <div className="absolute -right-10 -top-20 opacity-10 blur-xl">
          <Sparkles size={250} />
        </div>
        <div className="max-w-2xl relative z-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-(--brand-200) uppercase mb-3 drop-shadow-sm">Live Impact Center</p>
          <h1 className="text-4xl md:text-5xl font-bold bagi-display leading-tight">
            Hari ini, kita telah menyelamatkan <span className="text-yellow-400">{kpis.total_portions.toLocaleString("id-ID")} porsi</span> makanan.
          </h1>
        </div>
        <div className="shrink-0 relative z-10 w-full lg:w-auto">
          <button className="group flex w-full items-center justify-between gap-4 rounded-full bg-yellow-400 hover:bg-yellow-300 text-yellow-950 px-7 py-4 font-semibold transition-all hover:scale-105 hover:shadow-lg focus:ring-4 focus:ring-yellow-400/30 active:scale-95">
            <span className="flex items-center gap-3">
              {moderationPending > 0 ? (
                <AlertCircle size={22} className="animate-pulse" />
              ) : (
                <Sparkles size={22} />
              )}
              {moderationPending > 0 ? `Review ${moderationPending} Laporan` : "Semua Laporan Selesai"}
            </span>
            <ArrowRight size={20} className="group-hover:translate-x-1 duration-200" />
          </button>
        </div>
      </section>

      {/* KPI Cards (Unique Metrics) */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard hint={`~${co2SavedKg} kg jejak karbon dikurangkan`} label="Impact Index" value={`${foodSavedKg} kg`} />
        <KpiCard hint="Penerima aktif & donatur hari ini" label="Community Health" value={activeCommunity.toLocaleString("id-ID")} />
        <KpiCard hint="Rata-rata waktu makanan diambil" label="Claim Speed" value={`${kpis.avg_claim_minutes} min`} />
        <KpiCard hint="Menunggu kelulusan segera" label="Moderation Queue" value={moderationPending.toString()} />
      </section>

      {/* AI Insight Component */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-start gap-4 rounded-[1.4rem] bg-indigo-50/80 border border-indigo-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
      >
        <div className="absolute -right-4 -bottom-4 opacity-5">
          <Sparkles size={120} />
        </div>
        <div className="mt-1 shrink-0 rounded-full bg-indigo-100 p-2.5 text-indigo-600 shadow-inner">
          <Sparkles size={20} />
        </div>
        <div className="relative z-10">
          <h3 className="font-bold text-indigo-900">Platform Insights</h3>
          <p className="mt-1 text-sm text-indigo-800/90 leading-relaxed max-w-4xl">
            {dynamicInsight}
          </p>
        </div>
      </motion.section>

      {/* Main Operation Area */}
      <section className="grid gap-6 xl:grid-cols-[5fr_2fr]">
        <div className="flex flex-col gap-4 rounded-[1.6rem] border border-(--brand-100) bg-white p-5 shadow-(--shadow-card) min-h-[600px] h-full">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-(--brand-900) tracking-tight">Live Operation Map</h2>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-red-600 text-[10px] font-bold uppercase tracking-widest border border-red-100 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Peta Langsung
            </div>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden border border-gray-100 relative bg-(--brand-50)/30">
            {/* Embedded Live Map from existing map component */}
            <DonationMapPageContent />
          </div>
        </div>

        <div className="flex flex-col h-full gap-4">
          <ActivityFeed items={dashboard.data.activity_feed} />
        </div>
      </section>
    </motion.div>
  );
}
