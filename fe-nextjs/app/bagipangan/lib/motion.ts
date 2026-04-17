import type { MotionValue, Transition, Variants } from "framer-motion";

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function withMotionPreference(
  reducedMotion: boolean | null,
  transition: Transition,
): Transition {
  if (reducedMotion) {
    return { duration: 0 };
  }

  return transition;
}

export function createFadeUpVariants(
  reducedMotion: boolean | null,
  delay = 0,
  distance = 32,
): Variants {
  return {
    hidden: {
      opacity: reducedMotion ? 1 : 0,
      y: reducedMotion ? 0 : distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: withMotionPreference(reducedMotion, {
        duration: 0.72,
        delay,
        ease: easeOut,
      }),
    },
  };
}

export function createFadeSideVariants(
  reducedMotion: boolean | null,
  direction: "left" | "right",
  delay = 0,
): Variants {
  const distance = direction === "left" ? -60 : 60;

  return {
    hidden: {
      opacity: reducedMotion ? 1 : 0,
      x: reducedMotion ? 0 : distance,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: withMotionPreference(reducedMotion, {
        duration: 0.72,
        delay,
        ease: easeOut,
      }),
    },
  };
}

export function createStaggerContainer(
  reducedMotion: boolean | null,
  staggerChildren = 0.12,
  delayChildren = 0,
): Variants {
  return {
    hidden: {},
    visible: {
      transition: reducedMotion
        ? { duration: 0 }
        : {
            staggerChildren,
            delayChildren,
          },
    },
  };
}

/* ── Interactive animation helpers ─────────────────────────── */

export function createTextRevealVariants(
  reducedMotion: boolean | null,
  stagger = 0.04,
): { container: Variants; child: Variants } {
  return {
    container: {
      hidden: {},
      visible: {
        transition: reducedMotion
          ? { duration: 0 }
          : { staggerChildren: stagger, delayChildren: 0.1 },
      },
    },
    child: {
      hidden: {
        opacity: reducedMotion ? 1 : 0,
        y: reducedMotion ? 0 : 40,
        rotateX: reducedMotion ? 0 : 45,
        filter: reducedMotion ? "blur(0px)" : "blur(6px)",
      },
      visible: {
        opacity: 1,
        y: 0,
        rotateX: 0,
        filter: "blur(0px)",
        transition: withMotionPreference(reducedMotion, {
          duration: 0.6,
          ease: easeOut,
        }),
      },
    },
  };
}

export function createScaleSpringVariants(
  reducedMotion: boolean | null,
): Variants {
  return {
    hidden: {
      opacity: reducedMotion ? 1 : 0,
      scale: reducedMotion ? 1 : 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: reducedMotion
        ? { duration: 0 }
        : { type: "spring", stiffness: 260, damping: 20 },
    },
  };
}

export function createPulseVariants(
  reducedMotion: boolean | null,
): Variants {
  return {
    hidden: { scale: 1 },
    visible: {
      scale: reducedMotion ? 1 : [1, 1.15, 1],
      transition: reducedMotion
        ? { duration: 0 }
        : { duration: 0.6, ease: "easeOut" },
    },
  };
}

export function createShakeVariants(): Variants {
  return {
    idle: { x: 0 },
    shake: {
      x: [0, -8, 8, -6, 6, -3, 3, 0],
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };
}

/**
 * Computes 3D tilt transform values from mouse position relative to an element.
 * Returns { rotateX, rotateY } in degrees — feed these into motion style.
 */
export function compute3DTilt(
  mouseX: number,
  mouseY: number,
  rect: DOMRect,
  maxTilt = 12,
): { rotateX: number; rotateY: number } {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const percentX = (mouseX - centerX) / (rect.width / 2);
  const percentY = (mouseY - centerY) / (rect.height / 2);

  return {
    rotateX: -percentY * maxTilt,
    rotateY: percentX * maxTilt,
  };
}

/**
 * Computes spotlight gradient position from mouse relative to element.
 * Returns a CSS radial-gradient string.
 */
export function computeSpotlight(
  mouseX: number,
  mouseY: number,
  rect: DOMRect,
  color = "rgba(168, 230, 61, 0.08)",
  size = 280,
): string {
  const x = mouseX - rect.left;
  const y = mouseY - rect.top;
  return `radial-gradient(${size}px circle at ${x}px ${y}px, ${color}, transparent 70%)`;
}

/**
 * Computes magnetic pull offset for an element toward cursor.
 * Returns { x, y } offset in pixels.
 */
export function computeMagneticPull(
  mouseX: number,
  mouseY: number,
  rect: DOMRect,
  strength = 0.3,
  radius = 120,
): { x: number; y: number } | null {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const distX = mouseX - centerX;
  const distY = mouseY - centerY;
  const distance = Math.sqrt(distX * distX + distY * distY);

  if (distance > radius) return null;

  const pull = 1 - distance / radius;
  return {
    x: distX * strength * pull,
    y: distY * strength * pull,
  };
}
