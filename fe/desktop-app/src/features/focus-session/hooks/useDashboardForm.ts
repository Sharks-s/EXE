import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  CreateSessionRequest,
  AssistantPersonality,
  PresetGoalKey,
  GoalPresetItem,
  AssistantItem,
} from "../types/focus.types";

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

  const [selectedPreset, setSelectedPreset] = useState<PresetGoalKey | null>(
    "coding",
  );
  const [customGoal, setCustomGoal] = useState("");
  const [duration, setDuration] = useState<number>(25);
  const [assistant, setAssistant] = useState<AssistantPersonality>("MEAN");

  const handleSelectPreset = (key: PresetGoalKey) => {
    setSelectedPreset(key);
    setCustomGoal("");
  };

  const handleChangeCustomGoal = (value: string) => {
    setCustomGoal(value);
    setSelectedPreset(null);
  };

  const handleSelectAssistant = (id: AssistantPersonality) => setAssistant(id);
  const handleSelectDuration = (mins: number) => setDuration(mins);

  // Build request data — Dashboard dùng để gọi API sau khi camera xác minh xong
  const buildRequest = (): CreateSessionRequest => {
    const finalGoal =
      customGoal.trim() !== ""
        ? customGoal.trim()
        : t(PRESET_GOALS.find((g) => g.key === selectedPreset)?.labelKey ?? "");

    return {
      goal: finalGoal,
      durationMinutes: duration,
      personality: assistant,
    };
  };

  return {
    PRESET_GOALS,
    ASSISTANTS,
    DURATIONS,
    selectedPreset,
    customGoal,
    duration,
    assistant,
    handleSelectPreset,
    handleChangeCustomGoal,
    handleSelectDuration,
    handleSelectAssistant,
    buildRequest,
    t,
  };
}
