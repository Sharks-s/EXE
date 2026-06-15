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
