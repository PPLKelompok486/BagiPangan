"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import {
  createFadeUpVariants,
  createStaggerContainer,
  withMotionPreference,
} from "../../lib/motion";
import { useSmoothScroll } from "../../providers/smooth-scroll-provider";

const words = ["Bagi", "Makanan,", "Kurangi", "Pemborosan"];

const blobs: Array<{
  className: string;
  animate: { x: number[]; y: number[]; scale: number[] };
  duration: number;
}> = [
  {
    className: "left-[-10%] top-[10%] h-[26rem] w-[26rem] bg-[var(--brand-500)]",
    animate: { x: [0, 40, -10], y: [0, 30, -15], scale: [1, 1.08, 0.96] },
    duration: 18,
  },
  {
    className: "right-[-12%] top-[8%] h-[20rem] w-[20rem] bg-[var(--brand-400)]",
    animate: { x: [0, -28, 12], y: [0, 24, -18], scale: [1, 0.95, 1.06] },
    duration: 14,
  },
  {
    className: "left-[25%] bottom-[18%] h-[18rem] w-[18rem] bg-[var(--lime)]",
    animate: { x: [0, 20, -16], y: [0, -18, 14], scale: [1, 1.1, 0.94] },
    duration: 17,
  },
  {
    className: "right-[20%] bottom-[12%] h-[22rem] w-[22rem] bg-[var(--brand-300)]",
    animate: { x: [0, -20, 14], y: [0, 18, -10], scale: [1, 0.94, 1.04] },
    duration: 16,
  },
  {
    className: "left-[46%] top-[20%] h-[15rem] w-[15rem] bg-[var(--brand-600)]",
    animate: { x: [0, 18, -12], y: [0, -14, 8], scale: [1, 1.03, 0.97] },
    duration: 12,
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

function FoodBowlIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="h-full w-full"
      fill="none"
      viewBox="0 0 500 500"
    >
      <defs>
        <linearGradient id="bowlBase" x1="86" x2="414" y1="220" y2="390">
          <stop offset="0%" stopColor="var(--brand-700)" />
          <stop offset="100%" stopColor="var(--brand-900)" />
        </linearGradient>
        <linearGradient id="bowlInner" x1="150" x2="352" y1="110" y2="240">
          <stop offset="0%" stopColor="rgba(255,255,255,0.94)" />
          <stop offset="100%" stopColor="rgba(240,251,244,0.88)" />
        </linearGradient>
      </defs>

      <path
        d="M138 254C150 328 195 383 250 383c55 0 100-55 112-129H138Z"
        fill="url(#bowlBase)"
      />
      <path
        d="M134 248c0-18 14-32 32-32h168c18 0 32 14 32 32H134Z"
        fill="var(--brand-800)"
      />
      <ellipse cx="250" cy="222" fill="url(#bowlInner)" rx="112" ry="48" />
      {[
        [176, 198],
        [213, 182],
        [250, 194],
        [291, 178],
        [329, 198],
        [207, 220],
        [254, 224],
        [302, 214],
        [170, 225],
        [338, 222],
      ].map(([cx, cy], index) => (
        <ellipse
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          fill={index % 3 === 0 ? "var(--lime)" : "white"}
          opacity={index % 3 === 0 ? 0.92 : 0.96}
          rx={index % 2 === 0 ? 18 : 14}
          ry={index % 2 === 0 ? 12 : 10}
        />
      ))}
      <path
        d="M188 166c17-24 43-36 71-36 34 0 64 17 83 47"
        stroke="var(--brand-300)"
        strokeLinecap="round"
        strokeWidth="10"
      />
      <path
        d="M306 147c8-20 23-32 44-36"
        stroke="var(--lime)"
        strokeLinecap="round"
        strokeWidth="9"
      />
      <path
        d="M176 174c-8-18-23-29-42-33"
        stroke="var(--brand-400)"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <path
        d="M250 110c0-20 12-34 12-50"
        stroke="rgba(255,255,255,0.9)"
        strokeLinecap="round"
        strokeWidth="5"
      >
        <animate
          attributeName="d"
          dur="3.2s"
          repeatCount="indefinite"
          values="M250 110c0-20 12-34 12-50;M252 110c0-18 7-34 5-50;M250 110c0-20 12-34 12-50"
        />
      </path>
      <path
        d="M288 118c0-16 10-28 8-43"
        stroke="rgba(255,255,255,0.76)"
        strokeLinecap="round"
        strokeWidth="4"
      >
        <animate
          attributeName="d"
          dur="2.8s"
          repeatCount="indefinite"
          values="M288 118c0-16 10-28 8-43;M286 118c0-15 5-27 2-43;M288 118c0-16 10-28 8-43"
        />
      </path>
      <path
        d="M214 118c0-18 9-31 6-47"
        stroke="rgba(255,255,255,0.68)"
        strokeLinecap="round"
        strokeWidth="4"
      >
        <animate
          attributeName="d"
          dur="3s"
          repeatCount="indefinite"
          values="M214 118c0-18 9-31 6-47;M216 118c0-15 4-31 0-47;M214 118c0-18 9-31 6-47"
        />
      </path>
    </svg>
  );
}

export function Hero() {
  const reducedMotion = useReducedMotion();
  const { scrollTo } = useSmoothScroll();

  return (
    <section
      className="bagi-noise relative isolate flex min-h-screen items-center overflow-hidden bg-[var(--brand-900)] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-10"
      id="hero"
    >
      <div className="absolute inset-0 overflow-hidden">
        {blobs.map((blob) => (
          <motion.div
            key={blob.className}
            animate={reducedMotion ? undefined : blob.animate}
            className={`absolute rounded-full opacity-8 blur-3xl ${blob.className}`}
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

          <motion.h1
            aria-label="Bagi Makanan, Kurangi Pemborosan"
            className="bagi-display bagi-text-balance text-5xl font-semibold leading-[0.95] sm:text-6xl lg:text-[5.2rem]"
            variants={createFadeUpVariants(reducedMotion, 0.04)}
          >
            <span className="flex flex-wrap gap-x-4 gap-y-3">
              {words.map((word, index) => (
                <motion.span
                  key={word}
                  transition={withMotionPreference(reducedMotion, {
                    duration: 0.7,
                    delay: index * 0.08,
                  })}
                  variants={{
                    hidden: { opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 28 },
                    visible: { opacity: 1, y: 0 },
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
        </motion.div>

        <motion.div
          className="relative z-10 mx-auto w-full max-w-[34rem]"
          initial={{ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : 48 }}
          transition={withMotionPreference(reducedMotion, {
            duration: 0.9,
            delay: 0.18,
            ease: [0.16, 1, 0.3, 1],
          })}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ amount: 0.3, once: true }}
        >
          <div className="relative rounded-[2rem] border border-white/12 bg-white/6 px-5 py-7 shadow-[0_24px_80px_rgba(5,12,8,0.28)] backdrop-blur-sm sm:px-8">
            <motion.div
              animate={reducedMotion ? undefined : { rotate: 360 }}
              className="bagi-ring left-[18%] top-[12%] h-56 w-56"
              transition={{
                duration: reducedMotion ? 0 : 28,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
              }}
            />
            <motion.div
              animate={reducedMotion ? undefined : { rotate: -360 }}
              className="bagi-ring right-[10%] top-[18%] h-80 w-80"
              transition={{
                duration: reducedMotion ? 0 : 36,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
              }}
            />

            <motion.div
              animate={reducedMotion ? undefined : { y: [0, -14, 0] }}
              className="relative z-10 mx-auto aspect-square max-w-md"
              transition={{
                duration: reducedMotion ? 0 : 4.8,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "mirror",
              }}
            >
              <FoodBowlIllustration />
            </motion.div>

            {chips.map((chip) => (
              <motion.div
                key={chip.label}
                animate={reducedMotion ? undefined : { y: chip.y }}
                className={`absolute ${chip.className} rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(0,0,0,0.16)] backdrop-blur`}
                transition={{
                  duration: reducedMotion ? 0 : chip.duration,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                {chip.label}
              </motion.div>
            ))}
          </div>
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
