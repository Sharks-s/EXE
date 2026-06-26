import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useCameraSetup } from "../hooks/useCameraSetup";
import { useFocusStore } from "../stores/focusStore";
import { focusApi } from "../api/focus.api";
import { cameraApi } from "../api/cameraApi";
import { tauriStore } from "../../../lib/tauriStore";
import { CheckItem } from "./CheckItemProps";

interface CameraSetupModalProps {
  goal: string;
  durationMinutes: number;
  onClose: () => void;
}

export const CameraSetupModal: React.FC<CameraSetupModalProps> = ({
  goal,
  durationMinutes,
  onClose,
}) => {
  // Vì SetupView render cưỡng bức bằng toán tử &&, nên mặc định mở ra là isOpen = true
  const {
    status,
    error: hookError,
    isLoading,
    canProceed,
    streamUrl,
  } = useCameraSetup(true);

  const [streamError, setStreamError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setStreamError(null);
    setSubmitError(null);
  }, []);

  const { pitch = 0, yaw = 0, face_detected = false, checks } = status || {};
  const activeError = hookError || streamError || submitError;
  const passedCount = checks ? Object.values(checks).filter(Boolean).length : 0;

  // ── LUỒNG XỬ LÝ KÍCH HOẠT CHUẨN: PYTHON TRƯỚC -> BACKEND SAU ──
  const handleStartFocus = async () => {
    if (!canProceed) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const { emit } = await import("@tauri-apps/api/event");

    try {
      // BƯỚC 1: Gọi thẳng API Backend tạo Session
      const newSession = await focusApi.createSession({
        goal: goal,
        durationMinutes: durationMinutes,
      });

      // BƯỚC 2: Lưu Session vào Store
      await useFocusStore.getState().initializeSessionConfig(newSession);
      await tauriStore.set("active_session", newSession);

      // BƯỚC 2.5: Báo cho Widget biết pet nào đang active
      const { currentPet } = useFocusStore.getState();
      console.log("[CameraSetupModal] currentPet before emit:", currentPet);
      if (currentPet) {
        const { emit } = await import("@tauri-apps/api/event");
        await emit("widget-pet-update", {
          petCode: currentPet.code,
        });
      }

      // BƯỚC 3: Đóng modal an toàn trước.
      // Khi onClose() chạy -> isOpen thành false -> Hook tự dọn dẹp, tự tắt cam ngầm chuẩn chỉ!
      onClose();

      // Chờ nhẹ 100ms cho luồng tắt cam của Hook thực thi êm xuôi
      await new Promise((r) => setTimeout(r, 100));

      // BƯỚC 4: Gọi Rust Tauri hoán đổi sang cửa sổ Widget
      await invoke("toggle_windows_to_session");

      // BƯỚC 5: Báo cho Bubble biết Widget đang active — để bubble được phép hiện
      const { emit } = await import("@tauri-apps/api/event");
      await emit("widget-active-state", { active: true });
    } catch (err: any) {
      console.error("[Start Focus Error]:", err);
      setSubmitError(err.message || "Không thể tạo phiên làm việc.");

      // Nếu lỗi tạo phiên (Modal không đóng), lúc này mới cần chủ động tắt cam để giải phóng thiết bị
      await cameraApi.stop().catch(() => {});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1e1e1e] text-white shadow-2xl border border-zinc-800">
        {/* Header — luôn cố định, có nút back rõ ràng */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#1e1e1e] border-b border-zinc-800">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition disabled:opacity-50"
          >
            <i
              className="ti ti-arrow-left"
              style={{ fontSize: 16 }}
              aria-hidden="true"
            />
            Quay lại
          </button>
          <h3 className="text-sm font-medium text-zinc-100">
            Căn chỉnh camera
          </h3>
          <span className="text-xs text-zinc-500 w-[60px] text-right">
            {passedCount}/4
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Video stream hiển thị */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center">
            {isLoading ? (
              <span className="text-xs text-zinc-400 animate-pulse">
                Đang khởi động camera...
              </span>
            ) : activeError ? (
              <div className="text-red-400 text-xs px-6 text-center space-y-1">
                <i
                  className="ti ti-camera-off"
                  style={{ fontSize: 24 }}
                  aria-hidden="true"
                />
                <p className="text-zinc-500 text-[11px]">{activeError}</p>
              </div>
            ) : (
              <img
                src={streamUrl}
                className="w-full h-full object-cover"
                alt="Live camera stream"
                onError={() =>
                  setStreamError(
                    "Luồng stream từ Bot bị gián đoạn hoặc thiết bị bận.",
                  )
                }
              />
            )}

            {/* Pitch/Yaw overlay nhỏ gọn trên video */}
            {!isLoading && !activeError && face_detected && (
              <div className="absolute bottom-2 left-2 flex gap-1.5">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 ${checks?.face_centered ? "text-green-400" : "text-amber-400"}`}
                >
                  P {pitch}°
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 ${checks?.face_centered ? "text-green-400" : "text-amber-400"}`}
                >
                  Y {yaw}°
                </span>
              </div>
            )}

            {!isLoading && !activeError && !face_detected && (
              <div className="absolute bottom-2 left-2">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-red-400">
                  Không tìm thấy khuôn mặt
                </span>
              </div>
            )}
          </div>

          {/* Checklist điều kiện */}
          <div className="space-y-1">
            <CheckItem
              label="Khuôn mặt ở chính giữa khung hình"
              isDone={!!checks?.face_centered}
              hint="Nhìn thẳng vào tâm camera, không nghiêng hoặc cúi gầm."
            />
            <CheckItem
              label="Khoảng cách phù hợp"
              isDone={!!checks?.close_enough}
              hint="Ngồi lùi ra xa hơn một chút, không quá sát màn hình."
            />
            <CheckItem
              label="Ánh sáng đủ rõ"
              isDone={!!checks?.lighting_ok}
              hint="Bật thêm đèn hoặc tránh ánh sáng chói từ phía sau."
            />
            <CheckItem
              label="Vai hiển thị đầy đủ"
              isDone={!!checks?.shoulders_visible}
              hint="Ngồi thẳng lưng để camera bắt được cả hai vai."
            />
          </div>
        </div>

        {/* Footer chứa nút bấm hành động */}
        <div className="sticky bottom-0 px-4 py-3 bg-[#1e1e1e] border-t border-zinc-800">
          <button
            disabled={!canProceed || isSubmitting}
            onClick={handleStartFocus}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              canProceed && !isSubmitting
                ? "bg-green-500 text-black hover:bg-green-400 cursor-pointer"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <i
                  className="ti ti-loader-2 animate-spin"
                  style={{ fontSize: 16 }}
                  aria-hidden="true"
                />
                Đang khởi động phiên...
              </>
            ) : canProceed ? (
              "Sẵn sàng, bắt đầu"
            ) : (
              "Hoàn thành các bước trên"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
