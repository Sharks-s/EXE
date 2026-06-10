import React, { useState, useEffect } from "react";
import { useCameraSetup } from "../hooks/useCameraSetup";
import { CheckItem } from "./CheckItemProps";

interface CameraSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export const CameraSetupModal: React.FC<CameraSetupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}) => {
  const {
    status,
    error: hookError,
    isLoading,
    canProceed,
    streamUrl,
  } = useCameraSetup(isOpen);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setStreamError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const { pitch = 0, yaw = 0, face_detected = false, checks } = status || {};
  const activeError = hookError || streamError;

  const passedCount = checks ? Object.values(checks).filter(Boolean).length : 0;

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
          {/* Video stream — rectangle thay vì circle, gọn hơn */}
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

          {/* Checklist */}
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

        {/* Footer — sticky để luôn thấy nút bấm */}
        <div className="sticky bottom-0 px-4 py-3 bg-[#1e1e1e] border-t border-zinc-800">
          <button
            disabled={!canProceed || isSubmitting}
            onClick={onConfirm}
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
                Đang khởi động...
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
