import { useEffect, useRef, useState } from "react";
import { CameraStatusResponse } from "../types/focus-camera.types";
import { cameraApi } from "../api/cameraApi";

export const useCameraSetup = (isOpen: boolean) => {
  const [status, setStatus] = useState<CameraStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Chống StrictMode double-effect (mount → cleanup → mount lại trong dev)
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    let intervalId: ReturnType<typeof setInterval>;
    let cancelled = false;

    const initCamera = async () => {
      if (startedRef.current) return;
      startedRef.current = true;

      setIsLoading(true);
      setError(null);

      const success = await cameraApi.start();

      if (cancelled) {
        return;
      }

      setIsLoading(false);

      if (!success) {
        setError("Không thể kết nối camera. Vui lòng kiểm tra lại thiết bị.");
        startedRef.current = false;
        return;
      }

      intervalId = setInterval(async () => {
        if (cancelled) {
          clearInterval(intervalId);
          return;
        }

        const data = await cameraApi.getStatus();
        if (data && !cancelled) {
          setStatus(data);
        }
      }, 500);
    };

    initCamera();

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (startedRef.current) {
        cameraApi.stop().catch(() => {});
        startedRef.current = false;
      }
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
