import api from "../../../lib/axios";
import pyApi from "../../../lib/axios-py"; // Thêm instance mới của Python Bot
import type {
  CreateSessionRequest,
  FocusSessionResponse,
} from "../types/focus.types";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  timestamp: string;
};

export const focusApi = {
  // Bắn lên Spring Boot BE qua instance api chính (Tự mang theo cookie và token nếu có)
  createSession: (data: CreateSessionRequest) =>
    api
      .post<ApiResponse<FocusSessionResponse>>("/focus-sessions/start", data)
      .then((r) => r.data.data),

  // Bắn sang FastAPI Python Bot local qua instance biệt lập, an toàn và có timeout nhanh
  startPythonCamera: () => pyApi.post("/bot/camera/start").then((r) => r.data),
};
