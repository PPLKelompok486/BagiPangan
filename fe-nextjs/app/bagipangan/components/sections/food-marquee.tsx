"use client";

import { motion, useReducedMotion } from "framer-motion";

const categories = [
  "NASI KOTAK",
  "ROTI & KUE",
  "BUAH SEGAR",
  "SAYURAN",
  "LAUK PAUK",
  "SNACK",
  "CATERING",
  "MINUMAN",
  "SEMBAKO",
  "MAKANAN BERAT",
];

export function FoodMarquee() {
  const reducedMotion = useReducedMotion();
  const loop = [...categories, ...categories];

  return (
    <section
      aria-label="Kategori makanan yang dapat didonasikan"
      className="relative overflow-hidden bg-[var(--brand-900)] py-6 text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--brand-900)] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--brand-900)] to-transparent"
      />

      <motion.div
        animate={reducedMotion ? undefined : { x: ["0%", "-50%"] }}
        className="flex w-max items-center gap-10"
        transition={
          reducedMotion
            ? { duration: 0 }
            : {
                duration: 40,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
              }
        }
      >
        {loop.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="flex items-center gap-10"
          >
            <span className="whitespace-nowrap text-sm font-semibold uppercase tracking-[0.32em] text-white/85 sm:text-base">
              {label}
            </span>
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--lime)]/70"
            />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
