"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { features } from "../../data";
import { cn } from "../../lib/cn";
import { createFadeUpVariants, createStaggerContainer } from "../../lib/motion";
import { SectionHeader } from "../ui/section-header";

const sizeClasses: Record<string, string> = {
  large: "xl:col-span-2 xl:row-span-2",
  standard: "",
  wide: "xl:col-span-2",
  full: "xl:col-span-3",
};

export function FeaturesGrid() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { amount: 0.15, once: true });

  return (
    <section
      className="bg-white px-4 py-20 sm:px-6 lg:px-10 lg:py-24"
      id="fitur"
      ref={ref}
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          align="center"
          description="Semua yang dibutuhkan untuk mendistribusikan makanan surplus dari awal hingga laporan akhir tersusun dalam pengalaman yang ringan dan mudah dipahami."
          eyebrow="Fitur Utama"
          title="Semua yang Anda butuhkan"
        />

        <motion.div
          animate={isInView ? "visible" : "hidden"}
          className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          initial="hidden"
          variants={createStaggerContainer(reducedMotion, 0.1)}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            const size = feature.size ?? "standard";
            const isLarge = size === "large";
            const isFull = size === "full";

            return (
              <motion.article
                key={feature.title}
                className={cn(
                  "group rounded-[2rem] border border-[var(--brand-100)] p-7 shadow-[var(--shadow-card)]",
                  sizeClasses[size],
                  isFull
                    ? "bg-[var(--brand-600)] text-white"
                    : isLarge
                      ? "bg-[linear-gradient(135deg,var(--brand-900)_0%,var(--brand-700)_100%)] text-white"
                      : "bg-[var(--cream)]",
                )}
                variants={createFadeUpVariants(reducedMotion)}
                whileHover={
                  reducedMotion
                    ? undefined
                    : { y: -8, borderColor: "var(--brand-400)" }
                }
              >
                <div
                  className={cn(
                    "flex h-full flex-col",
                    isFull && "items-center text-center",
                  )}
                >
                  <motion.div
                    className={cn(
                      "flex items-center justify-center rounded-2xl",
                      isLarge || isFull
                        ? "h-16 w-16 bg-white/15 text-white"
                        : "h-14 w-14 bg-[var(--brand-100)] text-[var(--brand-700)]",
                    )}
                    whileHover={
                      reducedMotion
                        ? undefined
                        : { scale: 1.08, rotate: 8 }
                    }
                  >
                    <Icon className={isLarge ? "h-7 w-7" : "h-6 w-6"} />
                  </motion.div>
                  <h3
                    className={cn(
                      "mt-6 font-semibold",
                      isLarge
                        ? "text-3xl text-white"
                        : isFull
                          ? "text-2xl text-white"
                          : "text-2xl text-[var(--brand-900)]",
                    )}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-3 text-base leading-8",
                      isLarge || isFull
                        ? "text-white/75"
                        : "text-[var(--text-mid)]",
                    )}
                  >
                    {feature.description}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
