import { cn } from "./cn";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE: Record<BadgeTone, string> = {
  success: "bg-(--status-success-soft) text-(--status-success)",
  warning: "bg-(--status-warning-soft) text-(--status-warning)",
  danger: "bg-(--status-danger-soft) text-(--status-danger)",
  info: "bg-(--status-info-soft) text-(--status-info)",
  neutral: "bg-(--brand-50) text-(--text-mid)",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-(--radius-pill) px-2.5 py-1 text-xs font-semibold",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
