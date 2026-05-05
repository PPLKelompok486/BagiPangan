"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import type {
  AppNotification,
  NotificationsResponse,
  UnreadCountResponse,
} from "@/types/notification";

const fetchNotifications = (url: string) => apiFetch<NotificationsResponse>(url);
const fetchUnreadCount = (url: string) => apiFetch<UnreadCountResponse>(url);

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    "/notifications",
    fetchNotifications,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
      keepPreviousData: true,
    },
  );

  const markRead = async (id: string) => {
    const wasUnread = data?.data.find((notification) => notification.id === id)?.read_at === null;
    await mutate(
      async (current) => {
        await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((notification) =>
            notification.id === id
              ? { ...notification, read_at: notification.read_at ?? new Date().toISOString() }
              : notification,
          ),
          unread_count: wasUnread ? Math.max(0, current.unread_count - 1) : current.unread_count,
        };
      },
      { revalidate: true, rollbackOnError: true },
    );
  };

  const markAllRead = async () => {
    await mutate(
      async (current) => {
        await apiFetch("/notifications/read-all", { method: "POST" });
        if (!current) return current;
        const now = new Date().toISOString();
        return {
          ...current,
          data: current.data.map((notification) => ({
            ...notification,
            read_at: notification.read_at ?? now,
          })),
          unread_count: 0,
        };
      },
      { revalidate: true, rollbackOnError: true },
    );
  };

  const remove = async (id: string) => {
    const removed = data?.data.find((notification) => notification.id === id);
    await mutate(
      async (current) => {
        await apiFetch(`/notifications/${id}`, { method: "DELETE" });
        if (!current) return current;
        return {
          ...current,
          data: current.data.filter((notification) => notification.id !== id),
          unread_count:
            removed && !removed.read_at ? Math.max(0, current.unread_count - 1) : current.unread_count,
          meta: {
            ...current.meta,
            total: Math.max(0, current.meta.total - 1),
          },
        };
      },
      { revalidate: true, rollbackOnError: true },
    );
  };

  return {
    notifications: data?.data ?? [],
    unreadCount: data?.unread_count ?? 0,
    meta: data?.meta,
    isLoading,
    error,
    mutate,
    markRead,
    markAllRead,
    remove,
  };
}

export function useUnreadNotificationCount() {
  const { data, error, isLoading, mutate } = useSWR<UnreadCountResponse>(
    "/notifications/unread-count",
    fetchUnreadCount,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
    },
  );

  return {
    unreadCount: data?.unread_count ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function notificationTimeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
}

export function sortUnreadFirst(notifications: AppNotification[]) {
  return [...notifications].sort((a, b) => {
    if (!a.read_at && b.read_at) return -1;
    if (a.read_at && !b.read_at) return 1;
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}
