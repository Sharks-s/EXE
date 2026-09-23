export type NotificationType =
  | "SESSION_COMPLETED"
  | "ACHIEVEMENT_UNLOCKED"
  | "STREAK_MILESTONE"
  | "SESSION_ABORTED"
  | "DAILY_LIMIT_REACHED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED";

export type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
};

export type PagedResponse<T> = {
  items: T[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
};
