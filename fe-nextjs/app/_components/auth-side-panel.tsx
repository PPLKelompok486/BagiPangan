"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Leaf, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";

type Benefit = {
  icon: LucideIcon;
  text: string;
};

const defaultBenefits: Benefit[] = [
  {
    icon: Sparkles,
    text: "Listing makanan dalam hitungan menit, dengan alur yang ringkas.",
  },
  {
    icon: ShieldCheck,
    text: "Setiap pengambilan divalidasi foto agar donasi tetap transparan.",
  },
  {
    icon: Leaf,
    text: "Gratis selamanya — untuk donatur, penerima, dan relawan.",
  },
];

type AuthSidePanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  benefits?: Benefit[];
  socialProof?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export function AuthSidePanel({
  eyebrow,
  title,
  description,
  benefits = defaultBenefits,
  socialProof = "Bergabung dengan 800+ donatur & penerima di 20+ kota",
  imageSrc = "/images/auth-community.jpg",
  imageAlt = "",
}: AuthSidePanelProps) {
  const reducedMotion = useReducedMotion();
  const rm = reducedMotion ?? false;

  return (
    <motion.aside
      className="relative hidden w-1/2 overflow-hidden bg-[var(--brand-900)] lg:block"
      initial={{ opacity: rm ? 1 : 0, x: rm ? 0 : -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={rm ? { duration: 0 } : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Photographic backdrop */}
      <img
        alt={imageAlt}
        aria-hidden={imageAlt ? undefined : "true"}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        loading="eager"
        src={imageSrc}
      />

      {/* Gradient darkening — keeps text legible, mood warm */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(7,23,16,0.92) 0%, rgba(13,43,26,0.76) 50%, rgba(26,71,49,0.58) 100%)",
        }}
      />

      {/* Soft animated glows for motion parity with landing */}
      <motion.div
        aria-hidden="true"
        className="absolute left-[-10%] top-[12%] h-72 w-72 rounded-full bg-[var(--brand-600)] opacity-20 blur-3xl"
        animate={rm ? undefined : { scale: [1, 1.1, 1], x: [0, 20, 0] }}
        transition={rm ? { duration: 0 } : { duration: 14, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute right-[-8%] bottom-[18%] h-64 w-64 rounded-full bg-[var(--lime)] opacity-15 blur-3xl"
        animate={rm ? undefined : { scale: [1, 1.15, 1], y: [0, -15, 0] }}
        transition={rm ? { duration: 0 } : { duration: 12, repeat: Infinity, repeatType: "mirror" }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-600)] text-white shadow-lg">
            <span className="text-base font-bold tracking-tight">BP</span>
          </div>
          <span className="bagi-display text-lg font-semibold text-white">
            BagiPangan
          </span>
        </div>

        <div className="max-w-md">
          <motion.span
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 backdrop-blur"
            initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={rm ? { duration: 0 } : { duration: 0.5, delay: 0.2 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
            {eyebrow}
          </motion.span>

          <motion.h1
            className="bagi-display mt-5 text-4xl font-semibold leading-[1.05] text-white"
            initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={rm ? { duration: 0 } : { duration: 0.6, delay: 0.28 }}
          >
            {title}
          </motion.h1>

          <motion.p
            className="mt-5 text-base leading-7 text-white/75"
            initial={{ opacity: rm ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={rm ? { duration: 0 } : { duration: 0.6, delay: 0.36 }}
          >
            {description}
          </motion.p>

          <div className="mt-9 space-y-3">
            {benefits.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.text}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm"
                  initial={{ opacity: rm ? 1 : 0, x: rm ? 0 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={rm ? { duration: 0 } : { duration: 0.5, delay: 0.48 + i * 0.08 }}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-600)] text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-relaxed text-white/85">
                    {item.text}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          className="flex items-center gap-3 text-sm text-white/70"
          initial={{ opacity: rm ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={rm ? { duration: 0 } : { duration: 0.5, delay: 0.8 }}
        >
          <div className="flex -space-x-2">
            {["testimonial-rina.jpg", "testimonial-ahmad.jpg", "testimonial-dewi.jpg"].map(
              (src) => (
                <img
                  key={src}
                  alt=""
                  aria-hidden="true"
                  className="h-8 w-8 rounded-full border-2 border-[var(--brand-900)] object-cover"
                  loading="lazy"
                  src={`/images/${src}`}
                />
              ),
            )}
          </div>
          <span className="leading-snug">{socialProof}</span>
        </motion.div>
      </div>
    </motion.aside>
  );
}
