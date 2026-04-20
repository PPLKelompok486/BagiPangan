"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { faqs } from "../../data";
import { createFadeUpVariants, createStaggerContainer } from "../../lib/motion";
import { SectionHeader } from "../ui/section-header";

export function FAQ() {
  const reducedMotion = useReducedMotion();
  const rm = reducedMotion ?? false;
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { amount: 0.15, once: true });
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <section
      className="bg-white px-4 py-20 sm:px-6 lg:px-10 lg:py-24"
      id="faq"
      ref={ref}
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          align="center"
          description="Temukan jawaban atas pertanyaan umum tentang BagiPangan dan bagaimana platform ini bekerja."
          eyebrow="FAQ"
          title="Pertanyaan yang Sering Diajukan"
        />

        <motion.div
          animate={isInView ? "visible" : "hidden"}
          className="mx-auto mt-14 max-w-3xl"
          initial="hidden"
          variants={createStaggerContainer(reducedMotion, 0.08)}
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const isHovered = hoveredIndex === index;

            return (
              <motion.div
                key={faq.question}
                className="relative border-b border-[var(--brand-100)]"
                variants={createFadeUpVariants(reducedMotion)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Active highlight bar */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-[var(--brand-600)]"
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      exit={{ scaleY: 0, opacity: 0 }}
                      transition={rm ? { duration: 0 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: "top" }}
                    />
                  )}
                </AnimatePresence>

                <button
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-6 pl-4 text-left transition-colors"
                  onClick={() => toggle(index)}
                  type="button"
                >
                  <motion.span
                    className="text-lg font-semibold text-[var(--brand-900)]"
                    animate={
                      isOpen
                        ? { color: "var(--brand-600)" }
                        : { color: "var(--brand-900)" }
                    }
                    transition={rm ? { duration: 0 } : { duration: 0.2 }}
                  >
                    {faq.question}
                  </motion.span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="flex-shrink-0 text-[var(--brand-600)]"
                    transition={rm ? { duration: 0 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </motion.span>
                </button>

                {/* Hover shimmer preview */}
                {!isOpen && isHovered && !rm && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full bg-[var(--brand-200)]"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 0.6 }}
                    transition={{ duration: 0.2 }}
                    style={{ transformOrigin: "center" }}
                  />
                )}

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden" }}
                      transition={
                        rm
                          ? { duration: 0 }
                          : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                      }
                    >
                      <motion.p
                        className="pb-6 pl-4 text-base leading-7 text-[var(--text-mid)]"
                        initial={{ y: rm ? 0 : -8, opacity: rm ? 1 : 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={rm ? { duration: 0 } : { duration: 0.3, delay: 0.05 }}
                      >
                        {faq.answer}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
