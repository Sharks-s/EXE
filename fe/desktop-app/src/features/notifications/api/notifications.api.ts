import api from "@/lib/axios";
import type { ApiResponse } from "@/types";
import type { NotificationItem, PagedResponse } from "../types/notification.types";

export const notificationsApi = {
  getNotifications: (page = 0, size = 10) =>
    api
      .get<ApiResponse<PagedResponse<NotificationItem>>>("/notifications", {
        params: { page, size },
      })
      .then((r) => r.data.data),

  getUnreadCount: () =>
    api
      .get<ApiResponse<{ count: number }>>("/notifications/unread-count")
      .then((r) => r.data.data.count),

  markAsRead: (id: number) =>
    api
      .patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`)
      .then((r) => r.data.data),

  markAllAsRead: () =>
    api.patch<ApiResponse<null>>("/notifications/read-all").then((r) => r.data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/notifications/${id}`).then((r) => r.data),
};
