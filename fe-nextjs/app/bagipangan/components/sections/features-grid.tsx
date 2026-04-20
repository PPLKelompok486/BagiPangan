"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { features } from "../../data";
import { cn } from "../../lib/cn";
import { createFadeUpVariants, createStaggerContainer, compute3DTilt, computeSpotlight } from "../../lib/motion";
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
  variants: any;
  spotlightColor: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [spotlight, setSpotlight] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const { rotateX, rotateY } = compute3DTilt(e.clientX, e.clientY, rect, 10);
      setTilt({ rotateX, rotateY });
      setSpotlight(computeSpotlight(e.clientX, e.clientY, rect, spotlightColor, 300));
    },
    [reducedMotion, spotlightColor],
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setSpotlight("");
    setIsHovered(false);
  }, []);

  return (
    <motion.article
      ref={cardRef}
      className={className}
      variants={variants}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: reducedMotion ? 0 : tilt.rotateX,
        rotateY: reducedMotion ? 0 : tilt.rotateY,
        y: isHovered && !reducedMotion ? -8 : 0,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      style={{ perspective: "600px", transformStyle: "preserve-3d" }}
    >
      {/* Spotlight overlay */}
      {spotlight && (
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-[2rem] transition-opacity duration-200"
          style={{ backgroundImage: spotlight, opacity: isHovered ? 1 : 0 }}
        />
      )}
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
                {isLarge && feature.image && (
                  <>
                    <img
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.28] transition-opacity duration-500 group-hover:opacity-[0.38]"
                      loading="lazy"
                      src={feature.image}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--brand-900)/70_0%,var(--brand-900)/40_60%,var(--brand-800)/20_100%)]"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(7,23,16,0.85) 0%, rgba(13,43,26,0.55) 55%, rgba(26,71,49,0.2) 100%)",
                      }}
                    />
                  </>
                )}

                <div
                  className={cn(
                    "relative z-20 flex h-full flex-col",
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
                        : { scale: 1.15, rotate: 12 }
                    }
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
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
              </TiltCard>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
