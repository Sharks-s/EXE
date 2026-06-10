export type AssistantPersonality = "SWEET" | "STRICT" | "MEAN";
export type PresetGoalKey =
  | "coding"
  | "assignment"
  | "study"
  | "meeting"
  | "writing";

export interface CreateSessionRequest {
  goal: string;
  durationMinutes: number;
  personality: AssistantPersonality;
}

export interface FocusSessionResponse {
  sessionId: number;
  userId: string;
  goal: string;
  durationMinutes: number;
  personality: AssistantPersonality;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
}

export interface GoalPresetItem {
  key: PresetGoalKey;
  labelKey: string;
}

export interface AssistantItem {
  id: AssistantPersonality;
  labelKey: string;
}
