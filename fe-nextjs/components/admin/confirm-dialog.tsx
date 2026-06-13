"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "./cn";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  tone = "danger",
  requireReason = false,
  reasonLabel = "Alasan",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "brand";
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  const confirmClass =
    tone === "danger"
      ? "bg-(--status-danger) text-white hover:opacity-90"
      : "bg-(--brand-700) text-white hover:bg-(--brand-600)";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-(--radius-card) bg-white p-6 shadow-(--shadow-soft)"
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-(--brand-900)">{title}</h3>
            {description && <div className="mt-2 text-sm text-(--text-mid)">{description}</div>}
            {requireReason && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonLabel}
                rows={3}
                className="mt-4 w-full rounded-xl border border-(--brand-100) p-3 text-sm outline-none focus:border-(--brand-400) focus:ring-2 focus:ring-(--brand-100)"
              />
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-(--radius-pill) border border-(--brand-200) px-4 py-2 text-sm font-semibold text-(--brand-700) hover:bg-(--brand-50)"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => onConfirm(requireReason ? reason : undefined)}
                disabled={requireReason && reason.trim().length === 0}
                className={cn(
                  "rounded-(--radius-pill) px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  confirmClass,
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
