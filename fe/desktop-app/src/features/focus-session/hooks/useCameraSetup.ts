import { useEffect, useRef, useState, useCallback } from "react";
import { CameraStatusResponse, CameraDevice } from "../types/focus-camera.types";
import { cameraApi } from "../api/cameraApi";
import {
  getPreferredCameraIndex,
  savePreferredCameraIndex,
} from "../utils/cameraPreference";

export const useCameraSetup = (isOpen: boolean) => {
  const [status, setStatus] = useState<CameraStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Camera device selection
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number>(0);
  const [isLoadingDevices, setIsLoadingDevices] = useState<boolean>(false);
  const [hasLoadedDevices, setHasLoadedDevices] = useState<boolean>(false);

  const startedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(false);

  // Fetch available devices on open
  useEffect(() => {
    if (!isOpen) {
      setDevices([]);
      setHasLoadedDevices(false);
      return;
    }

    let cancelled = false;
    setIsLoadingDevices(true);
    setHasLoadedDevices(false);
    setError(null);
    cameraApi.getDevices().then((devs) => {
      if (cancelled) return;
      setDevices(devs);
      if (devs.length > 0) {
        const savedIndex = getPreferredCameraIndex();
        const exists = savedIndex !== null && devs.some((d) => d.index === savedIndex);
        setSelectedDeviceIndex(savedIndex !== null && exists ? savedIndex : devs[0].index);
      }
    }).finally(() => {
      if (!cancelled) {
        setIsLoadingDevices(false);
        setHasLoadedDevices(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Start camera with selected device
  useEffect(() => {
    if (!isOpen) return;
    if (isLoadingDevices || !hasLoadedDevices || devices.length === 0) return;

    isMountedRef.current = true;
    let intervalId: ReturnType<typeof setInterval>;

    const initCamera = async () => {
      // Always restart when device changes
      if (startedRef.current) {
        await cameraApi.stop().catch(() => {});
        startedRef.current = false;
      }

      setIsLoading(true);
      setError(null);
      setStatus(null);

      const success = await cameraApi.start(selectedDeviceIndex);

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
      // Persist selection
      savePreferredCameraIndex(selectedDeviceIndex);

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
  }, [devices.length, hasLoadedDevices, isOpen, selectedDeviceIndex, isLoadingDevices]);

  const changeDevice = useCallback((index: number) => {
    setSelectedDeviceIndex(index);
  }, []);

  const canProceed = !!status?.all_pass;

  return {
    status,
    error,
    isLoading,
    canProceed,
    streamUrl: cameraApi.getStreamUrl(),
    // Camera selection
    devices,
    selectedDeviceIndex,
    isLoadingDevices,
    hasNoDevices: hasLoadedDevices && devices.length === 0,
    changeDevice,
  };
};
