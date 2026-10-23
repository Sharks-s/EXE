import { pyApi } from "@/lib/axios-py";
import {
  CameraStatusResponse,
  CameraStartResponse,
  CameraDevice,
} from "../types/focus-camera.types";

export const cameraApi = {
  async start(deviceIndex?: number): Promise<boolean> {
    try {
      const res = await pyApi.post<CameraStartResponse>("/bot/camera/start", {
        device_index: deviceIndex ?? 0,
      });
      return res.data.ok;
    } catch (error) {
      console.error("Failed to start camera:", error);
      return false;
    }
  },

  async getDevices(): Promise<CameraDevice[]> {
    try {
      const res = await pyApi.get<{ devices: CameraDevice[] }>("/bot/camera/devices");
      return res.data.devices;
    } catch (error) {
      console.error("Failed to list camera devices:", error);
      return [];
    }
  },

  async stop(): Promise<void> {
    try {
      await pyApi.post("/bot/camera/stop");
    } catch (error) {
      console.error("Failed to stop camera:", error);
    }
  },

  async getStatus(): Promise<CameraStatusResponse | null> {
    try {
      const res = await pyApi.get<CameraStatusResponse>("/bot/camera/status");
      return res.data;
    } catch (error) {
      // Trả về null nếu lỗi hoặc timeout
      return null;
    }
  },

  getStreamUrl(): string {
    const baseUrl = pyApi.defaults.baseURL;
    return `${baseUrl}/bot/camera/stream`;
  },

  async calibrate(): Promise<boolean> {
    try {
      const res = await pyApi.post<{ ok?: boolean }>("/bot/camera/calibrate");
      return res.data.ok || res.status === 200;
    } catch (error) {
      console.error("Failed to calibrate camera:", error);
      return false;
    }
  },
};
