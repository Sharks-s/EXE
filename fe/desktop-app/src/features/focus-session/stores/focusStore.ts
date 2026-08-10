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

  appRules: null,
  allowedCache: new Set<string>(),

  botMessage: null,
  botActions: undefined,
  isBubbleVisible: false,
  isResumeConfirmPending: false,
  aiMessages: [],
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
      isResumeConfirmPending: false,
    }),

  setResumeConfirmPending: (pending) =>
    set({ isResumeConfirmPending: pending }),

  addAiMessage: (message) =>
    set((state) => ({
      aiMessages: [{ message, timestamp: Date.now() }, ...state.aiMessages].slice(0, 20),
    })),

  syncSession: (session, serverViolationCount) => {
    const isEnded =
      session.status === "COMPLETED" ||
      session.status === "ABORTED" ||
      session.status === "CANCELLED";

    set((state) => {
      const hasPreviousSession = state.session !== null;

      const isCompleteCycle =
        hasPreviousSession &&
        session.accumulatedReward > (state.session?.accumulatedReward ?? 0);

      const isViolation =
        hasPreviousSession &&
        !isCompleteCycle &&
        session.potentialReward < (state.session?.potentialReward ?? 0);

      let nextViolationCount = state.violationCount;
      if (isEnded) {
        nextViolationCount = state.violationCount;
      } else if (serverViolationCount !== undefined) {
        // Nếu API trả về số đếm chính xác trực tiếp từ DB -> Tin tưởng BE tuyệt đối
        nextViolationCount = serverViolationCount;
      } else {
        // Các API khác không trả về số đếm (ví dụ completeCycle) -> Dùng logic cũ làm fallback
        nextViolationCount = state.violationCount + (isViolation ? 1 : 0);
      }

      return {
        session: isEnded ? null : session,
        lastCompletedSession: isEnded ? session : state.lastCompletedSession,
        violationCount: nextViolationCount, //  Gán con số đã tính toán chuẩn vào đây
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
      appRules: null,
      allowedCache: new Set<string>(),
      currentPet: null,
      currentPersonality: null,
      botMessage: null,
      botActions: undefined,
      isBubbleVisible: false,
      isResumeConfirmPending: false,
    }),

  dismissSummary: () => set({ lastCompletedSession: null }),

  updateBotBubble: (message, actions = undefined, visible = true) =>
    set({ botMessage: message, botActions: actions, isBubbleVisible: visible }),

  clearBotBubble: () =>
    set({ botMessage: null, botActions: undefined, isBubbleVisible: false }),

  initializeSessionConfig: async (session: FocusSessionResponse) => {
    get().setSession(session);

    try {
      // Gom tất cả các hàm cần lấy dữ liệu chạy SONG SONG cùng lúc, kể cả việc fetch App Rules
      const [petData, personalityData] = await Promise.all([
        session.userPetId
          ? focusApi.getPetDetails(session.userPetId)
          : Promise.resolve(null),
        session.personalityId
          ? focusApi.getPersonalityDetails(session.personalityId)
          : Promise.resolve(null),
        get().fetchAppRules(), //  Kích hoạt tải luôn Blacklist/Whitelist về Store local ngay khi vào session
      ]);

      set({
        currentPet: petData,
        currentPersonality: personalityData,
      });

      if (import.meta.env.DEV) {
        console.log(
          `[Store] Loaded Pet: ${petData?.code}, AI Personality & App Rules.`,
        );
      }
    } catch (err) {
      console.error("[Store Error] Failed to fetch config:", err);
      const { emit } = await import("@tauri-apps/api/event");
      await emit("bot-bubble-update", {
        message:
          "Hệ thống nạp Pet gặp sự cố, nhưng ta vẫn sẽ giám sát ngươi! 👁️",
        actions: [],
        isVisible: true,
      });
    }
  },

  // ── CÁC ACTIONS  TÍCH HỢP QUẢN LÝ APP RULES ─────────────────

  fetchAppRules: async () => {
    try {
      const rules = await focusApi.getAppRules();
      set({ appRules: rules });
    } catch (error) {
      console.error(
        "[Store Error] Không thể tải danh sách quy tắc ứng dụng:",
        error,
      );
      // Fallback an toàn tránh sập app: Cho danh sách rỗng
      set({ appRules: { blacklist: [], whitelist: [] } });
    }
  },

  addToAllowedCache: (appOrTitle) => {
    const currentCache = get().allowedCache;
    // Clone Set để Zustand hiểu là có sự thay đổi tham chiếu (Reference change) và trigger re-render
    const newCache = new Set(currentCache);
    newCache.add(appOrTitle.toLowerCase().trim());
    set({ allowedCache: newCache });
  },

  clearAppRules: () =>
    set({
      appRules: null,
      allowedCache: new Set<string>(),
    }),
}));
