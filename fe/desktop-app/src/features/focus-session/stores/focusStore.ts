// features/focus-session/stores/focusStore.ts

import { create } from "zustand";
import type { FocusSessionResponse } from "../types/focus.types";

interface FocusState {
  session: FocusSessionResponse | null;
  lastCompletedSession: FocusSessionResponse | null; // Giữ lại để hiện summary
  violationCount: number;

  // Actions
  setSession: (session: FocusSessionResponse) => void;
  syncSession: (session: FocusSessionResponse) => void; // Cập nhật từ BE response
  clearSession: () => void;
  dismissSummary: () => void; // User bấm đóng popup summary
}

export const useFocusStore = create<FocusState>((set) => ({
  session: null,
  lastCompletedSession: null,
  violationCount: 0,

  setSession: (session) =>
    set({ session, violationCount: 0, lastCompletedSession: null }),

  // Dùng sau mọi API call (completeCycle, handleViolation, endSession)
  syncSession: (session) => {
    const isEnded =
      session.status === "COMPLETED" ||
      session.status === "ABORTED" ||
      session.status === "CANCELLED";

    set((state) => {
      // Check xem có phải dịch chuyển dòng tiền thành công (completeCycle) không
      const isCompleteCycle =
        session.accumulatedReward > (state.session?.accumulatedReward ?? 0);

      // Chỉ tính là vi phạm nếu ví tương lai bị hụt mà KHÔNG PHẢI do hoàn thành chu kỳ học
      const isViolation =
        !isCompleteCycle &&
        session.potentialReward < (state.session?.potentialReward ?? 0);

      return {
        session: isEnded ? null : session,
        lastCompletedSession: isEnded ? session : state.lastCompletedSession,
        violationCount: isEnded
          ? state.violationCount // Giữ nguyên số lỗi khi kết thúc để hiển thị lên Summary
          : state.violationCount + (isViolation ? 1 : 0),
      };
    });
  },

  clearSession: () => set({ session: null, violationCount: 0 }), // lastCompletedSession giữ nguyên để hiện summary

  dismissSummary: () => set({ lastCompletedSession: null }), // Xóa hẳn summary khi user bấm đóng popup
}));
