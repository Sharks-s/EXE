import api from "../../../lib/axios";
import type {
  CreateSessionRequest,
  FocusSessionResponse,
  ViolationRequest,
  UserPetDetails,
  PersonalityDetails,
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

  // POST /focus-sessions/{id}/violation
  handleViolation: async (
    sessionId: number,
    data: ViolationRequest,
  ): Promise<FocusSessionResponse> => {
    const res = await api.post(`/focus-sessions/${sessionId}/violation`, data);
    return res.data.data;
  },

  // GET /api/pets/{userPetId}
  getPetDetails: async (userPetId: number): Promise<UserPetDetails> => {
    const res = await api.get(`/user-pets/${userPetId}`);
    return res.data.data;
  },

  // GET /api/personalities/{personalityId}
  getPersonalityDetails: async (
    personalityId: number,
  ): Promise<PersonalityDetails> => {
    const res = await api.get(`/api/personalities/${personalityId}`);
    return res.data.data;
  },
};
