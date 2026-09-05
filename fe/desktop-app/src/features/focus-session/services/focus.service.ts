import { focusApi } from "../api/focus.api";
import { invoke } from "@tauri-apps/api/core";
import type {
  CreateSessionRequest,
  FocusSessionResponse,
} from "../types/focus.types";
import { cameraApi } from "../api/cameraApi";
import { useSongStore } from "@/features/song";


export async function startFocusSessionService(
  data: CreateSessionRequest,
): Promise<FocusSessionResponse> {
  // 1. Khởi tạo phiên dưới DB PostgreSQL qua Spring Boot
  const sessionData = await focusApi.createSession(data);

  // 2. Đánh thức OpenCV Camera của Python Bot ngầm
  await cameraApi.start();

  // 3. Gọi Tauri Core ẩn Main Window và đưa Widget Window lên
  await invoke("toggle_windows_to_session");

  // 4. Ngừng nhạc đang nghe thử ở tab quản lý (nếu có), lấy lại danh sách mới nhất
  //    từ BE và tự động phát bài đầu tiên đã tích trong session
  useSongStore.getState().startSessionPlayback();

  return sessionData;
}
