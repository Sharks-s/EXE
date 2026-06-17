import { useEffect, useRef, useState } from "react";
import { useFocusStore } from "../stores/focusStore";
import { focusApi } from "../api/focus.api";
import { cameraApi } from "../api/cameraApi";

export function useFocusSession() {
  const { session, syncSession } = useFocusStore();
  const [elapsed, setElapsed] = useState<number>(0);
  const [isEnding, setIsEnding] = useState<boolean>(false);

  // Dùng Ref để lưu session mới nhất, tránh lỗi đóng băng dữ liệu (Stale Closure)
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const mainIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Các biến Ref phục vụ cho việc kiểm soát Cam và Sao nhãng
  const isCameraStartedRef = useRef<boolean>(false);
  const distractCounterRef = useRef<number>(0); // Bộ đếm số giây sao nhãng liên tục

  useEffect(() => {
    if (!sessionRef.current) {
      stopOrchestrator();
      return;
    }

    const startedAt = new Date(sessionRef.current.startedAt).getTime();

    // 🚀 DÙNG 1 INTERVAL DUY NHẤT ĐỂ QUẢN LÝ TẤT CẢ TIME (Đảm bảo chính xác từng giây)
    mainIntervalRef.current = setInterval(async () => {
      const now = Date.now();

      // 1. Cập nhật tổng thời gian học trôi qua (elapsed)
      const currentElapsed = Math.floor((now - startedAt) / 1000);
      setElapsed(currentElapsed);

      const latestSession = sessionRef.current;
      if (!latestSession) return;

      // ── BỘ ĐẾM 1: KIỂM TRA HIỆP 25 PHÚT ─────────────────────────────────
      const lastCycleAt = latestSession.lastCycleAt
        ? new Date(latestSession.lastCycleAt).getTime()
        : startedAt;
      const elapsedSecondsFromLastCycle = Math.floor(
        (now - lastCycleAt) / 1000,
      );

      if (elapsedSecondsFromLastCycle >= 25 * 60) {
        try {
          console.log("[useFocusSession] Đủ 25 phút! Gọi completeCycle...");
          const updatedSession = await focusApi.completeCycle(latestSession.id);
          syncSession(updatedSession);
        } catch (err) {
          console.error("Lỗi hoàn thành hiệp:", err);
        }
      }

      // Kịch bản phụ: Học hết tổng thời gian đăng ký thì kết thúc phiên luôn
      if (currentElapsed >= latestSession.plannedDuration * 60) {
        handleEndSession(false);
        return;
      }

      // ── BỘ ĐẾM 2: QUẢN LÝ CAMERA (MỞ SAU 3 PHÚT & CHECK SAO NHÃNG 10S) ──

      // A. Nếu chưa mở cam VÀ đã học được đủ 3 phút (180 giây) -> Tiến hành mở cam
      if (!isCameraStartedRef.current && currentElapsed >= 3 * 60) {
        console.log(
          "[useFocusSession] Đã học được 3 phút. Kích hoạt Camera...",
        );
        isCameraStartedRef.current = true;
        cameraApi.start().catch((err) => {
          console.error("Lỗi khởi động Cam Python:", err);
          isCameraStartedRef.current = false; // Reset lại nếu lỗi để thử lại sau
        });
      }

      // B. Nếu camera đã được kích hoạt -> Tiến hành Polling check sao nhãng
      if (isCameraStartedRef.current) {
        try {
          const camStatus = await cameraApi.getStatus();

          // Nếu Python báo người dùng mất tập trung (!all_pass)
          if (camStatus && !camStatus.all_pass) {
            distractCounterRef.current += 1; // Tăng bộ đếm sao nhãng lên 1 giây
            console.log(
              `[useFocusSession] Đang sao nhãng: ${distractCounterRef.current}s`,
            );

            // Nếu sao nhãng LIÊN TỤC đủ 10 giây -> Báo vi phạm lên Spring Boot
            if (distractCounterRef.current >= 10) {
              console.warn(
                "[useFocusSession] Sao nhãng liên tục 10s! Gửi vi phạm...",
              );
              distractCounterRef.current = 0; // Reset ngay bộ đếm sau khi phạt để tính lượt mới

              const updatedSession = await focusApi.handleViolation(
                latestSession.id,
                {
                  type: "LOOK_AWAY",
                  appName: "Camera Tracker",
                  windowTitle: "User Lost Focus",
                },
              );
              syncSession(updatedSession);
            }
          } else {
            // Nếu người dùng tập trung trở lại -> Reset bộ đếm về 0 ngay lập tức (Phải liên tục mới phạt)
            if (distractCounterRef.current > 0) {
              console.log(
                "[useFocusSession] Đã tập trung trở lại. Reset bộ đếm sao nhãng.",
              );
              distractCounterRef.current = 0;
            }
          }
        } catch (err) {
          console.error("Lỗi khi kết nối lấy status từ Python:", err);
        }
      }
    }, 1000); // Chạy nhịp đếm chuẩn 1 giây / lần

    return () => stopOrchestrator();
  }, [session?.id]);

  const stopOrchestrator = () => {
    if (mainIntervalRef.current) {
      clearInterval(mainIntervalRef.current);
      mainIntervalRef.current = null;
    }
    // Đảm bảo tắt hẳn camera phần cứng ở Python khi unmount
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

  return {
    elapsed,
    isEnding,
    handleEndSession,
  };
}
