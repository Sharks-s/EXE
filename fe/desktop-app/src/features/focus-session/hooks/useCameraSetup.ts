import { useEffect, useState } from "react";
import { CameraStatusResponse } from "../types/focus-camera.types";
import { cameraApi } from "../api/cameraApi";

export const useCameraSetup = (isOpen: boolean) => {
  const [status, setStatus] = useState<CameraStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let intervalId: ReturnType<typeof setInterval>;

    const initCamera = async () => {
      setIsLoading(true);
      setError(null);

      const success = await cameraApi.start();
      setIsLoading(false);

      if (!success) {
        setError("Không thể kết nối camera. Vui lòng kiểm tra lại thiết bị.");
        return;
      }

      // Kích hoạt Polling định kỳ lấy dữ liệu tĩnh từ RAM Bot
      intervalId = setInterval(async () => {
        const data = await cameraApi.getStatus();
        if (data) {
          setStatus(data);
        }
      }, 500);
    };

    initCamera();

    // Cleanup: Tự động xóa loop và ngắt phần cứng camera khi Modal đóng
    return () => {
      if (intervalId) clearInterval(intervalId);
      cameraApi.stop();
      setStatus(null);
    };
  }, [isOpen]);

  const canProceed = !!(status?.all_pass && status?.face_detected);

  return {
    status,
    error,
    isLoading,
    canProceed,
    streamUrl: cameraApi.getStreamUrl(),
  };
};
