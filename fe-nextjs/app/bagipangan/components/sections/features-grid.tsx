"use client";

import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform, type Variants } from "framer-motion";
import { useCallback, useRef } from "react";
import { features } from "../../data";
import { cn } from "../../lib/cn";
import { createFadeUpVariants, createStaggerContainer, computeSpotlight } from "../../lib/motion";
import { SectionHeader } from "../ui/section-header";

const sizeClasses: Record<string, string> = {
  large: "xl:col-span-2 xl:row-span-2",
  standard: "",
  wide: "xl:col-span-2",
  full: "xl:col-span-3",
};

function TiltCard({
  children,
  className,
  reducedMotion,
  variants,
  spotlightColor,
}: {
  children: React.ReactNode;
  className: string;
  reducedMotion: boolean | null;
  variants: Variants;
  spotlightColor: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  // Cache rect on mouseEnter — avoids forced layout read on every mousemove
  const cachedRect = useRef<DOMRect | null>(null);

  // useMotionValue + useSpring → tilt updates skip React render cycle entirely
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 260, damping: 25 });
  const rotateY = useSpring(rawRotateY, { stiffness: 260, damping: 25 });
  const y = useSpring(rawY, { stiffness: 260, damping: 25 });

  const handleMouseEnter = useCallback(() => {
    // Single getBoundingClientRect() read on enter — not on every move
    if (reducedMotion || !cardRef.current) return;
    cachedRect.current = cardRef.current.getBoundingClientRect();
    rawY.set(-8);
    if (cardRef.current) {
      cardRef.current.style.willChange = "transform";
    }
  }, [reducedMotion, rawY]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion || !cachedRect.current) return;
      const rect = cachedRect.current;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const percentX = (e.clientX - centerX) / (rect.width / 2);
      const percentY = (e.clientY - centerY) / (rect.height / 2);

      // Write motion values directly — zero React re-renders
      rawRotateX.set(-percentY * 10);
      rawRotateY.set(percentX * 10);

      // Write spotlight directly to DOM via ref — no setState, no re-render
      if (spotlightRef.current) {
        spotlightRef.current.style.backgroundImage = computeSpotlight(
          e.clientX,
          e.clientY,
          rect,
          spotlightColor,
          300,
        );
        spotlightRef.current.style.opacity = "1";
      }
    },
    [reducedMotion, rawRotateX, rawRotateY, spotlightColor],
  );

  const handleMouseLeave = useCallback(() => {
    cachedRect.current = null;
    rawRotateX.set(0);
    rawRotateY.set(0);
    rawY.set(0);
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = "0";
    }
    if (cardRef.current) {
      cardRef.current.style.willChange = "auto";
    }
  }, [rawRotateX, rawRotateY, rawY]);

  return (
    <motion.article
      ref={cardRef}
      className={className}
      variants={variants}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        reducedMotion
          ? { perspective: "600px" }
          : { perspective: "600px", transformStyle: "preserve-3d", rotateX, rotateY, y }
      }
    >
      {/* Spotlight overlay — updated via direct DOM ref, no re-renders */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[2rem]"
        style={{ opacity: 0, transition: "opacity 200ms" }}
      />
      {children}
    </motion.article>
  );
}

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
            const spotlightColor =
              isLarge || isFull
                ? "rgba(168, 230, 61, 0.12)"
                : "rgba(45, 122, 79, 0.08)";

            return (
              <TiltCard
                key={feature.title}
                className={cn(
                  "group relative overflow-hidden rounded-[2rem] border border-[var(--brand-100)] p-7 shadow-[var(--shadow-card)] transition-shadow duration-300",
                  sizeClasses[size],
                  isFull
                    ? "bg-[var(--brand-600)] text-white hover:shadow-[0_24px_60px_rgba(45,122,79,0.25)]"
                    : isLarge
                      ? "bg-[linear-gradient(135deg,var(--brand-900)_0%,var(--brand-700)_100%)] text-white hover:shadow-[0_24px_60px_rgba(13,43,26,0.3)]"
                      : "bg-[var(--cream)] hover:shadow-[0_24px_60px_rgba(13,43,26,0.12)]",
                )}
                reducedMotion={reducedMotion}
                variants={createFadeUpVariants(reducedMotion)}
                spotlightColor={spotlightColor}
              >
                <div
                  className={cn(
                    "relative z-20 flex h-full flex-col",
                    isFull && "items-center text-center",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-2xl transition-all duration-300",
                      isLarge || isFull
                        ? "h-16 w-16 bg-white/15 text-white"
                        : "h-14 w-14 bg-[var(--brand-100)] text-[var(--brand-700)]",
                      "group-hover:scale-110 group-hover:rotate-6"
                    )}
                  >
                    <Icon className={isLarge ? "h-7 w-7" : "h-6 w-6"} />
                  </div>
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
              </TiltCard>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
