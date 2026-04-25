"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useSmoothScroll } from "../../providers/smooth-scroll-provider";

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScrollToTop() {
  const reducedMotion = useReducedMotion();
  const { scrollTo } = useSmoothScroll();
  const [visible, setVisible] = useState(false);

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });
  const dashOffset = useTransform(
    smoothProgress,
    (value) => CIRCUMFERENCE * (1 - value),
  );

  useEffect(() => {
    const handle = () => setVisible(window.scrollY > 640);
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const handleClick = () => {
    scrollTo("#hero", 0);
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          aria-label="Kembali ke atas"
          className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-[var(--brand-900)]/92 text-white shadow-[0_18px_40px_rgba(5,12,8,0.35)] backdrop-blur transition-colors hover:bg-[var(--brand-800)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lime)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cream)] sm:bottom-8 sm:right-8"
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: reducedMotion ? 1 : 0.8,
            y: reducedMotion ? 0 : 12,
          }}
          initial={{
            opacity: 0,
            scale: reducedMotion ? 1 : 0.8,
            y: reducedMotion ? 0 : 12,
          }}
          onClick={handleClick}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 320, damping: 24 }
          }
          type="button"
          whileHover={reducedMotion ? undefined : { scale: 1.06 }}
          whileTap={reducedMotion ? undefined : { scale: 0.94 }}
        >
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 56 56"
          >
            <circle
              cx="28"
              cy="28"
              fill="none"
              r={RADIUS}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="3"
            />
            <motion.circle
              cx="28"
              cy="28"
              fill="none"
              r={RADIUS}
              stroke="var(--lime)"
              strokeDasharray={CIRCUMFERENCE}
              strokeLinecap="round"
              strokeWidth="3"
              style={{
                strokeDashoffset: reducedMotion ? 0 : dashOffset,
              }}
            />
          </svg>
          <ArrowUp className="relative h-5 w-5" strokeWidth={2.4} />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
