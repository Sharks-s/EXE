// features/bot-monitor/hooks/useBotStatus.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { botApi, type FaceStatus } from "../api/bot.api";

interface BotStatus {
  faceStatus: FaceStatus;
  shouldWarn: boolean;
  isCameraRunning: boolean;
  isConnected: boolean; // bot đang chạy không
}

const POLL_INTERVAL = 1000; // 3 giây

export function useBotStatus(isSessionActive: boolean) {
  const [status, setStatus] = useState<BotStatus>({
    faceStatus: "AWAY",
    shouldWarn: false,
    isCameraRunning: false,
    isConnected: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleCountRef = useRef(0); // đếm số lần AWAY liên tiếp

  // ── Start camera khi bắt đầu phiên ───────────────
  const startSession = useCallback(async () => {
    try {
      await botApi.startCamera();
      setStatus((s) => ({ ...s, isCameraRunning: true, isConnected: true }));
    } catch {
      // Python bot chưa chạy hoặc không có camera
      setStatus((s) => ({
        ...s,
        isConnected: false,
        faceStatus: "NO_CAMERA",
      }));
    }
  }, []);

  // ── Stop camera khi kết thúc phiên ───────────────
  const stopSession = useCallback(async () => {
    try {
      await botApi.stopCamera();
    } catch {
      // ignore
    }
    setStatus((s) => ({ ...s, isCameraRunning: false }));
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // ── Polling detect mỗi 3 giây ────────────────────
  useEffect(() => {
    if (!isSessionActive) return;

    const poll = async () => {
      try {
        const res = await botApi.detect();
        setStatus((s) => ({
          ...s,
          faceStatus: res.face_status,
          shouldWarn: res.should_warn,
          isConnected: true,
        }));

        // Reset idle count nếu FOCUSED
        if (res.face_status === "FOCUSED") {
          idleCountRef.current = 0;
        } else {
          idleCountRef.current += 1;
        }
      } catch {
        // Bot không phản hồi
        setStatus((s) => ({ ...s, isConnected: false }));
      }
    };

    // Poll ngay lần đầu
    poll();

    // Rồi poll mỗi 3 giây
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSessionActive]);

  // Số lần AWAY liên tiếp — dùng để tính có phạt không
  const idleCount = idleCountRef.current;

  return {
    ...status,
    idleCount,
    startSession,
    stopSession,
  };
}
