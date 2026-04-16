"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { useRef } from "react";
import { testimonials } from "../../data";
import { createFadeUpVariants, createStaggerContainer } from "../../lib/motion";
import { SectionHeader } from "../ui/section-header";

export function Testimonials() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { amount: 0.15, once: true });

  return (
    <section
      className="bg-white px-4 py-20 sm:px-6 lg:px-10 lg:py-24"
      id="testimoni"
      ref={ref}
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          align="center"
          description="Donatur, penerima, dan relawan berbagi pengalaman mereka menggunakan BagiPangan untuk mendistribusikan makanan surplus."
          eyebrow="Testimoni"
          title="Cerita dari Komunitas Kami"
        />

        <motion.div
          animate={isInView ? "visible" : "hidden"}
          className="mt-14 grid gap-6 md:grid-cols-3"
          initial="hidden"
          variants={createStaggerContainer(reducedMotion, 0.12)}
        >
          {testimonials.map((t) => (
            <motion.article
              key={t.name}
              className="flex flex-col rounded-[2rem] border border-[var(--brand-100)] bg-[var(--cream)] p-7 shadow-[var(--shadow-card)]"
              variants={createFadeUpVariants(reducedMotion)}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-600)] text-sm font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-[var(--brand-900)]">
                    {t.name}
                  </p>
                  <p className="text-sm text-[var(--text-mid)]">
                    {t.role} · {t.location}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-[var(--lime)] text-[var(--lime)]"
                  />
                ))}
              </div>

              <p className="mt-4 flex-1 text-base leading-7 text-[var(--text-mid)]">
                &ldquo;{t.quote}&rdquo;
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
