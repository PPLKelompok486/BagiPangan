"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "./cn";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const WEEKDAYS = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"];

/** Format an ISO yyyy-mm-dd string (no timezone math) into "12 Jun 2026". */
function formatDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Monday-first weekday index (0=Mon … 6=Sun) for the 1st of a month. */
function firstWeekdayMonFirst(y: number, m: number): number {
  return (new Date(y, m, 1).getDay() + 6) % 7;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Pilih tanggal",
  ariaLabel,
  clearable = true,
  className,
}: {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  ariaLabel?: string;
  clearable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const today = useMemo(() => new Date(), []);
  const initial = value ? value.split("-").map(Number) : null;
  const [viewYear, setViewYear] = useState(initial ? initial[0] : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial ? initial[1] - 1 : today.getMonth());

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function openCalendar() {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
    setOpen(true);
  }

  function toggle() {
    if (open) setOpen(false);
    else openCalendar();
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const lead = firstWeekdayMonFirst(viewYear, viewMonth);
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  function isDisabled(iso: string) {
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }

  function prevMonth() {
    setViewMonth((m) => (m === 0 ? (setViewYear((y) => y - 1), 11) : m - 1));
  }
  function nextMonth() {
    setViewMonth((m) => (m === 11 ? (setViewYear((y) => y + 1), 0) : m + 1));
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={toggle}
        className={cn(
          "flex w-full items-center gap-2 rounded-(--radius-pill) border bg-white px-3.5 py-2 text-sm font-medium outline-none transition-colors",
          open ? "border-(--brand-400) ring-2 ring-(--brand-100)" : "border-(--brand-100) hover:border-(--brand-300)",
          value ? "text-(--text-dark)" : "text-(--text-mid)",
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-(--brand-600)" />
        <span className="flex-1 truncate text-left">{value ? formatDisplay(value) : placeholder}</span>
        {clearable && value && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Hapus tanggal"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="rounded-full p-0.5 text-(--text-mid) hover:bg-(--brand-50) hover:text-(--brand-700)"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute z-50 mt-2 w-[17rem] rounded-2xl border border-(--brand-100) bg-white p-3 shadow-(--shadow-soft)"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Bulan sebelumnya"
                className="rounded-lg p-1.5 text-(--text-mid) hover:bg-(--brand-50) hover:text-(--brand-700)"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold text-(--brand-900)">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Bulan berikutnya"
                className="rounded-lg p-1.5 text-(--text-mid) hover:bg-(--brand-50) hover:text-(--brand-700)"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1 text-[10px] font-semibold uppercase tracking-wide text-(--text-mid)">
                  {w}
                </span>
              ))}
              {Array.from({ length: lead }).map((_, i) => (
                <span key={`lead-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const iso = toIso(viewYear, viewMonth, day);
                const disabled = isDisabled(iso);
                const isSelected = iso === value;
                const isToday = iso === todayIso;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
                      disabled && "cursor-not-allowed text-(--brand-100)",
                      !disabled && !isSelected && "text-(--text-dark) hover:bg-(--brand-50)",
                      isSelected && "bg-(--brand-600) font-semibold text-white",
                      !isSelected && isToday && !disabled && "font-semibold text-(--brand-700) ring-1 ring-(--brand-200)",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
