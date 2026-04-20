"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { Activity, ArrowRight, BadgeCheck, ChartSpline, Clock3 } from "lucide-react";
import { useRef } from "react";
import { dashboardBars, donutLegend } from "../../data";
import { createFadeSideVariants, withMotionPreference } from "../../lib/motion";
import { Button } from "../ui/button";
import { SectionHeader } from "../ui/section-header";

const kpis = [
  { label: "Total Donasi", value: "1.284" },
  { label: "Penyelesaian", value: "96%" },
  { label: "Porsi", value: "15.4K" },
  { label: "Rata Klaim", value: "14m" },
] as const;

const activities = [
  { label: "Donasi dari Katering Sehat", status: "Selesai", icon: BadgeCheck },
  { label: "Klaim komunitas Jakarta Timur", status: "Diproses", icon: Activity },
  { label: "Konfirmasi foto terbaru", status: "Baru", icon: Clock3 },
] as const;

export function DashboardPreview() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { amount: 0.2, once: true });

  return (
    <section
      className="bg-[var(--brand-50)] px-4 py-20 sm:px-6 lg:px-10 lg:py-24"
      id="dashboard"
      ref={ref}
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
        <motion.div
          animate={isInView ? "visible" : "hidden"}
          initial="hidden"
          variants={createFadeSideVariants(reducedMotion, "left")}
        >
          <SectionHeader
            description="Pantau donasi, status klaim, dan performa penyaluran dari satu dashboard yang terasa profesional, jelas, dan mudah ditindaklanjuti."
            eyebrow="Dashboard"
            title="Dashboard lengkap untuk donatur dan admin"
          />

          <ul className="mt-8 space-y-4">
            {[
              "Ringkasan KPI yang mudah dibaca dalam beberapa detik.",
              "Visual progres distribusi yang membantu pengambilan keputusan cepat.",
              "Aktivitas terbaru dan validasi foto dalam satu tampilan bersih.",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-base leading-8 text-[var(--text-mid)]"
              >
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[var(--lime)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Button href="/register">Coba Sekarang</Button>
            <Button
              className="border-[var(--brand-100)] bg-white text-[var(--brand-900)]"
              href="/register"
              variant="ghost"
            >
              Jelajahi Fitur
            </Button>
          </div>
        </motion.div>

        <motion.div
          animate={isInView ? "visible" : "hidden"}
          className="overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_24px_80px_rgba(13,43,26,0.2)]"
          initial="hidden"
          variants={createFadeSideVariants(reducedMotion, "right", 0.08)}
        >
          <div className="flex items-center justify-between bg-[var(--brand-900)] px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--lime)]" />
              <span className="h-3 w-3 rounded-full bg-[var(--brand-400)]" />
              <span className="h-3 w-3 rounded-full bg-white/45" />
            </div>
            <div className="rounded-full border border-white/12 bg-white/8 px-4 py-1 text-xs font-medium text-white/70">
              dashboard.bagipangan.id
            </div>
          </div>

          <div className="bagi-dashboard-grid bg-[var(--cream)] p-4 sm:p-6">
            <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,var(--brand-900),var(--brand-700))] p-6 text-white shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-white/60">
                    Selamat datang
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    Ringkasan dampak hari ini
                  </h3>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white/70">
                  Kamis, 16 April 2026
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-[1.4rem] border border-[var(--brand-100)] bg-white p-4 shadow-[var(--shadow-card)]"
                >
                  <p className="text-sm font-medium text-[var(--text-mid)]">{kpi.label}</p>
                  <p className="bagi-display mt-3 text-3xl font-semibold text-[var(--brand-900)]">
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[1.6rem] border border-[var(--brand-100)] bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-mid)]">
                      Tren donasi mingguan
                    </p>
                    <h4 className="mt-1 text-xl font-semibold text-[var(--brand-900)]">
                      Aktivitas 7 hari terakhir
                    </h4>
                  </div>
                  <ChartSpline className="h-5 w-5 text-[var(--brand-500)]" />
                </div>

                <div className="mt-8 flex h-52 items-end gap-3">
                  {dashboardBars.map((height, index) => (
                    <div key={`${height}-${index}`} className="flex flex-1 flex-col items-center gap-3">
                      <motion.div
                        animate={isInView ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
                        className="w-full rounded-t-2xl bg-[linear-gradient(180deg,var(--lime),var(--brand-600))]"
                        style={{ height, transformOrigin: "bottom" }}
                        transition={withMotionPreference(reducedMotion, {
                          duration: 0.56,
                          delay: 0.18 + index * 0.08,
                          ease: [0.16, 1, 0.3, 1],
                        })}
                      />
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-mid)]">
                        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.6rem] border border-[var(--brand-100)] bg-white p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-mid)]">
                        Status distribusi
                      </p>
                      <h4 className="mt-1 text-xl font-semibold text-[var(--brand-900)]">
                        Donut progress
                      </h4>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[var(--brand-500)]" />
                  </div>

                  <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
                    <div className="relative">
                      <div
                        aria-label="Diagram distribusi 55 persen selesai, 25 persen klaim, 20 persen tersedia"
                        className="h-36 w-36 rounded-full"
                        role="img"
                        style={{
                          background:
                            "conic-gradient(var(--brand-600) 0 55%, var(--lime) 55% 80%, var(--brand-300) 80% 100%)",
                        }}
                      />
                      <div className="absolute inset-4 rounded-full bg-white" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bagi-display text-3xl font-semibold text-[var(--brand-900)]">
                          55%
                        </span>
                      </div>
                    </div>

                    <div className="w-full space-y-4">
                      {donutLegend.map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className={`h-3 w-3 rounded-full ${item.color}`} />
                          <span className="text-sm font-medium text-[var(--text-mid)]">
                            {item.label}
                          </span>
                          <span className="ml-auto text-sm font-semibold text-[var(--brand-900)]">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-[var(--brand-100)] bg-white p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-mid)]">
                        Aktivitas terbaru
                      </p>
                      <h4 className="mt-1 text-xl font-semibold text-[var(--brand-900)]">
                        Feed operasional
                      </h4>
                    </div>
                    <Activity className="h-5 w-5 text-[var(--brand-500)]" />
                  </div>

                  <div className="mt-5 space-y-3">
                    {activities.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="flex items-center gap-3 rounded-2xl bg-[var(--brand-50)] px-4 py-3"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--brand-700)]">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-[var(--brand-900)]">
                              {item.label}
                            </p>
                            <p className="text-sm text-[var(--text-mid)]">{item.status}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
