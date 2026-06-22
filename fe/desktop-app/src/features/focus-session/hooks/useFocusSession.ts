import { useEffect, useRef, useState } from "react";
import { useFocusStore } from "../stores/focusStore";
import { focusApi } from "../api/focus.api";
import { cameraApi } from "../api/cameraApi";
import { emit, listen } from "@tauri-apps/api/event";
import type { ViolationType } from "../types/focus.types";

const PROMPT_DURATION_SECONDS = 60;

export function useFocusSession() {
  //  Lấy đúng các trạng thái cần thiết phục vụ cho việc check App
  const {
    session,
    syncSession,
    appRules,
    allowedCache,
    updateBotBubble,
    clearBotBubble,
  } = useFocusStore();

  const [elapsed, setElapsed] = useState<number>(0);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [isPromptActive, setIsPromptActive] = useState<boolean>(false);
  const [isBreaking, setIsBreaking] = useState<boolean>(false);
  const [breakRemaining, setBreakRemaining] = useState<number>(0);
  const [promptCountdown, setPromptCountdown] = useState<number>(
    PROMPT_DURATION_SECONDS,
  );
  const initialBreakMinutesRef = useRef<number>(0);

  // Quản lý thời gian nghỉ bù và phạm vi
  const totalBreakSecondsRef = useRef<number>(0);
  const breakSecondsSinceLastCycleRef = useRef<number>(0);
  const breakStartedAtRef = useRef<number | null>(null);

  // Mốc tuyệt đối lúc bubble hỏi nghỉ bắt đầu
  const promptStartedAtRef = useRef<number | null>(null);

  // Bộ biến Ref để kiểm soát logic ngầm trong Interval (chống rung lắc)
  const isBreakingRef = useRef<boolean>(false);
  const isPromptActiveRef = useRef<boolean>(false);
  const breakRemainingRef = useRef<number>(0);

  // Đồng bộ State sang Ref để tránh Stale Closure
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const mainIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── CÁC BIẾN REF KIỂM SOÁT CAMERA & PHẠT BẬC THANG ──
  const isCameraStartedRef = useRef<boolean>(false);
  const lastCameraActionAtRef = useRef<number>(Date.now());
  const isScanningPeriodRef = useRef<boolean>(false);
  const observeWindowSecondsRef = useRef<number>(0);
  const scanDurationRef = useRef<number>(25);
  const lastCameraOffAtRef = useRef<number>(0);

  const distractCounterRef = useRef<number>(0);
  const penaltyThresholdRef = useRef<number>(10);
  const penaltyCountInRowRef = useRef<number>(0);

  const healthViolationCounterRef = useRef<number>(0);
  const currentViolationRef = useRef<ViolationType | null>(null);
  const currentHealthViolationRef = useRef<ViolationType | null>(null);

  const OBSERVE_WINDOW_SECONDS = 25;
  const CAMERA_CHECK_INTERVAL_SECONDS = 3 * 60;

  // ──  CÁC BIẾN REF KIỂM SOÁT BỘ LỌC 5 GIÂY CHO APP/TAB WINDOWS (GIỮ NGUYÊN) ──
  const currentDistractingAppRef = useRef<string | null>(null);
  const appDistractCounterRef = useRef<number>(0);
  const isHandlingAppViolationRef = useRef<boolean>(false);
  const botBubbleTimerRef = useRef<number | null>(null);

  // Lắng nghe lệnh từ Widget gửi về
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

  // Bộ đếm trung tâm điều khiển toàn bộ hệ thống
  useEffect(() => {
    if (!sessionRef.current) {
      stopOrchestrator();
      return;
    }

    // Reset sạch sẽ toàn bộ Ref cũ
    totalBreakSecondsRef.current = 0;
    breakSecondsSinceLastCycleRef.current = 0;
    breakStartedAtRef.current = null;
    promptStartedAtRef.current = null;
    isBreakingRef.current = false;
    isPromptActiveRef.current = false;
    breakRemainingRef.current = 0;

    isCameraStartedRef.current = false;
    isScanningPeriodRef.current = false;
    lastCameraActionAtRef.current = Date.now();
    lastCameraOffAtRef.current = 0;
    observeWindowSecondsRef.current = 0;
    scanDurationRef.current = 25;
    distractCounterRef.current = 0;
    penaltyThresholdRef.current = 10;
    penaltyCountInRowRef.current = 0;
    healthViolationCounterRef.current = 0;
    currentViolationRef.current = null;
    currentHealthViolationRef.current = null;

    // Reset Ref của phần App Rules
    currentDistractingAppRef.current = null;
    appDistractCounterRef.current = 0;
    isHandlingAppViolationRef.current = false;

    setElapsed(0);
    setIsBreaking(false);
    setIsPromptActive(false);
    setBreakRemaining(0);
    setPromptCountdown(PROMPT_DURATION_SECONDS);

    const startedAt = new Date(sessionRef.current.startedAt).getTime();

    mainIntervalRef.current = setInterval(async () => {
      const now = Date.now();

      // 1. Nếu đang nghỉ -> Đếm ngược thời gian nghỉ, đóng băng giờ học
      if (isBreakingRef.current) {
        setBreakRemaining((prev) => {
          const next = prev <= 1 ? 0 : prev - 1;
          breakRemainingRef.current = next;
          if (prev <= 1) {
            console.log(
              "[useFocusSession] Hết giờ nghỉ! Tự động gọi resume...",
            );
            handleResumeSession();
          }
          return next;
        });
        return;
      }

      // 2. Tính tổng thời gian học thực tế (elapsed)
      const currentElapsed =
        Math.floor((now - startedAt) / 1000) - totalBreakSecondsRef.current;
      setElapsed(currentElapsed);

      const latestSession = sessionRef.current;
      if (!latestSession) return;

      // ── BỘ ĐẾM 1: KIỂM TRA HIỆP 25 PHÚT ──
      const lastCycleAt = latestSession.lastCycleAt
        ? new Date(latestSession.lastCycleAt).getTime()
        : startedAt;

      const elapsedSecondsFromLastCycle =
        Math.floor((now - lastCycleAt) / 1000) -
        breakSecondsSinceLastCycleRef.current;

      if (
        !isBreakingRef.current &&
        !isPromptActiveRef.current &&
        elapsedSecondsFromLastCycle >= 25 * 60
      ) {
        try {
          console.log("[useFocusSession] Đủ 25 phút! Gọi completeCycle...");
          // 1. Core logic: Chốt cycle lưu DB và nhận session mới cập nhật điểm
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

            // LUỒNG AI: Gọi API riêng biệt xin câu thoại rủ rê nghỉ ngơi từ AI
            focusApi
              .getBreakPromptThoai(latestSession.id)
              .then((breakData) => {
                // Nạp thẳng câu thoại và mảng 2 nút bấm động do AI nghĩ ra vào Store
                updateBotBubble(
                  breakData.aiSpeech, // Chữ AI sinh ra (Ví dụ: "Hết hiệp rồi, làm cốc cafe không?")
                  breakData.actions, // Mảng nút bấm động (Ví dụ: [{"label": "Đi luôn ☕"}, {"label": "Cày tiếp 🎯"}])
                  true, // Hiện bubble lên Widget
                );
              })
              .catch((aiErr) => {
                console.error(
                  "Lỗi lấy thoại nghỉ ngơi từ AI, dùng fallback:",
                  aiErr,
                );
                updateBotBubble(
                  "Hết hiệp rồi! Bạn nghỉ tí không?",
                  [
                    { label: "Nghỉ ☕", variant: "primary" },
                    { label: "Học tiếp 🎯", variant: "secondary" },
                  ],
                  true,
                );
              });

            // 3. Kích hoạt đếm ngược ngầm phát tín hiệu đồng bộ sang cho Widget
            emit("tauri-break-prompt", {
              isOpen: true,
              startedAtMs,
              durationSeconds: PROMPT_DURATION_SECONDS,
            });
          }

          breakSecondsSinceLastCycleRef.current = 0;
        } catch (err) {
          console.error("Lỗi hoàn thành hiệp:", err);
        }
      }

      if (currentElapsed >= latestSession.plannedDuration * 60) {
        handleEndSession(false);
        return;
      }

      // ──  BỘ ĐẾM QUÉT APP/TAB HOẠT ĐỘNG QUA TAURI (CHỐNG RUNG 5 GIÂY) ──
      if (
        !isBreakingRef.current &&
        !isPromptActiveRef.current &&
        !isHandlingAppViolationRef.current
      ) {
        try {
          // 1. Gọi Rust thông qua Tauri lấy thông tin cửa sổ hiện tại
          const activeWindow = await import("@tauri-apps/api/core")
            .then((m) =>
              m.invoke<{ app_name: string; title: string }>(
                "get_active_window_info",
              ),
            )
            .catch(() => null);

          if (activeWindow) {
            const appNameLower = activeWindow.app_name.toLowerCase().trim();
            const titleLower = activeWindow.title.toLowerCase().trim();

            const containsKeyword = (target: string, keywords: string[]) =>
              keywords.some((kw) => target.includes(kw.toLowerCase().trim()));

            let isViolationApp = false;

            // Kiểm tra xem có nằm trong Whitelist/Cache an toàn của AI không
            const isWhitelisted =
              (appRules?.whitelist &&
                (containsKeyword(appNameLower, appRules.whitelist) ||
                  containsKeyword(titleLower, appRules.whitelist))) ||
              allowedCache.has(appNameLower) ||
              allowedCache.has(titleLower);

            if (!isWhitelisted) {
              const isBlacklisted =
                appRules?.blacklist &&
                (containsKeyword(appNameLower, appRules.blacklist) ||
                  containsKeyword(titleLower, appRules.blacklist));

              if (isBlacklisted) {
                isViolationApp = true;
              }
            }

            // 3. Thực thi bộ đếm chống rung 5 giây liên tục
            if (isViolationApp) {
              const currentTarget = `${appNameLower} | ${titleLower}`;

              if (currentDistractingAppRef.current === currentTarget) {
                appDistractCounterRef.current += 1;
              } else {
                currentDistractingAppRef.current = currentTarget;
                appDistractCounterRef.current = 1;
              }

              // ⏱️ Đủ 5 giây thử thách -> Bắt đầu nổ phạt!
              if (appDistractCounterRef.current >= 5) {
                console.log(
                  `[AppRule] Phát hiện mở App giải trí liên tục 5s: ${currentTarget}. Gửi phạt...`,
                );
                isHandlingAppViolationRef.current = true; // Khóa mạch lại để đợi API phản hồi

                appDistractCounterRef.current = 0;
                currentDistractingAppRef.current = null;

                focusApi
                  .handleViolation(latestSession.id, {
                    type: "ENTERTAINMENT",
                    appName: activeWindow.app_name,
                    windowTitle: activeWindow.title,
                  })
                  .then((resData) => {
                    // 1. Đồng bộ session phiên học về Store chính
                    syncSession(
                      resData.focusSessionResponse,
                      resData.violationCount,
                    );

                    // 2. Kích hoạt chú khỉ mắng bằng câu thoại AI real-time từ Spring Boot nhả về
                    if (resData.aiSpeech) {
                      updateBotBubble(resData.aiSpeech, [], true);

                      // 3. Xử lý Timer: Tự lặn bubble sau 6 giây, chống nổ đè timer cũ
                      if (botBubbleTimerRef.current)
                        clearTimeout(botBubbleTimerRef.current);
                      botBubbleTimerRef.current = setTimeout(() => {
                        clearBotBubble();
                      }, 6000);
                    }
                  })
                  .catch((err) => {
                    console.error("Lỗi gửi phạt AppRule lên BE:", err);
                  })
                  .finally(() => {
                    isHandlingAppViolationRef.current = false; // Mở khóa mạch cấu trúc quét
                  });
              }
            } else {
              // Nếu quay lại học ngoan ngoãn -> Xóa bộ đếm giây tích lũy ngay lập tức
              if (appDistractCounterRef.current > 0) {
                appDistractCounterRef.current = 0;
                currentDistractingAppRef.current = null;
              }
            }
          }
        } catch (appErr) {
          console.error("Lỗi trong chu kỳ quét App Windows qua Tauri:", appErr);
        }
      }

      // ── BỘ ĐẾM 2: CAMERA QUÉT ĐỊNH KỲ & PHẠT BẬC THANG ──
      if (!isBreakingRef.current && !isPromptActiveRef.current) {
        if (
          !isCameraStartedRef.current &&
          currentElapsed - lastCameraOffAtRef.current >=
            CAMERA_CHECK_INTERVAL_SECONDS
        ) {
          console.log(
            "[useFocusSession] Đủ 3 phút kể từ lần tắt trước. Kích hoạt Camera...",
          );
          isCameraStartedRef.current = true;
          isScanningPeriodRef.current = true;
          scanDurationRef.current = 25;
          lastCameraActionAtRef.current = now;
          observeWindowSecondsRef.current = 0;
          distractCounterRef.current = 0;
          currentViolationRef.current = null;

          cameraApi.start().catch((err) => {
            console.error("Lỗi khởi động Cam Python:", err);
            isCameraStartedRef.current = false;
            isScanningPeriodRef.current = false;
          });
          return;
        }

        // 2. Xử lý dữ liệu từ Camera đang chạy
        if (isCameraStartedRef.current) {
          try {
            const camStatus = await cameraApi.getStatus();

            if (camStatus) {
              let penaltyViolation: "AWAY" | "LOOK_AWAY" | null = null;
              let healthViolation:
                | "TOO_CLOSE"
                | "BAD_POSTURE"
                | "POOR_LIGHTING"
                | null = null;

              // Phân loại theo thứ tự ưu tiên: penalty trước, health sau
              if (!camStatus.face_detected) {
                penaltyViolation = "AWAY";
              } else if (
                Math.abs(camStatus.yaw) > 25 ||
                camStatus.pitch < -20
              ) {
                boxSizing: "LOOK_AWAY";
                penaltyViolation = "LOOK_AWAY";
              } else if (!camStatus.checks.close_enough) {
                healthViolation = "TOO_CLOSE";
              } else if (!camStatus.checks.shoulders_visible) {
                healthViolation = "BAD_POSTURE";
              } else if (!camStatus.checks.lighting_ok) {
                healthViolation = "POOR_LIGHTING";
              }

              // ── KHU VỰC 1: NHÓM PHẠT THẬT (AWAY / LOOK_AWAY / TOO_CLOSE) ──
              if (penaltyViolation) {
                // Có lỗi phạt phạt thật → ĐẬP NÁT khung 25s quan sát về 0 ngay lập tức
                observeWindowSecondsRef.current = 0;

                if (currentViolationRef.current === penaltyViolation) {
                  distractCounterRef.current += 1;
                } else {
                  // Đổi loại lỗi → reset đếm liên tục, bắt đầu lại từ 1
                  currentViolationRef.current = penaltyViolation;
                  distractCounterRef.current = 1;
                }

                if (distractCounterRef.current >= penaltyThresholdRef.current) {
                  const violationType = currentViolationRef.current;
                  distractCounterRef.current = 0;
                  currentViolationRef.current = null;
                  penaltyCountInRowRef.current += 1;

                  if (penaltyCountInRowRef.current <= 3) {
                    // Chỉ trừ điểm tối đa 3 lần trong 1 đợt quét
                    console.log(
                      `[Camera Penalty] Vi phạm [${violationType}] lần ${penaltyCountInRowRef.current} trong đợt này. Gửi lên BE...`,
                    );

                    const resData = await focusApi.handleViolation(
                      latestSession.id,
                      {
                        type: violationType,
                        appName: "Camera Tracker",
                        windowTitle: `Vi phạm bậc thang lần ${penaltyCountInRowRef.current}: ${violationType}`,
                      },
                    );
                    syncSession(
                      resData.focusSessionResponse,
                      resData.violationCount,
                    );

                    // 💬 LUỒNG AI: Đẩy lời mắng phạt từ AI lên Widget chú khỉ
                    if (resData.aiSpeech) {
                      updateBotBubble(resData.aiSpeech, [], true);

                      if (botBubbleTimerRef.current)
                        clearTimeout(botBubbleTimerRef.current);
                      botBubbleTimerRef.current = window.setTimeout(() => {
                        clearBotBubble();
                      }, 6000);
                    }
                  } else {
                    // Lần 4 trở đi: đã đạt giới hạn đợt quét này, không trừ thêm
                    console.log(
                      `[Camera Penalty] Đã đạt tối đa 3 lần phạt trong đợt quét này. Bỏ qua.`,
                    );
                  }

                  // Nâng ngưỡng bậc thang cho lần vi phạm kế tiếp trong đợt
                  if (penaltyCountInRowRef.current === 1) {
                    penaltyThresholdRef.current = 20; // lần 2 phải vi phạm liên tục 20s
                  } else if (penaltyCountInRowRef.current >= 2) {
                    penaltyThresholdRef.current = 30; // lần 3+ phải 30s
                  }
                }
              } else {
                // Không có lỗi phạt → reset bộ đếm nhóm phạt
                if (distractCounterRef.current > 0)
                  distractCounterRef.current = 0;
                currentViolationRef.current = null;
              }

              // ── KHU VỰC 2: NHÓM SỨC KHỎE (BAD_POSTURE / POOR_LIGHTING) ──
              // Hoàn toàn độc lập với nhóm phạt, không ảnh hưởng khung 25s tắt cam
              if (healthViolation) {
                if (currentHealthViolationRef.current === healthViolation) {
                  healthViolationCounterRef.current += 1;
                } else {
                  currentHealthViolationRef.current = healthViolation;
                  healthViolationCounterRef.current = 1;
                }

                if (healthViolationCounterRef.current >= 10) {
                  const hType = currentHealthViolationRef.current;
                  healthViolationCounterRef.current = 0;
                  currentHealthViolationRef.current = null;

                  console.log(
                    `[Camera Health] Nhắc nhở [${hType}] đủ 10s. Ghi log + nhắc Widget.`,
                  );

                  const resData = await focusApi.handleViolation(
                    latestSession.id,
                    {
                      type: hType,
                      appName: "Camera Tracker",
                      windowTitle:
                        hType === "BAD_POSTURE"
                          ? "Sai tư thế gù lưng"
                          : "Môi trường thiếu sáng",
                    },
                  );
                  syncSession(
                    resData.focusSessionResponse,
                    resData.violationCount,
                  );
                  // emit("widget-health-warning", { type: hType });

                  //  Đẩy lời nhắc nhở sức khỏe ấm áp từ AI lên Widget chú khỉ
                  if (resData.aiSpeech) {
                    updateBotBubble(resData.aiSpeech, [], true);

                    if (botBubbleTimerRef.current)
                      clearTimeout(botBubbleTimerRef.current);
                    botBubbleTimerRef.current = window.setTimeout(() => {
                      clearBotBubble();
                    }, 6000);
                  }
                }
              } else {
                // Không có lỗi sức khỏe → reset bộ đếm nhóm sức khỏe
                if (healthViolationCounterRef.current > 0)
                  healthViolationCounterRef.current = 0;
                currentHealthViolationRef.current = null;
              }

              // ── KHU VỰC 3: KIỂM TRA TẮT CAM (25S HOÀN TOÀN SẠCH LỖI PHẠT THẬT) ──
              // Chỉ cần KHÔNG dính lỗi phạt thật là được tích lũy giây học nghiêm túc
              if (!penaltyViolation) {
                observeWindowSecondsRef.current += 1;

                if (observeWindowSecondsRef.current >= OBSERVE_WINDOW_SECONDS) {
                  console.log(
                    "[useFocusSession] Đủ 25s học tập nghiêm túc. Tắt camera bảo vệ tài nguyên.",
                  );
                  await cameraApi.stop().catch(() => {});

                  isCameraStartedRef.current = false;
                  isScanningPeriodRef.current = false;
                  observeWindowSecondsRef.current = 0;
                  lastCameraOffAtRef.current = currentElapsed;

                  // Reset toàn bộ bậc thang phạt — đợt quét sau bắt đầu lại từ đầu
                  penaltyThresholdRef.current = 10;
                  penaltyCountInRowRef.current = 0;
                }
              }
            }
          } catch (err) {
            console.error("Lỗi xử lý luồng data Python:", err);
          }
        }
      }

      // ── BỘ ĐẾM 3: ĐẾM NGƯỢC TỰ ĐỘNG ĐÓNG POPUP SAU 60S ──
      if (isPromptActiveRef.current && promptStartedAtRef.current !== null) {
        const promptElapsed = Math.floor(
          (now - promptStartedAtRef.current) / 1000,
        );
        const remaining = PROMPT_DURATION_SECONDS - promptElapsed;

        if (remaining <= 0) {
          console.log(
            "[useFocusSession] Quá 1 phút không xác nhận. Tự đóng popup.",
          );
          isPromptActiveRef.current = false;
          setIsPromptActive(false);
          setPromptCountdown(PROMPT_DURATION_SECONDS);
          promptStartedAtRef.current = null;
          emit("tauri-break-prompt", { isOpen: false });
        } else {
          setPromptCountdown(remaining);
        }
      }
    }, 1000);

    return () => stopOrchestrator();
  }, [session?.id]);

  const stopOrchestrator = () => {
    if (mainIntervalRef.current) {
      clearInterval(mainIntervalRef.current);
      mainIntervalRef.current = null;
    }
    cameraApi.stop().catch(() => {});
    isCameraStartedRef.current = false;
    distractCounterRef.current = 0;
  };

  const handleEndSession = async (isAborted: boolean) => {
    const latestSession = sessionRef.current;
    if (!latestSession) return;
    if (isAborted && !window.confirm("Bạn có chắc muốn bỏ cuộc không?")) return;

    setIsEnding(true);
    stopOrchestrator();

    try {
      const res = await focusApi.endSession(latestSession.id, isAborted);
      syncSession(res);
      const mainWindow = (await import("@tauri-apps/api/webviewWindow"))
        .WebviewWindow;
      const main = await mainWindow.getByLabel("main");
      const widget = await mainWindow.getByLabel("widget");
      if (main && widget) {
        await main.show();
        await widget.hide();
      }
    } catch (err) {
      console.error("Lỗi khi kết thúc phiên học:", err);
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
  };

  const handleAcceptBreak = async () => {
    const latestSession = sessionRef.current;
    if (!latestSession) return;

    try {
      console.log("[useFocusSession] User chọn NGHỈ. Gọi API pause...");
      const updatedSession = await focusApi.pauseSession(latestSession.id);
      syncSession(updatedSession);

      breakStartedAtRef.current = Date.now();
      promptStartedAtRef.current = null;
      emit("tauri-break-prompt", { isOpen: false });

      initialBreakMinutesRef.current = updatedSession.accumulatedReward;

      isPromptActiveRef.current = false;
      setIsPromptActive(false);
      setPromptCountdown(PROMPT_DURATION_SECONDS);

      isBreakingRef.current = true;
      setIsBreaking(true);

      const seconds = updatedSession.accumulatedReward * 60;
      setBreakRemaining(seconds);
      breakRemainingRef.current = seconds;

      await cameraApi.stop().catch(() => {});
      isCameraStartedRef.current = false;
      distractCounterRef.current = 0;
    } catch (err) {
      console.error("Lỗi khi bắt đầu nghỉ giải lao:", err);
    }
  };

  const handleResumeSession = async () => {
    const latestSession = sessionRef.current;
    if (!latestSession) return;

    try {
      console.log(
        "[useFocusSession] Kết thúc nghỉ, quay lại học. Gọi API resume...",
      );

      if (breakStartedAtRef.current !== null) {
        const justBrokeSeconds = Math.floor(
          (Date.now() - breakStartedAtRef.current) / 1000,
        );
        totalBreakSecondsRef.current += justBrokeSeconds;
        breakSecondsSinceLastCycleRef.current += justBrokeSeconds;
        breakStartedAtRef.current = null;
      }

      const minutesRemaining = Math.round(breakRemainingRef.current / 60);
      const minutesUsed = Math.max(
        0,
        initialBreakMinutesRef.current - minutesRemaining,
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

      isCameraStartedRef.current = true;
      cameraApi.start().catch(() => {
        isCameraStartedRef.current = false;
      });
    } catch (err) {
      console.error("Lỗi khi quay lại phiên học:", err);
    }
  };

  return {
    elapsed,
    isEnding,
    handleEndSession,
    isPromptActive,
    setIsPromptActive,
    isBreaking,
    setIsBreaking,
    breakRemaining,
    setBreakRemaining,
    promptCountdown,
    handleRejectBreak,
    handleAcceptBreak,
    handleResumeSession,
  };
}
