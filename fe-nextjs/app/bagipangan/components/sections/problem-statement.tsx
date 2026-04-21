"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { problemStats } from "../../data";
import {
  createFadeSideVariants,
  createFadeUpVariants,
  createStaggerContainer,
} from "../../lib/motion";
import { SectionHeader } from "../ui/section-header";

export function ProblemStatement() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { amount: 0.15, once: true });

  return (
    <section
      className="bagi-noise relative overflow-hidden bg-[var(--brand-900)] px-4 py-20 text-white sm:px-6 lg:px-10 lg:py-24"
      id="masalah"
      ref={ref}
    >
      <motion.div
        animate={isInView ? "visible" : "hidden"}
        className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20"
        initial="hidden"
        variants={createStaggerContainer(reducedMotion, 0.15)}
      >
        {/* Narrative left */}
        <motion.div variants={createFadeSideVariants(reducedMotion, "left")}>
          <SectionHeader
            className="[&_h2]:text-white [&_p]:text-white/72 [&_span]:border-white/12 [&_span]:bg-white/8 [&_span]:text-white/75"
            description="Setiap hari, jutaan porsi makanan layak konsumsi berakhir di tempat pembuangan, sementara jutaan keluarga Indonesia berjuang memenuhi kebutuhan pangan mereka. Kesenjangan ini bukan hanya soal logistik — ini soal keadilan."
            eyebrow="Masalah yang Kami Hadapi"
            title={
              <>
                Indonesia Kehilangan{" "}
                <span className="italic text-[var(--lime)]">Jutaan Porsi</span>{" "}
                Setiap Hari
              </>
            }
          />
          <motion.p
            className="mt-8 text-lg font-medium text-[var(--lime)]"
            variants={createFadeUpVariants(reducedMotion, 0.3)}
          >
            BagiPangan hadir untuk mengubah ini.
          </motion.p>
        </motion.div>

        {/* Stats right */}
        <motion.div
          className="flex flex-col gap-8"
          variants={createStaggerContainer(reducedMotion, 0.12, 0.2)}
        >
          {problemStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors"
              variants={createFadeSideVariants(reducedMotion, "right")}
              whileHover={
                reducedMotion
                  ? undefined
                  : {
                      borderColor: "rgba(168, 230, 61, 0.3)",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      y: -4,
                    }
              }
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
            >
              <p className="bagi-display text-3xl font-semibold text-[var(--lime)] sm:text-4xl">
                {stat.value}
                {stat.suffix ? (
                  <span className="text-xl text-white/60 sm:text-2xl">
                    {stat.suffix}
                  </span>
                ) : null}
              </p>
              <p className="mt-2 text-base text-white/72">{stat.label}</p>

              {/* Animated underline */}
              <motion.div
                className="mt-4 h-px bg-[linear-gradient(90deg,var(--lime),transparent)]"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 0.8, delay: 0.5 + index * 0.15, ease: [0.16, 1, 0.3, 1] }
                }
                style={{ transformOrigin: "left" }}
              />

              {/* Hover glow */}
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--lime)] opacity-0 blur-3xl transition-opacity group-hover:opacity-15"
                aria-hidden="true"
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
