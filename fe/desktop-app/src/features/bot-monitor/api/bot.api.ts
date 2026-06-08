// features/bot-monitor/api/bot.api.ts
import axios from "axios";

const botClient = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 5000,
});

export type FaceStatus = "FOCUSED" | "LOOKING_DOWN" | "AWAY" | "NO_CAMERA";

export interface DetectResponse {
  face_status: FaceStatus;
  should_warn: boolean;
}

export interface CameraStatusResponse {
  is_running: boolean;
}

export const botApi = {
  startCamera: () =>
    botClient
      .post<CameraStatusResponse>("/bot/camera/start")
      .then((r) => r.data),

  stopCamera: () =>
    botClient
      .post<CameraStatusResponse>("/bot/camera/stop")
      .then((r) => r.data),

  cameraStatus: () =>
    botClient
      .get<CameraStatusResponse>("/bot/camera/status")
      .then((r) => r.data),

  detect: () =>
    botClient.get<DetectResponse>("/bot/detect").then((r) => r.data),
};
