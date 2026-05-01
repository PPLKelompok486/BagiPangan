"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

const EASE_OUT_QUART: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Animated number counter — shared utility to avoid bundle duplication
 * between DonaturDashboard and ReceiverDashboard.
 */
export function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: EASE_OUT_QUART });
    return () => controls.stop();
  }, [mv, value]);

  return <motion.span aria-label={String(value)}>{rounded}</motion.span>;
}
