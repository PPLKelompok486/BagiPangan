import { cn } from "../../lib/cn";

type SectionEyebrowProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionEyebrow({
  children,
  className,
}: Readonly<SectionEyebrowProps>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--brand-100)] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-700)] shadow-[0_12px_30px_rgba(13,43,26,0.06)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
