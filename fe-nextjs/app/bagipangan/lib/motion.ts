import type { Transition, Variants } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1] as const;

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
