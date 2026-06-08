import { focusApi } from "../api/focus.api";
import { invoke } from "@tauri-apps/api/core";
import type {
  CreateSessionRequest,
  FocusSessionResponse,
} from "../types/focus.types";

export async function startFocusSessionService(
  data: CreateSessionRequest,
): Promise<FocusSessionResponse> {
  // 1. Khởi tạo phiên dưới DB PostgreSQL qua Spring Boot
  const sessionData = await focusApi.createSession(data);

  // 2. Đánh thức OpenCV Camera của Python Bot ngầm
  await focusApi.startPythonCamera();

  // 3. Gọi Tauri Core ẩn Main Window và đưa Widget Window lên
  await invoke("toggle_windows_to_session");

  return sessionData;
}
