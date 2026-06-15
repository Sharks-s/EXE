import { useEffect, useRef, useState } from "react";
import { useFocusStore } from "../stores/focusStore";
import { focusApi } from "../api/focus.api";
import { cameraApi } from "../api/cameraApi";

export function useFocusSession() {
  const { session, syncSession } = useFocusStore();
  const [elapsed, setElapsed] = useState<number>(0);
  const [isEnding, setIsEnding] = useState<boolean>(false);

  const orchestratorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const cameraPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    if (!session) {
      stopOrchestrator();
      return;
    }

    const startedAt = new Date(session.startedAt).getTime();

    // 🚀 LUỒNG 1: Bật camera quét ngầm tầng Python
    cameraApi
      .start()
      .catch((err) =>
        console.error("Không khởi động được Camera Python:", err),
      );

    // 🚀 LUỒNG 2: Nhịp đếm thời gian gốc (1 giây/lần)
    orchestratorIntervalRef.current = setInterval(async () => {
      const now = Date.now();
      const currentElapsed = Math.floor((now - startedAt) / 1000);
      setElapsed(currentElapsed);

      // Tính toán dựa trên mốc lastCycleAt của Session từ Store
      const lastCycleAt = session.lastCycleAt
        ? new Date(session.lastCycleAt).getTime()
        : startedAt;
      const elapsedSecondsFromLastCycle = Math.floor(
        (now - lastCycleAt) / 1000,
      );

      // Kịch bản A: Đủ 25 phút (1500 giây) -> Trigger hoàn thành hiệp lên Spring Boot
      if (elapsedSecondsFromLastCycle >= 25 * 60) {
        try {
          const updatedSession = await focusApi.completeCycle(session.id);
          syncSession(updatedSession);
        } catch (err) {
          console.error("Lỗi khi đồng bộ Cycle với Spring Boot:", err);
        }
      }

      // Kịch bản B: Học hết tổng thời gian đăng ký -> Tự động kết thúc thành công
      const plannedSeconds = session.plannedDuration * 60;
      if (currentElapsed >= plannedSeconds) {
        handleEndSession(false);
      }
    }, 1000);

    // 🚀 LUỒNG 3: Polling kiểm tra tín hiệu vi phạm từ Python (2 giây/lần)
    cameraPollIntervalRef.current = setInterval(async () => {
      try {
        const camStatus = await cameraApi.getStatus();

        if (camStatus && !camStatus.all_pass) {
          // FE đứng ra đại diện báo cáo vi phạm lên Spring Boot
          const updatedSession = await focusApi.handleViolation(session.id, {
            type: "LOOK_AWAY",
            appName: "Camera Tracker",
            windowTitle: "User Lost Focus",
          });
          syncSession(updatedSession);
        }
      } catch (err) {
        console.error("Lỗi khi quét tín hiệu vi phạm từ Python:", err);
      }
    }, 2000);

    return () => {
      stopOrchestrator();
    };
  }, [session?.id]);

  const stopOrchestrator = () => {
    if (orchestratorIntervalRef.current) {
      clearInterval(orchestratorIntervalRef.current);
      orchestratorIntervalRef.current = null;
    }
    if (cameraPollIntervalRef.current) {
      clearInterval(cameraPollIntervalRef.current);
      cameraPollIntervalRef.current = null;
    }
    cameraApi.stop().catch(() => {});
  };

  const handleEndSession = async (isAborted: boolean) => {
    if (!session) return;
    if (isAborted && !window.confirm("Bạn có chắc muốn bỏ cuộc không?")) return;

    setIsEnding(true);
    stopOrchestrator();

    try {
      const res = await focusApi.endSession(session.id, isAborted);
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
      console.error(err);
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
