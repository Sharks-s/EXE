// features/focus-session/types/focus.types.ts

export type SessionStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABORTED"
  | "CANCELLED";

// 🌟 Thêm LOOK_AWAY vào enum để khớp với code nhận diện khuôn mặt của Python
export type ViolationType = "AWAY" | "PHONE" | "ENTERTAINMENT" | "LOOK_AWAY";

export type AssistantPersonality = "SWEET" | "STRICT" | "MEAN";

export type PresetGoalKey =
  | "coding"
  | "assignment"
  | "study"
  | "meeting"
  | "writing";

// ── Request types ──────────────────────────────────────

export interface CreateSessionRequest {
  goal: string;
  durationMinutes: number;
}

// 🌟 Thêm Request Vi phạm để map data cho focusApi.handleViolation
export interface ViolationRequest {
  type: ViolationType;
  appName: string;
  windowTitle: string;
}

// ── Response types ─────────────────────────────────────

export interface FocusSessionResponse {
  id: number;
  goal: string;
  plannedDuration: number;
  actualDuration: number | null;
  totalRewardPool: number;
  potentialReward: number;
  accumulatedReward: number;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  lastCycleAt: string | null;
  userPetId: number | null;
  personalityId: number | null;
}

// ── UI helper types ────────────────────────────────────

export interface GoalPresetItem {
  key: PresetGoalKey;
  labelKey: string;
}

export interface AssistantItem {
  id: AssistantPersonality;
  labelKey: string;
}

// ── Pet Details ────────────────────────────────────────
export interface UserPetDetails {
  userPetId: number;
  code: string;
  customName: string;
  level: number;
  experience: number;
  imageUrl: string | null;
}
// ── Personality Details ────────────────────────────────
export interface PersonalityDetails {
  id: number;
  name: string;
  code: string;
}

// ── Chat Bubble Action ─────────────────────────────────
export interface BubbleAction {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "primary" | "secondary";
}

// ── Zustand Store State Interface ──────────────────────
export interface FocusState {
  session: FocusSessionResponse | null;
  lastCompletedSession: FocusSessionResponse | null;
  violationCount: number; // Đảm bảo store có biến đếm tổng số lần vi phạm hiển thị UI
  currentPet: UserPetDetails | null;
  currentPersonality: PersonalityDetails | null;

  // Trạng thái hiển thị của Pet ở Widget
  botMessage: string | null;
  botActions: BubbleAction[] | undefined; // 🎯 Đã chuẩn hóa từ any[] thành BubbleAction[]
  isBubbleVisible: boolean;

  // Actions
  setSession: (session: FocusSessionResponse) => void;
  syncSession: (session: FocusSessionResponse) => void;
  clearSession: () => void;
  dismissSummary: () => void;
  updateBotBubble: (
    message: string | null,
    actions?: BubbleAction[],
    visible?: boolean,
  ) => void;
  clearBotBubble: () => void;
  initializeSessionConfig: (session: FocusSessionResponse) => Promise<void>;
}
