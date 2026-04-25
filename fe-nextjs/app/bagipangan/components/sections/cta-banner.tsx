"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Button } from "../ui/button";
import { createFadeUpVariants, createStaggerContainer } from "../../lib/motion";
import { useSmoothScroll } from "../../providers/smooth-scroll-provider";

export function CtaBanner() {
  const reducedMotion = useReducedMotion();
  const rm = reducedMotion ?? false;
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { amount: 0.3, once: true });
  const { scrollTo } = useSmoothScroll();

  return (
    <section
      aria-labelledby="cta-heading"
      className="bagi-noise relative isolate overflow-hidden bg-[var(--brand-900)] px-4 py-24 text-white sm:px-6 lg:px-10 lg:py-32"
      id="cta"
      ref={ref}
    >
      {/* Background photograph */}
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.22]"
        loading="lazy"
        src="/images/cta-community.jpg"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--brand-900)_0%,var(--brand-800)_55%,var(--brand-700)_100%)] mix-blend-multiply"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--brand-900)_80%)]"
      />

      {/* Radial glow accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <motion.div
          animate={
            rm
              ? undefined
              : { scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }
          }
          className="h-[680px] w-[680px] rounded-full bg-[var(--lime)] blur-3xl"
          transition={
            rm
              ? { duration: 0 }
              : {
                  duration: 9,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "mirror",
                }
          }
        />
      </div>

      <motion.div
        animate={isInView ? "visible" : "hidden"}
        className="relative z-10 mx-auto max-w-4xl text-center"
        initial="hidden"
        variants={createStaggerContainer(rm, 0.12)}
      >
        {/* Eyebrow chip */}
        <motion.div
          className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/75 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur"
          variants={createFadeUpVariants(rm)}
        >
          <motion.span
            animate={rm ? undefined : { opacity: [0.5, 1, 0.5], scale: [1, 1.12, 1] }}
            className="h-2 w-2 rounded-full bg-[var(--lime)]"
            transition={
              rm ? { duration: 0 } : { duration: 1.9, repeat: Number.POSITIVE_INFINITY }
            }
          />
          Mulai Hari Ini
        </motion.div>

        <motion.h2
          className="bagi-display bagi-text-balance text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[3.8rem]"
          id="cta-heading"
          variants={createFadeUpVariants(rm, 0.04)}
        >
          Setiap Porsi yang Diselamatkan{" "}
          <span className="italic text-[var(--lime)]">Mengubah Hidup Seseorang</span>
        </motion.h2>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl"
          variants={createFadeUpVariants(rm, 0.08)}
        >
          Daftar dalam 30 detik, posting donasi pertama Anda, dan lihat
          langsung dampaknya di dashboard. Tidak perlu kartu kredit, tidak
          perlu pelatihan.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          variants={createFadeUpVariants(rm, 0.14)}
        >
          <Button
            className="bg-[var(--lime)] px-8 py-3.5 text-[var(--brand-950)] hover:bg-[var(--brand-100)]"
            href="/register"
          >
            Daftar & Mulai Berbagi
          </Button>
          <Button
            className="border-white/38 bg-transparent px-8 py-3.5 text-white hover:border-white/60 hover:bg-white/10"
            onClick={() => scrollTo("#cara-kerja")}
            variant="secondary"
          >
            Pelajari Cara Kerja
          </Button>
        </motion.div>

        {/* Trust micro-badge row */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          variants={createFadeUpVariants(rm, 0.2)}
        >
          {[
            "Daftar 30 detik",
            "Tanpa biaya selamanya",
            "800+ pengguna aktif",
          ].map((item) => (
            <span
              key={item}
              className="flex items-center gap-2 text-sm text-white/52"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)] opacity-80" />
              {item}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
