import { cn } from "../../lib/cn";
import { SectionEyebrow } from "./section-eyebrow";

type SectionHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: Readonly<SectionHeaderProps>) {
  return (
    <div
      className={cn(
        "space-y-5",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
      <div className="space-y-4">
        <h2 className="bagi-display bagi-text-balance text-4xl font-semibold leading-tight text-[var(--brand-900)] md:text-5xl">
          {title}
        </h2>
        <p className="max-w-2xl text-base leading-8 text-[var(--text-mid)] md:text-lg">
          {description}
        </p>
      </div>
    </div>
  );
}
