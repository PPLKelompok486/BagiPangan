"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { steps } from "../../data";
import { cn } from "../../lib/cn";
import {
  createFadeUpVariants,
  createStaggerContainer,
  withMotionPreference,
} from "../../lib/motion";
import { SectionHeader } from "../ui/section-header";

export function HowItWorks() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { amount: 0.2, once: true });

  return (
    <section
      className="bg-[var(--brand-50)] px-4 py-20 sm:px-6 lg:px-10 lg:py-24"
      id="cara-kerja"
      ref={ref}
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          align="center"
          description="BagiPangan dirancang untuk membuat distribusi makanan surplus terasa sejelas produk digital modern, namun tetap hangat dan manusiawi."
          eyebrow="Cara Kerja"
          title={
            <>
              Sederhana. Cepat. <span className="italic text-[var(--brand-600)]">Berdampak.</span>
            </>
          }
        />

        <div className="relative mt-14 lg:mt-16">
          <motion.div
            animate={
              isInView
                ? { width: "68%", opacity: 1 }
                : { width: "0%", opacity: reducedMotion ? 1 : 0 }
            }
            className="absolute left-[16%] top-10 hidden h-px bg-[linear-gradient(90deg,var(--brand-300),var(--lime),var(--brand-300))] lg:block"
            transition={withMotionPreference(reducedMotion, {
              duration: 0.9,
              ease: "easeOut",
            })}
          />

          <motion.div
            animate={isInView ? "visible" : "hidden"}
            className="grid gap-6 lg:grid-cols-3"
            initial="hidden"
            variants={createStaggerContainer(reducedMotion, 0.14)}
          >
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.number}
                  className="group relative rounded-[2rem] border border-[var(--brand-100)] bg-white p-7 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-[var(--brand-300)]"
                  variants={createFadeUpVariants(reducedMotion)}
                >
                  <div className="flex items-start gap-5">
                    <motion.div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--brand-300)] text-sm font-bold text-[var(--brand-700)]"
                      whileHover={
                        reducedMotion
                          ? undefined
                          : { backgroundColor: "var(--brand-600)", color: "white" }
                      }
                    >
                      {step.number}
                    </motion.div>

                    <div className="space-y-5">
                      <motion.div
                        className={cn(
                          "inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-700)] transition-colors",
                          "group-hover:bg-[var(--brand-600)] group-hover:text-white",
                        )}
                        whileHover={reducedMotion ? undefined : { rotate: 8, scale: 1.06 }}
                      >
                        <Icon className="h-6 w-6" />
                      </motion.div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-semibold text-[var(--brand-900)]">
                          {step.title}
                        </h3>
                        <p className="text-base leading-8 text-[var(--text-mid)]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
