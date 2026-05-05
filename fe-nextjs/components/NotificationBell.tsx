"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  HandHeart,
  Info,
  Package,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  notificationTimeAgo,
  useNotifications,
} from "@/hooks/useNotifications";
import type { AppNotification, NotificationIconType } from "@/types/notification";

const ICON_MAP: Record<NotificationIconType, { Icon: typeof Bell; bg: string; fg: string }> = {
  approved: { Icon: CheckCircle2, bg: "bg-emerald-50", fg: "text-emerald-600" },
  rejected: { Icon: XCircle, bg: "bg-red-50", fg: "text-red-600" },
  claimed: { Icon: HandHeart, bg: "bg-sky-50", fg: "text-sky-600" },
  completed: { Icon: Package, bg: "bg-amber-50", fg: "text-amber-600" },
  new_donation: { Icon: Package, bg: "bg-[var(--brand-50)]", fg: "text-[var(--brand-600)]" },
  info: { Icon: Info, bg: "bg-slate-50", fg: "text-slate-500" },
};

function NotificationRow({
  notification,
  onRead,
  onRemove,
  onClose,
}: {
  notification: AppNotification;
  onRead: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const unread = !notification.read_at;
  const { Icon, bg, fg } = ICON_MAP[notification.data.icon_type] ?? ICON_MAP.info;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className={`group flex gap-3 px-4 py-3 hover:bg-[var(--brand-50)] ${unread ? "bg-[var(--brand-50)]/60" : ""}`}
    >
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${fg}`}>
        <Icon className="h-4 w-4" />
      </span>
      <Link
        href={notification.data.action_url}
        onClick={() => {
          if (unread) void onRead(notification.id);
          onClose();
        }}
        className="min-w-0 flex-1"
      >
        <span className={`block text-sm leading-snug ${unread ? "font-semibold text-[var(--brand-950)]" : "font-medium text-[var(--text-mid)]"}`}>
          {notification.data.title}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[var(--text-mid)]">
          {notification.data.body}
        </span>
        <span className="mt-1 block text-xs text-[var(--text-mid)]/70">
          {notificationTimeAgo(notification.created_at)}
        </span>
      </Link>
      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {unread && (
          <button
            type="button"
            onClick={() => void onRead(notification.id)}
            aria-label="Tandai dibaca"
            className="rounded-lg p-1.5 text-[var(--brand-600)] hover:bg-[var(--brand-100)]"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => void onRemove(notification.id)}
          aria-label="Hapus notifikasi"
          className="rounded-lg p-1.5 text-[var(--text-mid)] hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.li>
  );
}

export default function NotificationBell({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { notifications, unreadCount, isLoading, markRead, markAllRead, remove } = useNotifications();
  const buttonClass =
    tone === "dark"
      ? "border-white/20 text-white/85 hover:bg-white/10"
      : "border-[var(--brand-100)] text-[var(--brand-700)] hover:bg-[var(--brand-50)]";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Buka notifikasi"
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${buttonClass}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[var(--brand-100)] bg-white text-[var(--brand-950)] shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--brand-100)] px-4 py-3">
              <div>
                <p className="text-sm font-bold">Notifikasi</p>
                <p className="text-xs text-[var(--text-mid)]">
                  {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="rounded-lg p-2 text-[var(--brand-600)] hover:bg-[var(--brand-50)]"
                  aria-label="Tandai semua dibaca"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading && notifications.length === 0 && (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-16 animate-pulse rounded-lg bg-[var(--brand-50)]" />
                  ))}
                </div>
              )}

              {!isLoading && notifications.length === 0 && (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <Bell className="mb-2 h-8 w-8 text-[var(--brand-300)]" />
                  <p className="text-sm font-semibold">Tidak ada notifikasi</p>
                  <p className="text-xs text-[var(--text-mid)]">Pembaruan donasi akan muncul di sini.</p>
                </div>
              )}

              <ul className="divide-y divide-[var(--brand-50)]">
                <AnimatePresence initial={false}>
                  {notifications.slice(0, 8).map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onRead={markRead}
                      onRemove={remove}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-[var(--brand-100)] px-4 py-3 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Lihat semua notifikasi
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
