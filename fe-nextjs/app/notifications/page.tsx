"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  HandHeart,
  Home,
  Info,
  Package,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import "../bagipangan/landing.css";
import {
  notificationTimeAgo,
  useNotifications,
} from "@/hooks/useNotifications";
import { getUser } from "@/lib/api";
import type { AppNotification, NotificationIconType } from "@/types/notification";

const ICON_MAP: Record<NotificationIconType, { Icon: typeof Bell; bg: string; fg: string }> = {
  approved: { Icon: CheckCircle2, bg: "bg-emerald-50", fg: "text-emerald-600" },
  rejected: { Icon: XCircle, bg: "bg-red-50", fg: "text-red-600" },
  claimed: { Icon: HandHeart, bg: "bg-sky-50", fg: "text-sky-600" },
  completed: { Icon: Package, bg: "bg-amber-50", fg: "text-amber-600" },
  new_donation: { Icon: Package, bg: "bg-[var(--brand-50)]", fg: "text-[var(--brand-600)]" },
  info: { Icon: Info, bg: "bg-slate-50", fg: "text-slate-500" },
};

function homePath(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "penerima") return "/receiver/dashboard";
  return "/donatur/dashboard";
}

function NotificationItem({
  notification,
  onRead,
  onRemove,
}: {
  notification: AppNotification;
  onRead: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const unread = !notification.read_at;
  const { Icon, bg, fg } = ICON_MAP[notification.data.icon_type] ?? ICON_MAP.info;

  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex gap-4 px-5 py-4 transition-colors hover:bg-[var(--brand-50)] ${unread ? "bg-[var(--brand-50)]/45" : ""}`}
    >
      <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bg} ${fg}`}>
        <Icon className="h-5 w-5" />
      </span>
      <Link
        href={notification.data.action_url}
        onClick={() => {
          if (unread) void onRead(notification.id);
        }}
        className="min-w-0 flex-1"
      >
        <span className={`block text-sm leading-snug ${unread ? "font-semibold text-[var(--brand-950)]" : "font-medium text-[var(--text-mid)]"}`}>
          {notification.data.title}
        </span>
        <span className="mt-1 block text-sm leading-6 text-[var(--text-mid)]">{notification.data.body}</span>
        <span className="mt-1.5 block text-xs text-[var(--text-mid)]/70">
          {notificationTimeAgo(notification.created_at)}
        </span>
      </Link>
      <div className="flex shrink-0 flex-col items-end gap-1.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
        {unread && (
          <button
            type="button"
            onClick={() => void onRead(notification.id)}
            aria-label="Tandai dibaca"
            className="rounded-lg p-2 text-[var(--brand-600)] hover:bg-[var(--brand-100)]"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => void onRemove(notification.id)}
          aria-label="Hapus notifikasi"
          className="rounded-lg p-2 text-[var(--text-mid)] hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.li>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const user = useMemo(() => getUser(), []);
  const { notifications, unreadCount, isLoading, markRead, markAllRead, remove } = useNotifications();

  useEffect(() => {
    if (!user) {
      router.replace("/login?from=/notifications");
    }
  }, [router, user]);

  return (
    <div className="bagi-theme min-h-screen bg-[var(--cream)]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="bagi-display text-2xl font-semibold text-[var(--brand-950)]">Notifikasi</h1>
            <p className="mt-1 text-sm text-[var(--text-mid)]">
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Tidak ada notifikasi baru"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={homePath(user?.role)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--brand-100)] bg-white text-[var(--brand-700)] hover:bg-[var(--brand-50)]"
              aria-label="Kembali ke dashboard"
            >
              <Home className="h-4 w-4" />
            </Link>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--brand-100)] bg-white px-4 text-sm font-semibold text-[var(--brand-700)] hover:bg-[var(--brand-50)]"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Tandai semua dibaca</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--brand-100)] bg-white shadow-[var(--shadow-card)]">
          {isLoading && notifications.length === 0 && (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-lg bg-[var(--brand-50)]" />
              ))}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center px-6 py-20 text-center">
              <Bell className="mb-3 h-12 w-12 text-[var(--brand-300)]" />
              <h2 className="text-lg font-bold text-[var(--brand-950)]">Belum ada notifikasi</h2>
              <p className="mt-1 text-sm text-[var(--text-mid)]">
                Pembaruan donasi dan klaim akan muncul di sini.
              </p>
            </div>
          )}

          <ul className="divide-y divide-[var(--brand-50)]">
            <AnimatePresence initial={false}>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markRead}
                  onRemove={remove}
                />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </div>
  );
}
