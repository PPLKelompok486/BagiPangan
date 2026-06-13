import { cn } from "./cn";

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {breadcrumb && (
          <div className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-(--text-mid)">
            {breadcrumb}
          </div>
        )}
        <h1 className="bagi-display text-3xl text-(--brand-900)">{title}</h1>
        {description && <p className="mt-1 text-sm text-(--text-mid)">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
