// features/focus-session/stores/focusStore.ts

import { create } from "zustand";
import type { FocusSessionResponse, FocusState } from "../types/focus.types";
import { focusApi } from "../api/focus.api";

export const useFocusStore = create<FocusState>((set, get) => ({
  // ── STATE ────────────────────────────────────────────────────────
  session: null,
  lastCompletedSession: null,
  violationCount: 0,
  currentPet: null,
  currentPersonality: null,
  botMessage: null,
  botActions: undefined,
  isBubbleVisible: false,

  // ── ACTIONS ──────────────────────────────────────────────────────
  setSession: (session) =>
    set({
      session,
      violationCount: 0,
      lastCompletedSession: null,
      currentPet: null,
      currentPersonality: null,
      botMessage: null,
      botActions: undefined,
      isBubbleVisible: false,
    }),

  syncSession: (session) => {
    const isEnded =
      session.status === "COMPLETED" ||
      session.status === "ABORTED" ||
      session.status === "CANCELLED";

    set((state) => {
      const hasPreviousSession = state.session !== null;

      // Chỉ so sánh biến động ví khi có dữ liệu nền trước đó (tránh lỗi khi resume app)
      const isCompleteCycle =
        hasPreviousSession &&
        session.accumulatedReward > (state.session?.accumulatedReward ?? 0);

      const isViolation =
        hasPreviousSession &&
        !isCompleteCycle &&
        session.potentialReward < (state.session?.potentialReward ?? 0);

      return {
        session: isEnded ? null : session,
        lastCompletedSession: isEnded ? session : state.lastCompletedSession,
        violationCount: isEnded
          ? state.violationCount
          : state.violationCount + (isViolation ? 1 : 0),
        botMessage: isEnded ? null : state.botMessage,
        botActions: isEnded ? undefined : state.botActions,
        isBubbleVisible: isEnded ? false : state.isBubbleVisible,
      };
    });
  },

  clearSession: () =>
    set({
      session: null,
      violationCount: 0,
      currentPet: null,
      currentPersonality: null,
      botMessage: null,
      botActions: undefined,
      isBubbleVisible: false,
    }),

  dismissSummary: () => set({ lastCompletedSession: null }),

  updateBotBubble: (message, actions = undefined, visible = true) =>
    set({ botMessage: message, botActions: actions, isBubbleVisible: visible }),

  clearBotBubble: () =>
    set({ botMessage: null, botActions: undefined, isBubbleVisible: false }),

  initializeSessionConfig: async (session: FocusSessionResponse) => {
    get().setSession(session);

    if (!session.userPetId && !session.personalityId) return;

    try {
      // Gọi song song thông tin Pet và Tính cách từ Spring Boot
      const [petData, personalityData] = await Promise.all([
        session.userPetId
          ? focusApi.getPetDetails(session.userPetId)
          : Promise.resolve(null),
        session.personalityId
          ? focusApi.getPersonalityDetails(session.personalityId)
          : Promise.resolve(null),
      ]);

      set({
        currentPet: petData,
        currentPersonality: personalityData,
      });

      if (import.meta.env.DEV) {
        console.log(`[Store] Loaded Pet: ${petData?.code} & AI Personality.`);
      }
    } catch (err) {
      console.error("[Store Error] Failed to fetch config:", err);
      set({
        botMessage:
          "Hệ thống nạp Pet gặp sự cố, nhưng ta vẫn sẽ giám sát ngươi! 👁️",
        isBubbleVisible: true,
      });
    }
  },
}));
