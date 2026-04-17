"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navLinks } from "../../data";
import { cn } from "../../lib/cn";
import { useSmoothScroll } from "../../providers/smooth-scroll-provider";
import { BrandMark } from "../ui/brand-mark";
import { Button } from "../ui/button";

export function Navbar() {
  const reducedMotion = useReducedMotion();
  const { scrollTo } = useSmoothScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const navItemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [hoverRect, setHoverRect] = useState<{ left: number; width: number } | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const sectionIds = navLinks.map((link) => link.href.replace("#", ""));
    const observers: IntersectionObserver[] = [];

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${id}`);
          }
        },
        { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Update hover pill position
  useEffect(() => {
    if (hoveredIndex === null || !navContainerRef.current) {
      setHoverRect(null);
      return;
    }
    const btn = navItemsRef.current[hoveredIndex];
    const container = navContainerRef.current;
    if (!btn || !container) return;

    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setHoverRect({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }, [hoveredIndex]);

  const handleAnchorClick = (href: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    setOpen(false);
    scrollTo(href);
  };

  return (
    <>
      <motion.nav
        animate={{
          backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0)",
          backdropFilter: scrolled ? "blur(16px)" : "blur(0px)",
          borderColor: scrolled ? "rgba(214,245,227,0.9)" : "rgba(255,255,255,0)",
          boxShadow: scrolled ? "0 14px 34px rgba(13,43,26,0.08)" : "0 0 0 rgba(0,0,0,0)",
          paddingTop: scrolled ? "12px" : "16px",
          paddingBottom: scrolled ? "12px" : "16px",
        }}
        className="fixed inset-x-0 top-0 z-50 border-b"
        transition={reducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link aria-label="BagiPangan" href="/bagipangan">
            <BrandMark inverse={!scrolled} />
          </Link>

          <div
            ref={navContainerRef}
            className="relative hidden items-center gap-1 rounded-full border border-white/10 px-2 py-1 lg:flex"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Animated hover pill */}
            <AnimatePresence>
              {hoverRect && (
                <motion.div
                  className={cn(
                    "absolute top-1 h-[calc(100%-8px)] rounded-full",
                    scrolled ? "bg-[var(--brand-50)]" : "bg-white/10",
                  )}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    left: hoverRect.left,
                    width: hoverRect.width,
                  }}
                  exit={{ opacity: 0 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 350, damping: 30 }
                  }
                  layoutId="nav-hover-pill"
                />
              )}
            </AnimatePresence>

            {navLinks.map((link, index) => {
              const isActive = activeSection === link.href;
              return (
                <button
                  key={link.href}
                  ref={(el) => {
                    navItemsRef.current[index] = el;
                  }}
                  className={cn(
                    "relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]",
                    scrolled
                      ? "text-[var(--text-dark)]"
                      : "text-white/90",
                  )}
                  onClick={handleAnchorClick(link.href)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  type="button"
                >
                  {link.label}
                  {/* Active section indicator dot */}
                  {isActive && (
                    <motion.span
                      className={cn(
                        "absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                        scrolled ? "bg-[var(--brand-600)]" : "bg-[var(--lime)]",
                      )}
                      layoutId="nav-active-dot"
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 400, damping: 30 }
                      }
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-300)]",
                scrolled ? "text-[var(--brand-900)]" : "text-white",
              )}
              href="/login"
            >
              Masuk
            </Link>
            <Button className="px-5 py-2.5" href="/register">
              Daftar
            </Button>
          </div>

          <button
            aria-expanded={open}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full border transition lg:hidden",
              scrolled
                ? "border-[var(--brand-100)] bg-white text-[var(--brand-900)]"
                : "border-white/20 bg-white/8 text-white",
            )}
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-4 top-22 z-40 rounded-[2rem] border border-[var(--brand-100)] bg-white/96 p-5 shadow-[var(--shadow-card)] backdrop-blur lg:hidden"
            exit={{ opacity: 0, y: -18 }}
            initial={{ opacity: 0, y: -18 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.24, ease: "easeOut" }}
          >
            <motion.div
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: reducedMotion ? 0 : 0.05 },
                },
              }}
            >
              {navLinks.map((link) => (
                <motion.button
                  key={link.href}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition",
                    activeSection === link.href
                      ? "bg-[var(--brand-600)] text-white"
                      : "bg-[var(--brand-50)] text-[var(--brand-900)] hover:bg-[var(--brand-100)]",
                  )}
                  onClick={handleAnchorClick(link.href)}
                  type="button"
                  variants={{
                    hidden: { opacity: 0, x: -12 },
                    visible: { opacity: 1, x: 0 },
                  }}
                >
                  <span className="font-semibold">{link.label}</span>
                  <span className={cn("text-sm", activeSection === link.href ? "text-white/70" : "text-[var(--text-mid)]")}>
                    {activeSection === link.href ? "Aktif" : "Lihat"}
                  </span>
                </motion.button>
              ))}
            </motion.div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button className="w-full justify-center border border-[var(--brand-100)] bg-white text-[var(--brand-900)]" href="/login" variant="ghost">
                Masuk
              </Button>
              <Button className="w-full justify-center" href="/register">
                Daftar
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
