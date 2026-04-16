import { cn } from "../../lib/cn";

type BrandMarkProps = {
  className?: string;
  inverse?: boolean;
};

export function BrandMark({
  className,
  inverse = false,
}: Readonly<BrandMarkProps>) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl shadow-[0_14px_30px_rgba(13,43,26,0.16)]",
          inverse ? "bg-white/12 text-white" : "bg-[var(--brand-600)] text-white",
        )}
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 13.5h7.25c3.1 0 5.28-1.2 6.75-4.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M14.25 5.75 19 9.25l-3.75 4.25"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M6.5 18.25c1.9-.55 3.35-1.65 4.35-3.3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </span>
      <span
        className={cn(
          "bagi-display text-2xl font-semibold tracking-tight",
          inverse ? "text-white" : "text-[var(--brand-900)]",
        )}
      >
        BagiPangan
      </span>
    </div>
  );
}
