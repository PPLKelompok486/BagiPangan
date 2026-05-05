export type NotificationIconType =
  | "approved"
  | "rejected"
  | "claimed"
  | "completed"
  | "new_donation"
  | "info";

export interface NotificationData {
  title: string;
  body: string;
  action_url: string;
  icon_type: NotificationIconType;
  meta?: Record<string, unknown>;
}

export interface AppNotification {
  id: string;
  type: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
  unread_count: number;
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export interface UnreadCountResponse {
  unread_count: number;
}
