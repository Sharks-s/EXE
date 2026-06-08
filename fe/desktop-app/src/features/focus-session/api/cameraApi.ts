import {
  CameraStatusResponse,
  CameraStartResponse,
} from "../types/focus-camera.types";

const BOT_BASE_URL = "http://localhost:8000/bot/camera";

export const cameraApi = {
  async start(): Promise<boolean> {
    try {
      const res = await fetch(`${BOT_BASE_URL}/start`, { method: "POST" });
      if (!res.ok) return false;
      const data: CameraStartResponse = await res.json();
      return data.ok;
    } catch (error) {
      console.error("Failed to start camera:", error);
      return false;
    }
  },

  async stop(): Promise<void> {
    try {
      await fetch(`${BOT_BASE_URL}/stop`, { method: "POST" });
    } catch (error) {
      console.error("Failed to stop camera:", error);
    }
  },

  async getStatus(): Promise<CameraStatusResponse | null> {
    try {
      const res = await fetch(`${BOT_BASE_URL}/status`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  getStreamUrl(): string {
    return `${BOT_BASE_URL}/stream`;
  },
};
