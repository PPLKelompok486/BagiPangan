"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { useRef, useState } from "react";
import { testimonials } from "../../data";
import { createFadeUpVariants, createStaggerContainer } from "../../lib/motion";
import { SectionHeader } from "../ui/section-header";

export function Testimonials() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { amount: 0.15, once: true });
  const [dragConstraintLeft, setDragConstraintLeft] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Calculate drag constraints after render
  const updateConstraints = () => {
    if (carouselRef.current && innerRef.current) {
      const containerWidth = carouselRef.current.offsetWidth;
      const contentWidth = innerRef.current.scrollWidth;
      setDragConstraintLeft(-(contentWidth - containerWidth));
    }
  };

  return (
    <section
      className="bg-white px-4 py-20 sm:px-6 lg:px-10 lg:py-24 overflow-hidden"
      id="testimoni"
      ref={ref}
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          align="center"
          description="Donatur, penerima, dan relawan berbagi pengalaman mereka menggunakan BagiPangan untuk mendistribusikan makanan surplus."
          eyebrow="Testimoni"
          title="Cerita dari Komunitas Kami"
        />

        {/* Desktop grid */}
        <motion.div
          animate={isInView ? "visible" : "hidden"}
          className="mt-14 hidden gap-6 md:grid md:grid-cols-3"
          initial="hidden"
          variants={createStaggerContainer(reducedMotion, 0.12)}
        >
          {testimonials.map((t, cardIndex) => (
            <TestimonialCard
              key={t.name}
              testimonial={t}
              reducedMotion={reducedMotion}
              isInView={isInView}
              cardIndex={cardIndex}
            />
          ))}
        </motion.div>

        {/* Mobile drag carousel */}
        <div
          ref={carouselRef}
          className="mt-14 cursor-grab active:cursor-grabbing md:hidden"
          onPointerEnter={updateConstraints}
        >
          <motion.div
            ref={innerRef}
            className="flex gap-4"
            drag={reducedMotion ? false : "x"}
            dragConstraints={{ left: dragConstraintLeft, right: 0 }}
            dragElastic={0.1}
            animate={isInView ? "visible" : "hidden"}
            initial="hidden"
            variants={createStaggerContainer(reducedMotion, 0.12)}
          >
            {testimonials.map((t, cardIndex) => (
              <motion.div key={t.name} className="min-w-[85vw] sm:min-w-[60vw]" variants={createFadeUpVariants(reducedMotion)}>
                <TestimonialCard
                  testimonial={t}
                  reducedMotion={reducedMotion}
                  isInView={isInView}
                  cardIndex={cardIndex}
                  isDraggable
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Drag hint */}
          <motion.p
            className="mt-4 text-center text-xs font-medium tracking-widest text-[var(--text-mid)] uppercase"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.8 }}
          >
            ← Geser untuk melihat lebih banyak →
          </motion.p>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial: t,
  reducedMotion,
  isInView,
  cardIndex,
  isDraggable,
}: {
  testimonial: (typeof testimonials)[number];
  reducedMotion: boolean | null;
  isInView: boolean;
  cardIndex: number;
  isDraggable?: boolean;
}) {
  const rm = reducedMotion ?? false;

  const card = (
    <motion.article
      className="flex h-full flex-col rounded-[2rem] border border-[var(--brand-100)] bg-[var(--cream)] p-7 shadow-[var(--shadow-card)] transition-shadow"
      variants={isDraggable ? undefined : createFadeUpVariants(reducedMotion)}
      whileHover={
        rm
          ? undefined
          : {
              y: -6,
              borderColor: "var(--brand-300)",
              boxShadow: "0 24px 60px rgba(13, 43, 26, 0.12)",
            }
      }
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
    >
      <div className="flex items-center gap-4">
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-600)] text-sm font-bold text-white"
          initial={{ scale: rm ? 1 : 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={
            rm
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 15, delay: 0.3 + cardIndex * 0.1 }
          }
        >
          {t.initials}
        </motion.div>
        <div>
          <p className="font-semibold text-[var(--brand-900)]">{t.name}</p>
          <p className="text-sm text-[var(--text-mid)]">
            {t.role} · {t.location}
          </p>
        </div>
      </div>

      {/* Animated stars */}
      <div className="mt-4 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: rm ? 1 : 0, scale: rm ? 1 : 0, rotate: rm ? 0 : -30 }}
            animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
            transition={
              rm
                ? { duration: 0 }
                : {
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                    delay: 0.5 + cardIndex * 0.1 + i * 0.06,
                  }
            }
          >
            <Star className="h-4 w-4 fill-[var(--lime)] text-[var(--lime)]" />
          </motion.div>
        ))}
      </div>

      <p className="mt-4 flex-1 text-base leading-7 text-[var(--text-mid)]">
        &ldquo;{t.quote}&rdquo;
      </p>
    </motion.article>
  );

  return card;
}
