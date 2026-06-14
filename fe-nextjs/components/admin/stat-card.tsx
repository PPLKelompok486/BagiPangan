"use client";

import CountUp from "react-countup";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  delta,
  deltaTone = "neutral",
  countUpTo,
  suffix,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  /** If set, animates a number to this value instead of rendering `value` statically. */
  countUpTo?: number;
  suffix?: string;
  className?: string;
}) {
  const deltaClass =
    deltaTone === "up"
      ? "text-(--status-success)"
      : deltaTone === "down"
        ? "text-(--status-danger)"
        : "text-(--text-mid)";

  return (
    <article
      className={cn(
        "rounded-(--radius-card) border border-(--brand-100) bg-white p-5 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-soft)",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-[0.12em] text-(--text-mid)">{label}</p>
        {Icon && (
          <span className="rounded-full bg-(--brand-50) p-2 text-(--brand-700)">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="bagi-display mt-3 text-4xl text-(--brand-900)">
        {typeof countUpTo === "number" ? (
          <CountUp end={countUpTo} duration={1.2} separator="." suffix={suffix} />
        ) : (
          value
        )}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {delta && (
          <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", deltaClass)}>
            {deltaTone === "up" && <ArrowUpRight className="h-3.5 w-3.5" />}
            {deltaTone === "down" && <ArrowDownRight className="h-3.5 w-3.5" />}
            {delta}
          </span>
        )}
        {hint && <p className="text-sm text-(--text-mid)">{hint}</p>}
      </div>
    </article>
  );
}
