import api from "@/lib/axios";
import type {
  CreateUserFeedbackRequest,
  UpdateUserFeedbackReplyRequest,
  UpdateUserFeedbackStatusRequest,
  UserFeedback,
} from "../types/feedback.types";

interface FeedbackApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  data?: T;
  errors?: unknown[];
  timestamp: string;
  path?: string;
  requestId?: string;
}

const unwrapData = <T>(response: FeedbackApiResponse<T>) => {
  if (response.data === undefined) {
    throw new Error(response.message ?? "Feedback response does not include data");
  }

  return response.data;
};

export const feedbackApi = {
  create: (data: CreateUserFeedbackRequest) =>
    api
      .post<FeedbackApiResponse<UserFeedback>>("/user-feedbacks", data)
      .then((r) => unwrapData(r.data)),

  getMine: () =>
    api
      .get<FeedbackApiResponse<UserFeedback[]>>("/user-feedbacks/me")
      .then((r) => unwrapData(r.data)),

  getMineById: (id: number) =>
    api
      .get<FeedbackApiResponse<UserFeedback>>(`/user-feedbacks/me/${id}`)
      .then((r) => unwrapData(r.data)),

  getAllForAdmin: () =>
    api
      .get<FeedbackApiResponse<UserFeedback[]>>("/admin/user-feedbacks")
      .then((r) => unwrapData(r.data)),

  updateStatusForAdmin: (
    id: number,
    data: UpdateUserFeedbackStatusRequest,
  ) =>
    api
      .patch<FeedbackApiResponse<UserFeedback>>(
        `/admin/user-feedbacks/${id}/status`,
        data,
      )
      .then((r) => unwrapData(r.data)),

  updateReplyForAdmin: (id: number, data: UpdateUserFeedbackReplyRequest) =>
    api
      .patch<FeedbackApiResponse<UserFeedback>>(
        `/admin/user-feedbacks/${id}/reply`,
        data,
      )
      .then((r) => unwrapData(r.data)),
};
