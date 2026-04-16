"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
  ariaLabel?: string;
};

type LinkButtonProps = BaseProps & {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

type ActionButtonProps = BaseProps & {
  href?: never;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-600)] text-white shadow-[0_18px_40px_rgba(45,122,79,0.22)] hover:bg-[var(--brand-500)] focus-visible:ring-[var(--brand-300)]",
  secondary:
    "border border-white/40 bg-white/8 text-white hover:border-white/60 hover:bg-white/14 focus-visible:ring-white/60",
  ghost:
    "border border-[var(--brand-100)]/70 bg-white/10 text-white hover:bg-white/16 focus-visible:ring-[var(--brand-300)]",
};

function sharedClassName(variant: ButtonVariant, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold tracking-tight transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:px-6",
    variantStyles[variant],
    className,
  );
}

export function Button(props: LinkButtonProps | ActionButtonProps) {
  const reducedMotion = useReducedMotion();
  const hover = reducedMotion
    ? {}
    : {
        scale: 1.02,
        y: -2,
        boxShadow: "0 20px 36px rgba(13, 43, 26, 0.16)",
      };
  const tap = reducedMotion ? {} : { scale: 0.98 };
  const variant = props.variant ?? "primary";

  if ("href" in props && props.href) {
    const linkProps = props as LinkButtonProps;
    return (
      <Link
        aria-label={linkProps.ariaLabel}
        className="inline-flex"
        href={linkProps.href}
        onClick={linkProps.onClick}
      >
        <motion.span
          className={sharedClassName(variant, linkProps.className)}
          whileHover={hover}
          whileTap={tap}
        >
          {linkProps.children}
        </motion.span>
      </Link>
    );
  }

  const actionProps = props as ActionButtonProps;
  return (
    <motion.button
      aria-label={actionProps.ariaLabel}
      className={sharedClassName(variant, actionProps.className)}
      onClick={actionProps.onClick}
      type={actionProps.type ?? "button"}
      whileHover={hover}
      whileTap={tap}
    >
      {actionProps.children}
    </motion.button>
  );
}
