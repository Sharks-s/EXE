// features/focus-session/hooks/useFocusSession.ts
import { useEffect, useRef, useState } from "react";
import { useFocusStore } from "../stores/focusStore";
import { focusApi } from "../api/focus.api";
import { emit, listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useCameraViolationWatch } from "./useCameraViolationWatch";
import { useAppViolationWatch } from "./useAppViolationWatch";
import { useBotAction } from "./useBotAction";

// ── Hằng số cấu hình (gom lại 1 chỗ, không rải rác trong hàm) ──
const PROMPT_DURATION_SECONDS = 60;
const HEARTBEAT_INTERVAL_SECONDS = 60;
const CYCLE_DURATION_SECONDS = 25 * 60;
const MAIN_INTERVAL_MS = 1000;
const FINAL_STRETCH_WARNING_SECONDS = 3 * 60;

export function useFocusSession() {
  const { session, syncSession, appRules, allowedCache, violatingCache } = useFocusStore();

  // ── State phục vụ UI ──
  const [elapsed, setElapsed] = useState<number>(0);
  const [cycleElapsed, setCycleElapsed] = useState<number>(0);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [isPromptActive, setIsPromptActive] = useState<boolean>(false);
  const [isBreaking, setIsBreaking] = useState<boolean>(false);
  const [breakRemaining, setBreakRemaining] = useState<number>(0);
  const [promptCountdown, setPromptCountdown] = useState<number>(
    PROMPT_DURATION_SECONDS,
  );

  // ── Ref quản lý break/prompt (đồng bộ với state để đọc trong interval, tránh stale closure) ──
  const initialBreakMinutesRef = useRef<number>(0);
  const totalBreakSecondsRef = useRef<number>(0);
  const breakSecondsSinceLastCycleRef = useRef<number>(0);
  const breakStartedAtRef = useRef<number | null>(null);
  const promptStartedAtRef = useRef<number | null>(null);
  const isBreakingRef = useRef<boolean>(false);
  const isPromptActiveRef = useRef<boolean>(false);
  const breakRemainingRef = useRef<number>(0);
  const lastHeartbeatElapsedRef = useRef<number>(0);
  const hasWarnedFinalStretchRef = useRef<boolean>(false);

  // Đồng bộ session mới nhất vào ref để đọc trong interval, tránh stale closure
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const mainIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Gắn 3 hook con đã tách ──
  const { showBotAction } = useBotAction();

  const { tick: tickCameraWatch, stopCamera: stopCameraWatch } = useCameraViolationWatch({
    sessionId: session?.id ?? null,
    onPenaltyViolation: (type) => {
      handleViolation(type, "Camera Tracker", `Vi phạm camera: ${type}`, "penalty", "bubble");
    },
    onHealthViolation: (type) => {
      handleViolation(
        type,
        "Camera Tracker",
        type === "BAD_POSTURE" ? "Sai tư thế gù lưng" : "Môi trường thiếu sáng",
        "health",
        "bubble",
      );
    },
  });

  const { tick: tickAppWatch } = useAppViolationWatch({
    sessionId: session?.id ?? null,
    appRules,
    allowedCache,
    violatingCache,
    onViolation: (appName, windowTitle) => {
      handleViolation("ENTERTAINMENT", appName, windowTitle, "penalty", "warning");
    },
    onClassifyApp: handleClassifyApp,
  });

  const tickAppWatchRef = useRef(tickAppWatch);
  const tickCameraWatchRef = useRef(tickCameraWatch);
  useEffect(() => {
    tickAppWatchRef.current = tickAppWatch;
    tickCameraWatchRef.current = tickCameraWatch;
  });

  // Gọi khi phát hiện app lạ (không whitelist/blacklist) xuất hiện liên tục đủ lâu
  async function handleClassifyApp(appName: string, windowTitle: string) {
    const latestSession = sessionRef.current;
    if (!latestSession) return;

    const titleKey = windowTitle.toLowerCase().trim();

    try {
      const resData = await focusApi.classifyAndHandleViolation(latestSession.id, {
        appName,
        windowTitle,
      });

      syncSession(resData.focusSessionResponse, resData.violationCount);

      if (resData.violation) {
        useFocusStore.getState().addToViolatingCache(titleKey);

        if (resData.aiSpeech) {
          await emit("warning-update", { message: resData.aiSpeech });
          await emit("bot-bubble-update", {
            message: null,
            actions: undefined,
            isVisible: false,
            action: resData.aiAction,
          });
        }
      } else {
        useFocusStore.getState().addToAllowedCache(titleKey);
      }
    } catch (err) {
      console.error("[useFocusSession] Lỗi phân loại app lạ:", err);
    }
  }

  // Hàm dùng chung để gọi API xử lý vi phạm (thay cho việc mỗi hook con tự gọi API riêng)
  async function handleViolation(
    type: string,
    appName: string,
    windowTitle: string,
    priority: "penalty" | "health",
    channel: "bubble" | "warning",
  ) {
    const latestSession = sessionRef.current;
    if (!latestSession) return;

    try {
      const resData = await focusApi.handleViolation(latestSession.id, {
        type: type as any,
        appName,
        windowTitle,
      });
      syncSession(resData.focusSessionResponse, resData.violationCount);

      if (resData.aiSpeech) {
        useFocusStore.getState().addAiMessage(resData.aiSpeech);

        if (channel === "warning") {
          await emit("warning-update", { message: resData.aiSpeech });
          await emit("bot-bubble-update", {
            message: null,
            actions: undefined,
            isVisible: false,
            action: resData.aiAction,
          });
        } else {
          showBotAction({
            message: resData.aiSpeech,
            priority,
            action: resData.aiAction,
          });
        }
      }
    } catch (err) {
      console.error("[useFocusSession] Lỗi gửi vi phạm lên BE:", err);
    }
  }

  // Lắng nghe lệnh từ Widget gửi về (accept/reject break)
  useEffect(() => {
    const unlistenAccept = listen("widget-click-accept-break", () =>
      handleAcceptBreak(),
    );
    const unlistenReject = listen("widget-click-reject-break", () =>
      handleRejectBreak(),
    );
    return () => {
      unlistenAccept.then((f) => f());
      unlistenReject.then((f) => f());
    };
  }, []);

  // ── Bộ đếm trung tâm điều khiển toàn bộ hệ thống ──
  useEffect(() => {
    if (!sessionRef.current) {
      stopOrchestrator();
      return;
    }

    // Reset sạch sẽ toàn bộ ref của hook cha khi đổi session
    totalBreakSecondsRef.current = 0;
    breakSecondsSinceLastCycleRef.current = 0;
    breakStartedAtRef.current = null;
    promptStartedAtRef.current = null;
    lastHeartbeatElapsedRef.current = 0;
    hasWarnedFinalStretchRef.current = false;
    isBreakingRef.current = false;
    isPromptActiveRef.current = false;
    breakRemainingRef.current = 0;

    setElapsed(0);
    setIsBreaking(false);
    setIsPromptActive(false);
    setBreakRemaining(0);
    setPromptCountdown(PROMPT_DURATION_SECONDS);

    const startedAt = new Date(sessionRef.current.startedAt).getTime();

    mainIntervalRef.current = setInterval(async () => {
      const now = Date.now();

      // 1. Nếu đang nghỉ -> đếm ngược thời gian nghỉ, đóng băng giờ học, bỏ qua mọi thứ khác
      if (isBreakingRef.current) {
        setBreakRemaining((prev) => {
          const next = prev <= 1 ? 0 : prev - 1;
          breakRemainingRef.current = next;
          if (prev <= 1) {
            handleResumeSession();
          }
          return next;
        });
        return;
      }

      const latestSession = sessionRef.current;
      if (!latestSession) return;

      // 2. Tính tổng thời gian học thực tế (elapsed)
      const currentElapsed =
        Math.floor((now - startedAt) / 1000) - totalBreakSecondsRef.current;
      setElapsed(currentElapsed);

      // isPaused dùng chung cho Camera/App watch: tạm dừng quét khi đang hỏi nghỉ
      const isPausedForWatch = isPromptActiveRef.current;

      // ── HEARTBEAT: báo BE còn sống + cộng dailyUsedMinutes theo thời gian thực ──
      if (
        currentElapsed - lastHeartbeatElapsedRef.current >=
        HEARTBEAT_INTERVAL_SECONDS
      ) {
        lastHeartbeatElapsedRef.current = currentElapsed;
        focusApi.heartbeat(latestSession.id, currentElapsed)
          .then((res) => {
            useFocusStore.getState().setDailyUsage({
              dailyUsedMinutes: res.dailyUsedMinutes,
              dailyLimitMinutes: res.dailyLimitMinutes,
            });
          })
          .catch((err) => {
            console.error("[useFocusSession] Heartbeat thất bại:", err);
          });
      }

      // ── BỘ ĐẾM CYCLE 25 PHÚT ──
      const lastCycleAt = latestSession.lastCycleAt
        ? new Date(latestSession.lastCycleAt).getTime()
        : startedAt;

      const currentCycleElapsed = Math.max(
        Math.floor((now - lastCycleAt) / 1000) -
        breakSecondsSinceLastCycleRef.current,
        0,
      );
      setCycleElapsed(currentCycleElapsed);

      if (
        !isPromptActiveRef.current &&
        currentCycleElapsed >= CYCLE_DURATION_SECONDS
      ) {
        try {
          const updatedSession = await focusApi.completeCycle(latestSession.id);
          syncSession(updatedSession);

          const secondsLeftInSession =
            latestSession.plannedDuration * 60 - currentElapsed;

          if (secondsLeftInSession > 0) {
            const startedAtMs = Date.now();
            promptStartedAtRef.current = startedAtMs;
            isPromptActiveRef.current = true;
            setIsPromptActive(true);
            setPromptCountdown(PROMPT_DURATION_SECONDS);

            focusApi
              .getBreakPromptThoai(latestSession.id)
              .then((breakData) => {
                emit("bot-bubble-update", {
                  message: breakData.aiSpeech,
                  actions: breakData.actions,
                  isVisible: true,
                  action: "khingu",
                });
                useFocusStore.getState().addAiMessage(breakData.aiSpeech);
              })
              .catch((aiErr) => {
                console.error(
                  "[useFocusSession] Lỗi lấy thoại nghỉ ngơi từ AI, dùng fallback:",
                  aiErr,
                );
                const fallbackMessage = "Hết phiên rồi! Bạn nghỉ tí không?";
                emit("bot-bubble-update", {
                  message: fallbackMessage,
                  actions: [
                    { label: "Nghỉ ☕", variant: "primary" },
                    { label: "Học tiếp 🎯", variant: "secondary" },
                  ],
                  isVisible: true,
                  action: "khingu",
                });
                useFocusStore.getState().addAiMessage(fallbackMessage);
              });

            emit("tauri-break-prompt", {
              isOpen: true,
              startedAtMs,
              durationSeconds: PROMPT_DURATION_SECONDS,
            });
          }

          breakSecondsSinceLastCycleRef.current = 0;
        } catch (err) {
          console.error("[useFocusSession] Lỗi hoàn thành cycle:", err);
        }
      }


      const secondsUntilSessionEnd =
        latestSession.plannedDuration * 60 - currentElapsed;

      if (
        !hasWarnedFinalStretchRef.current &&
        secondsUntilSessionEnd > 0 &&
        secondsUntilSessionEnd <= FINAL_STRETCH_WARNING_SECONDS
      ) {
        hasWarnedFinalStretchRef.current = true;
        showBotAction({
          message: "Sắp xong rồi, cố lên chút nữa thôi!",
          priority: "health",
        });
      }
      // ── Đủ giờ session -> tự động kết thúc ──
      if (currentElapsed >= latestSession.plannedDuration * 60) {
        handleEndSession(false);
        return;
      }

      // ── Gọi tick của 2 hook con đã tách (Camera watch, App watch) ──
      tickAppWatchRef.current(isPausedForWatch);
      tickCameraWatchRef.current(currentElapsed, isPausedForWatch);

      // ── Đếm ngược tự động đóng popup hỏi nghỉ sau 60s nếu không phản hồi ──
      if (isPromptActiveRef.current && promptStartedAtRef.current !== null) {
        const promptElapsed = Math.floor(
          (now - promptStartedAtRef.current) / 1000,
        );
        const remaining = PROMPT_DURATION_SECONDS - promptElapsed;

        if (remaining <= 0) {
          isPromptActiveRef.current = false;
          setIsPromptActive(false);
          setPromptCountdown(PROMPT_DURATION_SECONDS);
          promptStartedAtRef.current = null;
          emit("tauri-break-prompt", { isOpen: false });
        } else {
          setPromptCountdown(remaining);
        }
      }
    }, MAIN_INTERVAL_MS);

    return () => stopOrchestrator();
  }, [session?.id]);

  const stopOrchestrator = () => {
    if (mainIntervalRef.current) {
      clearInterval(mainIntervalRef.current);
      mainIntervalRef.current = null;
    }
    stopCameraWatch();
  };

  const handleEndSession = async (isAborted: boolean) => {
    const latestSession = sessionRef.current;
    if (!latestSession) return;

    setIsEnding(true);
    stopOrchestrator();

    try {
      const res = await focusApi.endSession(latestSession.id, isAborted);
      syncSession(res);

      const main = await WebviewWindow.getByLabel("main");
      const widget = await WebviewWindow.getByLabel("widget");
      if (main && widget) {
        await main.show();
        await widget.hide();
      }
    } catch (err) {
      console.error("[useFocusSession] Lỗi khi kết thúc phiên học:", err);
    } finally {
      setIsEnding(false);
    }
  };

  const handleRejectBreak = () => {
    isPromptActiveRef.current = false;
    promptStartedAtRef.current = null;
    setIsPromptActive(false);
    setPromptCountdown(PROMPT_DURATION_SECONDS);
    emit("tauri-break-prompt", { isOpen: false });
    emit("bot-bubble-update", {
      message: null,
      actions: undefined,
      isVisible: false,
      action: undefined,
    });
  };

  const handleAcceptBreak = async () => {
    const latestSession = sessionRef.current;
    if (!latestSession) return;

    try {
      const updatedSession = await focusApi.pauseSession(latestSession.id);
      syncSession(updatedSession);

      breakStartedAtRef.current = Date.now();
      promptStartedAtRef.current = null;
      emit("tauri-break-prompt", { isOpen: false });
      emit("bot-bubble-update", {
        message: null,
        actions: undefined,
        isVisible: false,
        action: undefined,
      });

      initialBreakMinutesRef.current = updatedSession.accumulatedReward;

      isPromptActiveRef.current = false;
      setIsPromptActive(false);
      setPromptCountdown(PROMPT_DURATION_SECONDS);

      isBreakingRef.current = true;
      setIsBreaking(true);

      const seconds = updatedSession.accumulatedReward * 60;
      setBreakRemaining(seconds);
      breakRemainingRef.current = seconds;

      stopCameraWatch();

      const mainWindow = await WebviewWindow.getByLabel("main");
      const widgetWindow = await WebviewWindow.getByLabel("widget");
      await mainWindow?.show();
      await widgetWindow?.hide();
      await emit("widget-active-state", { active: false });
    } catch (err) {
      console.error("[useFocusSession] Lỗi khi bắt đầu nghỉ giải lao:", err);
    }
  };

  const handleResumeSession = async () => {
    const latestSession = sessionRef.current;
    if (!latestSession) return;

    try {
      if (breakStartedAtRef.current !== null) {
        const justBrokeSeconds = Math.floor(
          (Date.now() - breakStartedAtRef.current) / 1000,
        );
        totalBreakSecondsRef.current += justBrokeSeconds;
        breakSecondsSinceLastCycleRef.current += justBrokeSeconds;
        breakStartedAtRef.current = null;
      }

      // Làm tròn LÊN (ceil) số phút còn lại -> minutesUsed nhỏ hơn hoặc bằng cách tính cũ, có lợi cho user
      const minutesUsed = Math.max(
        0,
        initialBreakMinutesRef.current - Math.ceil(breakRemainingRef.current / 60),
      );

      const updatedSession = await focusApi.resumeSession(
        latestSession.id,
        minutesUsed,
      );
      syncSession(updatedSession);

      isBreakingRef.current = false;
      setIsBreaking(false);
      setBreakRemaining(0);
      breakRemainingRef.current = 0;
      initialBreakMinutesRef.current = 0;
    } catch (err) {
      console.error("[useFocusSession] Lỗi khi quay lại phiên học:", err);
    }
  };

  return {
    elapsed,
    isEnding,
    handleEndSession,
    isPromptActive,
    isBreaking,
    breakRemaining,
    promptCountdown,
    handleRejectBreak,
    handleAcceptBreak,
    handleResumeSession,
    cycleElapsed,
  };
}