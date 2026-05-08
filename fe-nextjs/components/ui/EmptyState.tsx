"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { easeOut } from "@/app/bagipangan/lib/motion";

type Props = {
  icon?: ReactNode;
  title: string;
  /** Description text shown below the title. Either `description` or `body` may be used. */
  description?: string;
  /** Alias for `description` retained for backward compatibility with existing call sites. */
  body?: string;
  action?: ReactNode;
  className?: string;
};

/**
 * Shared "no results / empty" panel used by donor and receiver donation lists.
 *
 * The default look matches the previous local copies: a soft-bordered white card
 * with a centred icon, title, and supporting copy.
 */
export function EmptyState({ icon, title, description, body, action, className }: Props) {
  const text = description ?? body;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className={
        className ??
        "rounded-3xl border border-[var(--brand-100)] bg-white p-10 text-center"
      }
    >
      <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)]">
        {icon ?? <Package className="h-6 w-6" />}
      </div>
      <h2 className="bagi-display text-2xl font-semibold text-[var(--brand-950)]">
        {title}
      </h2>
      {text && (
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-mid)]">{text}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </motion.div>
  );
}
