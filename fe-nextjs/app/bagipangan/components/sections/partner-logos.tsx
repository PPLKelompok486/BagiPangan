"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { partners } from "../../data";
import { createFadeUpVariants, createStaggerContainer } from "../../lib/motion";

export function PartnerLogos() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { amount: 0.3, once: true });

  return (
    <section
      className="bg-[var(--brand-50)] px-4 py-20 sm:px-6 lg:px-10 lg:py-24"
      id="mitra"
      ref={ref}
    >
      <div className="mx-auto max-w-7xl text-center">
        <motion.p
          animate={isInView ? "visible" : "hidden"}
          className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-700)]"
          initial="hidden"
          variants={createFadeUpVariants(reducedMotion)}
        >
          Dipercaya Oleh
        </motion.p>

        <motion.div
          animate={isInView ? "visible" : "hidden"}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
          initial="hidden"
          variants={createStaggerContainer(reducedMotion, 0.08, 0.15)}
        >
          {partners.map((name) => (
            <motion.span
              key={name}
              className="rounded-full border border-[var(--brand-100)] bg-white/80 px-6 py-3 text-sm font-medium text-[var(--brand-700)] opacity-60 transition-opacity duration-300 hover:opacity-100"
              variants={createFadeUpVariants(reducedMotion)}
            >
              {name}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
