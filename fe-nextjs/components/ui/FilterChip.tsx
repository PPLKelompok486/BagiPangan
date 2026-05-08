"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type FilterChipTone = "default" | "hot" | "warm";

type Props = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  tone?: FilterChipTone;
  count?: number;
};

/**
 * Shared pill-shaped filter chip used across donor and receiver dashboards.
 *
 * Visual styling matches the original copies in donor/receiver pages:
 *   - rounded-full, motion-button with whileTap scale
 *   - active state varies by `tone` (brand / hot=red / warm=amber)
 *   - optional `count` badge appears on the right
 */
export function FilterChip({
  active,
  onClick,
  children,
  disabled,
  tone = "default",
  count,
}: Props) {
  const activeClass = active
    ? tone === "hot"
      ? "bg-red-600 text-white border-red-600"
      : tone === "warm"
        ? "bg-amber-500 text-white border-amber-500"
        : "bg-[var(--brand-600)] text-white border-[var(--brand-600)]"
    : "bg-white text-[var(--text-mid)] border-[var(--brand-100)] hover:border-[var(--brand-300)] hover:text-[var(--brand-700)]";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      aria-pressed={active}
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors",
        activeClass,
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      {typeof count === "number" && count > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full inline-flex items-center justify-center ${
            active ? "bg-white/25" : "bg-[var(--brand-50)] text-[var(--brand-700)]"
          }`}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}
