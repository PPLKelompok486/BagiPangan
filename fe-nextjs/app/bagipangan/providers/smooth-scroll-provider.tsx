"use client";

import {
  MotionConfig,
  useReducedMotion as useFramerReducedMotion,
} from "framer-motion";
import Lenis from "lenis";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

type ScrollTarget = string | HTMLElement;

type SmoothScrollContextValue = {
  scrollTo: (target: ScrollTarget, offset?: number) => void;
};

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

export function SmoothScrollProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lenisRef = useRef<Lenis | null>(null);
  const reducedMotion = useFramerReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }

    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.05,
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: 1.1,
    });

    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  const scrollTo = useCallback(
    (target: ScrollTarget, offset = -96) => {
      if (reducedMotion || !lenisRef.current) {
        const element =
          typeof target === "string"
            ? document.querySelector<HTMLElement>(target)
            : target;

        if (element) {
          element.scrollIntoView({ behavior: "auto", block: "start" });
        }

        return;
      }

      lenisRef.current.scrollTo(target, { offset });
    },
    [reducedMotion],
  );

  const value = useMemo(
    () => ({
      scrollTo,
    }),
    [scrollTo],
  );

  return (
    <MotionConfig reducedMotion="user">
      <SmoothScrollContext.Provider value={value}>
        {children}
      </SmoothScrollContext.Provider>
    </MotionConfig>
  );
}

export function useSmoothScroll() {
  const context = useContext(SmoothScrollContext);

  if (!context) {
    throw new Error("useSmoothScroll must be used within SmoothScrollProvider.");
  }

  return context;
}
