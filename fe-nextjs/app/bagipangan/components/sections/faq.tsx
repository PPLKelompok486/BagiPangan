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
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              className="border-b border-[var(--brand-100)]"
              variants={createFadeUpVariants(reducedMotion)}
            >
              <button
                aria-expanded={openIndex === index}
                className="flex w-full items-center justify-between gap-4 py-6 text-left"
                onClick={() => toggle(index)}
                type="button"
              >
                <span className="text-lg font-semibold text-[var(--brand-900)]">
                  {faq.question}
                </span>
                <motion.span
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  className="flex-shrink-0 text-[var(--brand-600)]"
                  transition={rm ? { duration: 0 } : { duration: 0.25 }}
                >
                  <ChevronDown className="h-5 w-5" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    initial={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden" }}
                    transition={
                      rm
                        ? { duration: 0 }
                        : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                    }
                  >
                    <p className="pb-6 text-base leading-7 text-[var(--text-mid)]">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
