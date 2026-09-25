export type UserFeedbackType =
  | "BUG"
  | "FEATURE_REQUEST"
  | "GENERAL"
  | "UI_UX"
  | "PAYMENT";

export type UserFeedbackStatus =
  | "NEW"
  | "REVIEWING"
  | "RESOLVED"
  | "REJECTED";

export interface UserFeedback {
  id: number;
  userId: number;
  type: UserFeedbackType;
  title: string;
  content: string;
  rating?: number | null;
  status: UserFeedbackStatus;
  adminReply?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserFeedbackRequest {
  type: UserFeedbackType;
  title: string;
  content: string;
  rating?: number | null;
}

export interface UpdateUserFeedbackStatusRequest {
  status: UserFeedbackStatus;
}

export interface UpdateUserFeedbackReplyRequest {
  adminReply?: string | null;
}

export const feedbackStatusLabel: Record<UserFeedbackStatus, string> = {
  NEW: "Mới",
  REVIEWING: "Đang xem xét",
  RESOLVED: "Đã xử lý",
  REJECTED: "Từ chối",
};

export const feedbackTypeLabel: Record<UserFeedbackType, string> = {
  BUG: "Lỗi",
  FEATURE_REQUEST: "Đề xuất tính năng",
  GENERAL: "Góp ý chung",
  UI_UX: "Giao diện / trải nghiệm",
  PAYMENT: "Thanh toán",
};
