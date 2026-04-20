"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  HandHeart,
  Leaf,
  Network,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRef } from "react";
import { partners } from "../../data";
import { createFadeUpVariants, createStaggerContainer } from "../../lib/motion";

const partnerIcons: LucideIcon[] = [
  Network,
  Users,
  HandHeart,
  Leaf,
  ShieldCheck,
];

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
      <div className="mx-auto max-w-7xl">
        <motion.div
          animate={isInView ? "visible" : "hidden"}
          className="flex flex-col items-center gap-4 text-center"
          initial="hidden"
          variants={createFadeUpVariants(reducedMotion)}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-700)]">
            Dipercaya Oleh
          </p>
          <h2 className="bagi-display bagi-text-balance max-w-2xl text-3xl font-semibold leading-tight text-[var(--brand-900)] sm:text-4xl">
            Bergabung dengan{" "}
            <span className="text-[var(--brand-600)]">800+ komunitas</span>
            {" "}di 20+ kota
          </h2>
          <p className="max-w-xl text-sm text-[var(--text-mid)]">
            Bekerja sama dengan komunitas dan lembaga yang memperjuangkan akses pangan yang adil di Indonesia.
          </p>
        </motion.div>

        <motion.ul
          animate={isInView ? "visible" : "hidden"}
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          initial="hidden"
          variants={createStaggerContainer(reducedMotion, 0.08, 0.15)}
        >
          {partners.map((name, index) => {
            const Icon = partnerIcons[index % partnerIcons.length];
            return (
              <motion.li
                key={name}
                className="group flex items-center gap-3 rounded-2xl border border-[var(--brand-100)] bg-white/80 px-4 py-3.5 text-sm font-medium text-[var(--brand-800)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-300)] hover:bg-white hover:shadow-[var(--shadow-card)]"
                variants={createFadeUpVariants(reducedMotion)}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-100)] text-[var(--brand-700)] transition-colors group-hover:bg-[var(--brand-600)] group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{name}</span>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
