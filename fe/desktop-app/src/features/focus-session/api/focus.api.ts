import api from "../../../lib/axios";
import type {
  CreateSessionRequest,
  FocusSessionResponse,
} from "../types/focus.types";
import type { ApiResponse } from "../../../types";
export const focusApi = {
  createSession: (data: CreateSessionRequest) =>
    api
      .post<ApiResponse<FocusSessionResponse>>("/focus-sessions/start", data)
      .then((r) => r.data.data),

  endSession: (sessionId: number) =>
    api
      .patch<
        ApiResponse<FocusSessionResponse>
      >(`/focus-sessions/${sessionId}/end`)
      .then((r) => r.data.data),
};
