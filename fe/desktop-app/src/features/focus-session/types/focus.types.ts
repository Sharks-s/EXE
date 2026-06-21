// features/focus-session/types/focus.types.ts

export type SessionStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABORTED"
  | "CANCELLED";

// Nhóm vi phạm thật (bị trừ potentialReward) và nhóm nhắc nhở (chỉ ghi log, không trừ điểm)
export type ViolationType =
  | "AWAY" // Không thấy mặt — bị trừ điểm
  | "LOOK_AWAY" // Quay đầu/liếc đi chỗ khác — bị trừ điểm
  | "TOO_CLOSE" // Ngồi quá sát màn hình — bị trừ điểm
  | "PHONE" // Dùng điện thoại — bị trừ điểm
  | "ENTERTAINMENT" // Mở app giải trí — bị trừ điểm
  | "BAD_POSTURE" // Ngồi gù lưng, lệch vai — CHỈ nhắc nhở, không trừ điểm
  | "POOR_LIGHTING"; // Thiếu sáng — CHỈ nhắc nhở, không trừ điểm

// Dùng ở FE để biết trước loại nào không nên hiện UI "bị phạt"
export const NON_PENALTY_VIOLATION_TYPES: ViolationType[] = [
  "BAD_POSTURE",
  "POOR_LIGHTING",
];

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

// response riêng cho endpoint handleViolation, khớp HandleViolationResponse bên BE
export interface HandleViolationResponse {
  focusSessionResponse: FocusSessionResponse;
  isPenalty: boolean;
  type: ViolationType;
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

  //State quản lý quy tắc ứng dụng
  appRules: AppRulesResponse | null;
  allowedCache: Set<string>; // Bộ nhớ đệm lưu các App lạ đã được AI duyệt là an toàn

  // Trạng thái hiển thị của Pet ở Widget
  botMessage: string | null;
  botActions: BubbleAction[] | undefined;
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
  fetchAppRules: () => Promise<void>;
  addToAllowedCache: (appOrTitle: string) => void;
  clearAppRules: () => void;
}

export interface AppRulesResponse {
  blacklist: string[];
  whitelist: string[];
}
