"use client";

import CountUp from "react-countup";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { stats } from "../../data";
import { createFadeUpVariants, createStaggerContainer } from "../../lib/motion";

export function ImpactStats() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { amount: 0.25, once: true });

  return (
    <section
      className="bg-white px-4 py-20 sm:px-6 lg:px-10 lg:py-24"
      id="statistik"
      ref={ref}
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          animate={isInView ? "visible" : "hidden"}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          initial="hidden"
          variants={createStaggerContainer(reducedMotion, 0.1)}
        >
          {stats.map((stat) => (
            <motion.article
              key={stat.label}
              className="rounded-[2rem] border border-[var(--brand-100)] bg-[var(--cream)] p-8 shadow-[var(--shadow-card)]"
              variants={createFadeUpVariants(reducedMotion)}
            >
              <div className="bagi-display flex items-end gap-1 text-5xl font-semibold text-[var(--brand-600)] md:text-6xl">
                <CountUp
                  duration={reducedMotion ? 0 : 1.6}
                  enableScrollSpy
                  end={stat.value}
                  scrollSpyOnce
                  start={isInView ? undefined : 0}
                />
                <span className="text-[var(--lime)]">{stat.suffix}</span>
              </div>
              <p className="mt-4 text-lg font-medium text-[var(--text-mid)]">
                {stat.label}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
