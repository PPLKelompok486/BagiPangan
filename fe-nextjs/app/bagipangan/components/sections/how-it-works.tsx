"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Clock } from "lucide-react";
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
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-[var(--brand-100)] bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[0_24px_60px_rgba(13,43,26,0.12)]"
                  variants={createFadeUpVariants(reducedMotion)}
                  whileHover={
                    reducedMotion
                      ? undefined
                      : { y: -6, borderColor: "var(--brand-300)" }
                  }
                  transition={{ type: "spring", stiffness: 260, damping: 25 }}
                >
                  <div className="relative h-44 overflow-hidden bg-[var(--brand-50)]">
                    <img
                      alt={step.imageAlt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      loading="lazy"
                      src={step.image}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent"
                    />
                    {/* Step number floats over the image */}
                    <div className="absolute left-5 top-5">
                      <motion.div
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-[var(--brand-900)]/80 text-xs font-bold tracking-[0.12em] text-white backdrop-blur"
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
                    </div>
                    {/* Icon chip bottom-right */}
                    <motion.div
                      className={cn(
                        "absolute right-5 bottom-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--brand-700)] shadow-[0_10px_24px_rgba(13,43,26,0.18)] transition-colors",
                        "group-hover:bg-[var(--brand-600)] group-hover:text-white",
                      )}
                      whileHover={reducedMotion ? undefined : { rotate: 10, scale: 1.08 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-7">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-2xl font-semibold text-[var(--brand-900)]">
                        {step.title}
                      </h3>
                      <motion.span
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--brand-50)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-700)]"
                        initial={{
                          opacity: reducedMotion ? 1 : 0,
                          scale: reducedMotion ? 1 : 0.7,
                        }}
                        transition={
                          reducedMotion
                            ? { duration: 0 }
                            : {
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                                delay: 0.5 + stepIndex * 0.15,
                              }
                        }
                      >
                        <Clock className="h-3 w-3" strokeWidth={2.6} />
                        {step.duration}
                      </motion.span>
                    </div>
                    <p className="text-base leading-8 text-[var(--text-mid)]">
                      {step.description}
                    </p>
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
