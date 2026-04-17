"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
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

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.7", "end 0.5"],
  });

  const lineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "68%"]);

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
          {/* Scroll-linked connecting line */}
          <motion.div
            className="absolute left-[16%] top-10 hidden h-px bg-[linear-gradient(90deg,var(--brand-300),var(--lime),var(--brand-300))] lg:block"
            style={{
              width: reducedMotion ? "68%" : lineWidth,
              opacity: isInView ? 1 : 0,
            }}
            transition={withMotionPreference(reducedMotion, { duration: 0.4 })}
          />

          <motion.div
            animate={isInView ? "visible" : "hidden"}
            className="grid gap-6 lg:grid-cols-3"
            initial="hidden"
            variants={createStaggerContainer(reducedMotion, 0.18)}
          >
            {steps.map((step, stepIndex) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.number}
                  className="group relative rounded-[2rem] border border-[var(--brand-100)] bg-white p-7 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[0_24px_60px_rgba(13,43,26,0.12)]"
                  variants={createFadeUpVariants(reducedMotion)}
                  whileHover={
                    reducedMotion
                      ? undefined
                      : { y: -6, borderColor: "var(--brand-300)" }
                  }
                  transition={{ type: "spring", stiffness: 260, damping: 25 }}
                >
                  <div className="flex items-start gap-5">
                    {/* Pulsing step number */}
                    <div className="relative">
                      <motion.div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[var(--brand-300)] text-sm font-bold text-[var(--brand-700)] transition-colors group-hover:border-[var(--brand-600)] group-hover:bg-[var(--brand-600)] group-hover:text-white"
                        initial={{ scale: reducedMotion ? 1 : 0.5, opacity: reducedMotion ? 1 : 0 }}
                        animate={isInView ? { scale: 1, opacity: 1 } : {}}
                        transition={
                          reducedMotion
                            ? { duration: 0 }
                            : {
                                type: "spring",
                                stiffness: 300,
                                damping: 15,
                                delay: 0.3 + stepIndex * 0.15,
                              }
                        }
                      >
                        {step.number}
                      </motion.div>
                      {/* Ripple effect */}
                      {isInView && !reducedMotion && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-[var(--brand-400)]"
                          initial={{ scale: 1, opacity: 0.6 }}
                          animate={{ scale: 1.8, opacity: 0 }}
                          transition={{
                            duration: 1,
                            delay: 0.4 + stepIndex * 0.15,
                            ease: "easeOut",
                          }}
                        />
                      )}
                    </div>

                    <div className="space-y-5">
                      <motion.div
                        className={cn(
                          "inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-700)] transition-colors",
                          "group-hover:bg-[var(--brand-600)] group-hover:text-white",
                        )}
                        whileHover={reducedMotion ? undefined : { rotate: 12, scale: 1.12 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
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
