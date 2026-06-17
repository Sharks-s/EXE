import { useEffect, useRef, useState } from "react";
import { CameraStatusResponse } from "../types/focus-camera.types";
import { cameraApi } from "../api/cameraApi";

export const useCameraSetup = (isOpen: boolean) => {
  const [status, setStatus] = useState<CameraStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const startedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    isMountedRef.current = true;
    let intervalId: ReturnType<typeof setInterval>;

    const initCamera = async () => {
      if (startedRef.current) return;

      setIsLoading(true);
      setError(null);

      const success = await cameraApi.start();

      if (!isMountedRef.current) {
        cameraApi.stop().catch(() => {});
        return;
      }

      setIsLoading(false);

      if (!success) {
        setError("Không thể kết nối camera. Vui lòng kiểm tra lại thiết bị.");
        return;
      }

      startedRef.current = true;

      intervalId = setInterval(async () => {
        if (!isMountedRef.current) return;

        try {
          const data = await cameraApi.getStatus();
          if (data && isMountedRef.current) {
            setStatus(data);
          }
        } catch (err) {
          // Giữ lại log lỗi hệ thống này để sau này debug nếu API getStatus bị crash đột xuất
          console.error("Error fetching camera status:", err);
        }
      }, 500);
    };

    initCamera();

    return () => {
      isMountedRef.current = false;
      if (intervalId) clearInterval(intervalId);

      setTimeout(() => {
        if (!isMountedRef.current && startedRef.current) {
          cameraApi.stop().catch(() => {});
          startedRef.current = false;
          setStatus(null);
        }
      }, 100);
    };
  }, [isOpen]);

  const canProceed = !!status?.all_pass;

  return {
    status,
    error,
    isLoading,
    canProceed,
    streamUrl: cameraApi.getStreamUrl(),
  };
};
