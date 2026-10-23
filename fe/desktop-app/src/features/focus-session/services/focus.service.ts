import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { useSongStore } from "@/features/song";
import { tauriStore } from "@/lib/tauriStore";
import { focusApi } from "../api/focus.api";
import { useFocusStore } from "../stores/focusStore";
import type {
  CreateSessionRequest,
  FocusSessionResponse,
} from "../types/focus.types";

export async function startFocusSessionService(
  data: CreateSessionRequest,
  beforeWindowToggle?: () => void | Promise<void>,
): Promise<FocusSessionResponse> {
  const sessionData = await focusApi.createSession(data);

  await useFocusStore.getState().initializeSessionConfig(sessionData);
  await tauriStore.set("active_session", sessionData);

  const { currentPet } = useFocusStore.getState();
  if (currentPet) {
    await emit("widget-pet-update", { petCode: currentPet.code });
  }

  await beforeWindowToggle?.();
  await invoke("toggle_windows_to_session");
  await emit("widget-active-state", { active: true });
  await useSongStore.getState().startSessionPlayback();

  return sessionData;
}
