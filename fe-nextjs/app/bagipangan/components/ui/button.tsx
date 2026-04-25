"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
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
    "relative inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold tracking-tight transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent overflow-hidden sm:px-6",
    variantStyles[variant],
    className,
  );
}

type Ripple = { id: number; x: number; y: number; size: number };

function useRipple(reducedMotion: boolean | null) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  const addRipple = useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const ripple: Ripple = {
        id: nextId.current++,
        x: e.clientX - rect.left - size / 2,
        y: e.clientY - rect.top - size / 2,
        size,
      };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    },
    [reducedMotion],
  );

  const rippleElements = ripples.map((ripple) => (
    <motion.span
      key={ripple.id}
      className="pointer-events-none absolute rounded-full bg-white/25"
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        left: ripple.x,
        top: ripple.y,
        width: ripple.size,
        height: ripple.size,
      }}
    />
  ));

  return { addRipple, rippleElements };
}

export function Button(props: LinkButtonProps | ActionButtonProps) {
  const reducedMotion = useReducedMotion();
  const { addRipple, rippleElements } = useRipple(reducedMotion);

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
          onMouseDown={addRipple}
        >
          {rippleElements}
          <span className="relative z-10">{linkProps.children}</span>
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
      onMouseDown={addRipple}
    >
      {rippleElements}
      <span className="relative z-10">{actionProps.children}</span>
    </motion.button>
  );
}
