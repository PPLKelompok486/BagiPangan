import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-(--radius-card) border border-dashed border-(--brand-100) bg-(--brand-50)/40 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="rounded-full bg-(--brand-100) p-3 text-(--brand-700)">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-base font-bold text-(--brand-900)">{title}</h3>
      {description && <p className="max-w-sm text-sm text-(--text-mid)">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
