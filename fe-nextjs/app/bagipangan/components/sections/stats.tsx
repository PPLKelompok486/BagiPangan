"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { stats } from "../../data";
import { createFadeUpVariants, createStaggerContainer } from "../../lib/motion";
import { SectionHeader } from "../ui/section-header";

// Custom Vanilla JS Counter — zero React re-renders during animation
function AnimatedCounter({ end, duration = 1600 }: { end: number; duration?: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, amount: 0.5 });
  
  useEffect(() => {
    if (!isInView || !nodeRef.current) return;
    
    let startTime: number;
    let rafId: number;
    
    // EaseOutQuart
    const easeOut = (x: number): number => 1 - Math.pow(1 - x, 4);

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOut(progress);
      
      const currentValue = Math.floor(easedProgress * end);
      
      if (nodeRef.current) {
        nodeRef.current.textContent = currentValue.toLocaleString('id-ID');
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        if (nodeRef.current) nodeRef.current.textContent = end.toLocaleString('id-ID');
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, end, duration]);

  return <span ref={nodeRef}>0</span>;
}

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
        <SectionHeader
          align="center"
          description="Angka-angka ini adalah porsi nyata, keluarga nyata, dan kota nyata. Setiap entri dashboard dimulai dari satu donatur yang memilih berbagi."
          eyebrow="Dampak Nyata"
          title={
            <>
              Jejak Berbagi yang{" "}
              <span className="italic text-[var(--brand-600)]">Terus Bertumbuh</span>
            </>
          }
        />

        <motion.div
          animate={isInView ? "visible" : "hidden"}
          className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          initial="hidden"
          variants={createStaggerContainer(reducedMotion, 0.1)}
        >
          {stats.map((stat, index) => (
            <motion.article
              key={stat.label}
              className="group relative overflow-hidden rounded-[2rem] border border-[var(--brand-100)] bg-[var(--cream)] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[var(--brand-300)] hover:shadow-[0_24px_60px_rgba(13,43,26,0.15)] shadow-[var(--shadow-card)]"
              variants={createFadeUpVariants(reducedMotion)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="bagi-display flex items-end gap-1 text-5xl font-semibold text-[var(--brand-600)] md:text-6xl">
                  {reducedMotion ? (
                    <span>{stat.value.toLocaleString('id-ID')}</span>
                  ) : (
                    <AnimatedCounter end={stat.value} />
                  )}
                  <span className="text-[var(--lime)]">{stat.suffix}</span>
                </div>
                <motion.span
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-300)]/60 bg-[var(--brand-50)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-700)]"
                  initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : -8 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 300, damping: 22, delay: 0.6 + index * 0.12 }
                  }
                >
                  <TrendingUp className="h-3 w-3" strokeWidth={2.6} />
                  {stat.trend}
                </motion.span>
              </div>
              <p className="mt-4 text-lg font-medium text-[var(--text-mid)]">
                {stat.label}
                <span className="ml-1.5 text-sm text-[var(--text-mid)]/70">· {stat.trendLabel}</span>
              </p>

              {/* Animated progress bar — scaleX instead of width to avoid
                  Layout triggers on every animation frame */}
              <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--brand-100)]">
                <motion.div
                  className="h-full w-full rounded-full bg-[linear-gradient(90deg,var(--brand-600),var(--lime))]"
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : {
                          duration: 1.4,
                          delay: 0.3 + index * 0.15,
                          ease: [0.16, 1, 0.3, 1],
                        }
                  }
                  style={{ transformOrigin: "left" }}
                />
              </div>

              {/* Hover glow */}
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--lime)] opacity-0 blur-3xl transition-opacity group-hover:opacity-10"
                aria-hidden="true"
              />
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
