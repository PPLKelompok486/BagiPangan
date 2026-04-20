"use client";

import { motion, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useCallback, useRef } from "react";
import { Button } from "../ui/button";
import {
  createStaggerContainer,
  createFadeUpVariants,
  withMotionPreference,
} from "../../lib/motion";
import { useSmoothScroll } from "../../providers/smooth-scroll-provider";

const words = ["Bagi", "Makanan,", "Kurangi", "Pemborosan"];

const blobs: Array<{
  className: string;
  animate: { x: number[]; y: number[]; scale: number[] };
  duration: number;
  parallaxSpeed: number;
}> = [
  {
    className: "left-[-10%] top-[10%] h-[26rem] w-[26rem] bg-[var(--brand-500)]",
    animate: { x: [0, 40, -10], y: [0, 30, -15], scale: [1, 1.08, 0.96] },
    duration: 18,
    parallaxSpeed: 0.15,
  },
  {
    className: "right-[-12%] top-[8%] h-[20rem] w-[20rem] bg-[var(--brand-400)]",
    animate: { x: [0, -28, 12], y: [0, 24, -18], scale: [1, 0.95, 1.06] },
    duration: 14,
    parallaxSpeed: 0.25,
  },
  {
    className: "left-[25%] bottom-[18%] h-[18rem] w-[18rem] bg-[var(--lime)]",
    animate: { x: [0, 20, -16], y: [0, -18, 14], scale: [1, 1.1, 0.94] },
    duration: 17,
    parallaxSpeed: 0.2,
  },
  {
    className: "right-[20%] bottom-[12%] h-[22rem] w-[22rem] bg-[var(--brand-300)]",
    animate: { x: [0, -20, 14], y: [0, 18, -10], scale: [1, 0.94, 1.04] },
    duration: 16,
    parallaxSpeed: 0.3,
  },
  {
    className: "left-[46%] top-[20%] h-[15rem] w-[15rem] bg-[var(--brand-600)]",
    animate: { x: [0, 18, -12], y: [0, -14, 8], scale: [1, 1.03, 0.97] },
    duration: 12,
    parallaxSpeed: 0.1,
  },
];

const chips: Array<{
  label: string;
  className: string;
  y: number[];
  duration: number;
}> = [
  {
    label: "1,200+ Donatur",
    className: "left-0 top-8 md:-left-8",
    y: [0, -14, 0],
    duration: 5.4,
  },
  {
    label: "Real-time",
    className: "right-6 top-20 md:right-0",
    y: [0, -10, 0],
    duration: 4.7,
  },
  {
    label: "Gratis 100%",
    className: "right-2 bottom-10 md:right-10",
    y: [0, -12, 0],
    duration: 5.9,
  },
];

function HeroMealPhoto() {
  return (
    <>
      <img
        alt="Seorang anak tersenyum saat menerima semangkuk makanan"
        className="h-full w-full rounded-[1.5rem] object-cover"
        loading="eager"
        src="/images/hero-meal.jpg"
        style={{ objectPosition: "50% 35%" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-t from-[var(--brand-900)]/75 via-[var(--brand-900)]/15 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-white/12"
      />
      {/* Caption pinned bottom-left over the gradient */}
      <div className="absolute bottom-5 left-5 right-5 flex items-center gap-2.5 text-xs font-medium tracking-wide text-white/85">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
        Setiap porsi adalah harapan yang tersalurkan
      </div>
    </>
  );
}

export function Hero() {
  const reducedMotion = useReducedMotion();
  const { scrollTo } = useSmoothScroll();
  const sectionRef = useRef<HTMLElement>(null);
  const bowlRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax transforms for blobs at different speeds
  const blobParallax = blobs.map((blob) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTransform(scrollYProgress, [0, 1], [0, -120 * blob.parallaxSpeed]),
  );

  // Interactive bowl tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bowlRotateX = useSpring(useTransform(mouseY, [-300, 300], [8, -8]), {
    stiffness: 150,
    damping: 20,
  });
  const bowlRotateY = useSpring(useTransform(mouseX, [-300, 300], [-8, 8]), {
    stiffness: 150,
    damping: 20,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion || !bowlRef.current) return;
      const rect = bowlRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    },
    [reducedMotion, mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <section
      className="bagi-noise relative isolate flex min-h-screen items-center overflow-hidden bg-[var(--brand-900)] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-10"
      id="hero"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 overflow-hidden">
        {blobs.map((blob, index) => (
          <motion.div
            key={blob.className}
            animate={reducedMotion ? undefined : blob.animate}
            className={`absolute rounded-full opacity-8 blur-3xl ${blob.className}`}
            style={{ y: reducedMotion ? 0 : blobParallax[index] }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    duration: blob.duration,
                    ease: "easeInOut",
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "mirror",
                  }
            }
          />
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <motion.div
          animate="visible"
          className="relative z-10 max-w-3xl pt-6"
          initial="hidden"
          variants={createStaggerContainer(reducedMotion, 0.14, 0.1)}
        >
          <motion.div
            className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white/90 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur"
            variants={createFadeUpVariants(reducedMotion)}
          >
            <motion.span
              animate={
                reducedMotion ? undefined : { opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }
              }
              className="h-2.5 w-2.5 rounded-full bg-[var(--lime)]"
              transition={
                reducedMotion ? { duration: 0 } : { duration: 1.8, repeat: Number.POSITIVE_INFINITY }
              }
            />
            Terhubung untuk donatur, penerima, dan relawan
          </motion.div>

          {/* Animated text reveal heading */}
          <motion.h1
            aria-label="Bagi Makanan, Kurangi Pemborosan"
            className="bagi-display bagi-text-balance text-5xl font-semibold leading-[0.95] sm:text-6xl lg:text-[5.2rem]"
            style={{ perspective: "600px" }}
            variants={createFadeUpVariants(reducedMotion, 0.04)}
          >
            <span className="flex flex-wrap gap-x-4 gap-y-3">
              {words.map((word, index) => (
                <motion.span
                  key={word}
                  className="inline-block"
                  transition={withMotionPreference(reducedMotion, {
                    duration: 0.7,
                    delay: index * 0.1,
                  })}
                  variants={{
                    hidden: {
                      opacity: reducedMotion ? 1 : 0,
                      y: reducedMotion ? 0 : 40,
                      rotateX: reducedMotion ? 0 : 45,
                      filter: reducedMotion ? "blur(0px)" : "blur(6px)",
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      filter: "blur(0px)",
                    },
                  }}
                >
                  <span className={word === "Makanan," ? "italic text-[var(--lime)]" : ""}>
                    {word}
                  </span>
                </motion.span>
              ))}
            </span>
          </motion.h1>

          <motion.p
            className="mt-7 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl"
            variants={createFadeUpVariants(reducedMotion, 0.18)}
          >
            Platform distribusi makanan berlebih yang membantu restoran, katering,
            dan rumah tangga menyalurkan porsi layak konsumsi dengan cepat, aman,
            dan transparan.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col gap-4 sm:flex-row"
            variants={createFadeUpVariants(reducedMotion, 0.26)}
          >
            <Button
              className="bg-[var(--lime)] text-[var(--brand-950)] hover:bg-[var(--brand-100)]"
              href="/register"
            >
              Mulai Berbagi
            </Button>
            <Button
              className="border-white/40 bg-transparent text-white"
              onClick={() => scrollTo("#dashboard")}
              variant="secondary"
            >
              Lihat Donasi
            </Button>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/65"
            variants={createFadeUpVariants(reducedMotion, 0.32)}
          >
            <span className="inline-flex items-center gap-2">
              <span className="bagi-display text-xl font-semibold text-[var(--lime)]">
                1 donasi
              </span>
              <span className="text-white/50">≈</span>
              <span className="bagi-display text-xl font-semibold text-white">
                12 porsi
              </span>
              <span className="text-white/65">tersalurkan</span>
            </span>
            <span aria-hidden="true" className="hidden h-4 w-px bg-white/20 sm:block" />
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
              Tanpa biaya — selamanya gratis
            </span>
          </motion.div>
        </motion.div>

        {/* Interactive bowl with 3D tilt */}
        <motion.div
          ref={bowlRef}
          className="relative z-10 mx-auto w-full max-w-[34rem]"
          initial={{ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : 48 }}
          transition={withMotionPreference(reducedMotion, {
            duration: 0.9,
            delay: 0.18,
            ease: [0.16, 1, 0.3, 1],
          })}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ amount: 0.3, once: true }}
          style={{
            perspective: "800px",
          }}
        >
          <motion.div
            className="relative rounded-[2rem] border border-white/12 bg-white/6 p-3 shadow-[0_24px_80px_rgba(5,12,8,0.35)] backdrop-blur-sm"
            style={
              reducedMotion
                ? undefined
                : {
                    rotateX: bowlRotateX,
                    rotateY: bowlRotateY,
                    transformStyle: "preserve-3d",
                  }
            }
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem]">
              <HeroMealPhoto />
            </div>

            {chips.map((chip) => (
              <motion.div
                key={chip.label}
                animate={reducedMotion ? undefined : { y: chip.y }}
                className={`absolute ${chip.className} rounded-full border border-white/20 bg-[var(--brand-900)]/70 px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(0,0,0,0.24)] backdrop-blur-md`}
                transition={{
                  duration: reducedMotion ? 0 : chip.duration,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                }}
                whileHover={
                  reducedMotion
                    ? undefined
                    : { scale: 1.08, borderColor: "rgba(168, 230, 61, 0.5)" }
                }
              >
                {chip.label}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.button
        animate={reducedMotion ? undefined : { y: [0, 8, 0] }}
        className="absolute bottom-8 left-1/2 z-10 inline-flex -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold tracking-[0.28em] text-white/65"
        onClick={() => scrollTo("#statistik")}
        transition={{
          duration: reducedMotion ? 0 : 1.9,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
        type="button"
      >
        SCROLL
        <ChevronDown className="h-4 w-4" />
      </motion.button>
    </section>
  );
}
