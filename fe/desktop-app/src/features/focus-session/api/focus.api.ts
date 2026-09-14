import api from "@/lib/axios";
import type {
  CreateSessionRequest,
  FocusSessionResponse,
  ViolationRequest,
  HandleViolationResponse,
  UserPetDetails,
  PersonalityDetails,
  AppRulesResponse,
  BreakPromptAiResponse,
  ClassifyAndHandleViolationResponse,
  HeartbeatResponse,
  FocusSessionCompleteResult,
  PagedResponse,
  SessionStatus,
} from "../types/focus.types";

export const focusApi = {
  // POST /focus-sessions/start
  createSession: async (
    data: CreateSessionRequest,
  ): Promise<FocusSessionResponse> => {
    const res = await api.post("/focus-sessions/start", data);
    return res.data.data;
  },

  // POST /focus-sessions/{id}/cycle
  completeCycle: async (sessionId: number): Promise<FocusSessionResponse> => {
    const res = await api.post(`/focus-sessions/${sessionId}/cycle`);
    return res.data.data;
  },

  // PATCH /focus-sessions/{id}/end?isAborted=true/false
  endSession: async (
    sessionId: number,
    isAborted: boolean,
  ): Promise<FocusSessionResponse> => {
    const res = await api.patch(`/focus-sessions/${sessionId}/end`, null, {
      params: { isAborted },
    });
    return res.data.data;
  },

  // POST /focus-sessions/{id}/violation — giờ trả về HandleViolationResponse
  // (bọc session + isPenalty + type), không phải FocusSessionResponse trần như cũ
  handleViolation: async (
    sessionId: number,
    data: ViolationRequest,
  ): Promise<HandleViolationResponse> => {
    const res = await api.post(`/focus-sessions/${sessionId}/violation`, data);
    return res.data.data;
  },

  // GET /user-pets/{userPetId}
  getPetDetails: async (userPetId: number): Promise<UserPetDetails> => {
    const res = await api.get(`/user-pets/${userPetId}`);
    return res.data.data;
  },

  // GET /personalities/{personalityId}
  getPersonalityDetails: async (
    personalityId: number,
  ): Promise<PersonalityDetails> => {
    const res = await api.get(`/personalities/${personalityId}`);
    return res.data.data;
  },

  // POST /focus-sessions/{id}/pause
  pauseSession: async (sessionId: number): Promise<FocusSessionResponse> => {
    const res = await api.post(`/focus-sessions/${sessionId}/pause`);
    return res.data.data;
  },

  // POST /focus-sessions/{id}/resume?minutesUsed={minutesUsed}
  resumeSession: async (
    sessionId: number,
    minutesUsed: number,
  ): Promise<FocusSessionResponse> => {
    const res = await api.post(`/focus-sessions/${sessionId}/resume`, null, {
      params: { minutesUsed },
    });
    return res.data.data;
  },

  getAppRules: async (): Promise<AppRulesResponse> => {
    const res = await api.get("/app-rules");
    return res.data.data;
  },

  getBreakPromptThoai: async (
    sessionId: number,
  ): Promise<BreakPromptAiResponse> => {
    const res = await api.get(`/focus-sessions/${sessionId}/break-prompt`);
    return res.data.data;
  },

  // GET /focus-sessions/active
  getActiveSession: async (): Promise<FocusSessionResponse | null> => {
    const res = await api.get("/focus-sessions/active");
    return res.data.data;
  },

  // POST /focus-sessions/{id}/complete
  completeSession: async (
    sessionId: number,
  ): Promise<FocusSessionCompleteResult> => {
    const res = await api.post(`/focus-sessions/${sessionId}/complete`);
    return res.data.data;
  },

  // GET /focus-sessions/history
  getSessionHistory: async (params?: {
    page?: number;
    size?: number;
    status?: SessionStatus;
  }): Promise<PagedResponse<FocusSessionResponse>> => {
    const res = await api.get("/focus-sessions/history", { params });
    return res.data.data;
  },

  // POST /focus-sessions/{id}/heartbeat
  heartbeat: async (sessionId: number, actualElapsedSeconds: number): Promise<HeartbeatResponse> => {
    const res = await api.post(`/focus-sessions/${sessionId}/heartbeat`, null, {
      params: { actualElapsedSeconds },
    });
    return res.data.data;
  },

  classifyAndHandleViolation: async (
    sessionId: number,
    data: { appName: string; windowTitle: string },
  ): Promise<ClassifyAndHandleViolationResponse> => {
    const res = await api.post(`/focus-sessions/${sessionId}/classify-app`, data);
    return res.data.data;
  },

  saveCloseSnapshot: async (
    sessionId: number,
    data: { elapsedSeconds: number; wasBreaking: boolean; breakRemainingSeconds: number | null },
  ): Promise<void> => {
    await api.patch(`/focus-sessions/${sessionId}/close-snapshot`, data);
  },
};
