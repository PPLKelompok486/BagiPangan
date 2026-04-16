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
          {problemStats.map((stat) => (
            <motion.div
              key={stat.label}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              variants={createFadeSideVariants(reducedMotion, "right")}
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
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
