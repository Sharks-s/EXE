import { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { startFocusSessionService } from "../services/focus.service";
import type {
  CreateSessionRequest,
  AssistantPersonality,
  PresetGoalKey,
  GoalPresetItem,
  AssistantItem,
} from "../types/focus.types";
import type { ApiErrorResponse } from "../../../types";

// Khai báo tĩnh ngoài hook — không tính toán lại khi re-render
const PRESET_GOALS: GoalPresetItem[] = [
  { key: "coding", labelKey: "common:dashboard.presets.coding" },
  { key: "assignment", labelKey: "common:dashboard.presets.assignment" },
  { key: "study", labelKey: "common:dashboard.presets.study" },
  { key: "meeting", labelKey: "common:dashboard.presets.meeting" },
  { key: "writing", labelKey: "common:dashboard.presets.writing" },
];

const ASSISTANTS: AssistantItem[] = [
  { id: "SWEET", labelKey: "common:dashboard.assistants.sweet" },
  { id: "STRICT", labelKey: "common:dashboard.assistants.strict" },
  { id: "MEAN", labelKey: "common:dashboard.assistants.mean" },
];

const DURATIONS = [25, 45, 50, 60] as const;

export function useDashboardForm() {
  const { t } = useTranslation(["common", "validationErrors"]);

  // ── States ─────────────────────────────────────────
  const [selectedPreset, setSelectedPreset] = useState<PresetGoalKey | null>(
    "coding",
  );
  const [customGoal, setCustomGoal] = useState("");
  const [duration, setDuration] = useState<number>(25);
  const [assistant, setAssistant] = useState<AssistantPersonality>("MEAN");

  const [isLoading, setIsLoading] = useState(false);
  const [localGlobalError, setLocalGlobalError] = useState("");

  // ── Handlers & Dọn dẹp lỗi khi user tương tác lại ──
  const handleSelectPreset = (key: PresetGoalKey) => {
    setSelectedPreset(key);
    setCustomGoal("");
    setLocalGlobalError("");
  };

  const handleChangeCustomGoal = (value: string) => {
    setCustomGoal(value);
    setSelectedPreset(null);
    setLocalGlobalError("");
  };

  const handleSelectAssistant = (id: AssistantPersonality) => {
    setAssistant(id);
    setLocalGlobalError("");
  };

  const handleSelectDuration = (mins: number) => {
    setDuration(mins);
    setLocalGlobalError("");
  };

  // ── Submit Logic ───────────────────────────────────
  const onSubmit = async () => {
    setIsLoading(true);
    setLocalGlobalError("");

    // Unwrap chuỗi mục tiêu dựa trên lựa chọn của user
    const finalGoal =
      customGoal.trim() !== ""
        ? customGoal
        : t(PRESET_GOALS.find((g) => g.key === selectedPreset)?.labelKey ?? "");

    const requestData: CreateSessionRequest = {
      goal: finalGoal,
      durationMinutes: duration,
      personality: assistant,
    };

    try {
      await startFocusSessionService(requestData);
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        // Khớp hoàn toàn với cách hiển thị lỗi toàn cục của useLoginForm
        setLocalGlobalError(
          err.response.data.message || "Failed to start session.",
        );
      } else {
        setLocalGlobalError("An unexpected connection error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Statics
    PRESET_GOALS,
    ASSISTANTS,
    DURATIONS,

    // States
    selectedPreset,
    customGoal,
    duration,
    assistant,
    isLoading,
    displayGlobalError: localGlobalError,

    // Handlers
    handleSelectPreset,
    handleChangeCustomGoal,
    handleSelectDuration,
    handleSelectAssistant,
    onSubmit,
    t,
  };
}
