import React, { useState, useEffect } from "react";
import { useCameraSetup } from "../hooks/useCameraSetup";
import { CheckItem } from "./CheckItemProps";

interface CameraSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CameraSetupModal: React.FC<CameraSetupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="w-[500px] rounded-2xl bg-[#1e1e1e] p-6 text-white shadow-2xl border border-zinc-800 flex flex-col items-center">
        <h3 className="text-xl font-bold tracking-wide text-zinc-100 mb-5 text-center w-full">
          Căn chỉnh khoảng cách & góc mặt
        </h3>

        {/* Video stream */}
        <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-zinc-700 bg-zinc-950 flex items-center justify-center shadow-inner">
          {isLoading ? (
            <span className="text-xs text-zinc-400 animate-pulse">
              Đang khởi động camera...
            </span>
          ) : activeError ? (
            <div className="text-red-400 text-xs px-6 text-center space-y-1">
              <p className="font-bold">⚠️ Lỗi luồng video</p>
              <p className="text-zinc-500 text-[11px]">{activeError}</p>
            </div>
          ) : (
            <img
              src={streamUrl}
              className="w-full h-full object-cover pointer-events-none select-none"
              alt="Live Stream"
              onError={() =>
                setStreamError(
                  "Luồng stream từ Bot bị gián đoạn hoặc thiết bị bận.",
                )
              }
            />
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 w-full mt-6">
          <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/80 text-center">
            <div className="text-[10px] tracking-wider text-zinc-400 font-bold mb-1">
              GÓC MẶT
            </div>
            <div className="font-mono text-xs text-zinc-500 space-y-0.5">
              <div>
                Ngẩng (Pitch):{" "}
                <span
                  className={
                    checks?.face_centered
                      ? "text-green-400 font-bold"
                      : "text-red-400"
                  }
                >
                  {pitch}°
                </span>
              </div>
              <div>
                Quay (Yaw):{" "}
                <span
                  className={
                    checks?.face_centered
                      ? "text-green-400 font-bold"
                      : "text-red-400"
                  }
                >
                  {yaw}°
                </span>
              </div>
            </div>
            <div
              className={`text-[11px] font-semibold mt-2 inline-block px-2 py-0.5 rounded-full ${
                checks?.face_centered && face_detected
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {face_detected
                ? checks?.face_centered
                  ? "Góc mặt hợp lệ"
                  : "Mặt bị lệch góc"
                : "Không tìm thấy khuôn mặt"}
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/80 text-center flex flex-col justify-between">
            <div>
              <div className="text-[10px] tracking-wider text-zinc-400 font-bold mb-1">
                KHOẢNG CÁCH
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {checks?.close_enough
                  ? "Vị trí chuẩn xác"
                  : "Cần điều chỉnh lại ghế ngồi"}
              </p>
            </div>
            <div
              className={`text-[11px] font-semibold mt-2 inline-block px-2 py-0.5 rounded-full ${
                checks?.close_enough
                  ? "bg-green-500/10 text-green-400"
                  : "bg-yellow-500/10 text-yellow-500"
              }`}
            >
              {checks?.close_enough ? "Đạt yêu cầu" : "Chưa đạt"}
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="w-full space-y-1 mt-4 bg-zinc-950/80 p-4 rounded-xl border border-zinc-900">
          <CheckItem
            label="Khuôn mặt ở chính giữa khung hình"
            isDone={!!checks?.face_centered}
            hint="Nhìn thẳng vào tâm camera, không nghiêng trái/phải hoặc cúi gầm."
          />
          <CheckItem
            label="Đã ngồi lùi ra xa đạt khoảng cách tối ưu"
            isDone={!!checks?.close_enough}
            hint="Đẩy ghế lùi ra sau một chút, đảm bảo không quá sát màn hình."
          />
          <CheckItem
            label="Ánh sáng phòng đảm bảo rõ nét"
            isDone={!!checks?.lighting_ok}
            hint="Bật thêm đèn hoặc tránh nguồn sáng chói rọi ngược từ sau lưng."
          />
          <CheckItem
            label="Phần vai hiển thị đầy đủ trong camera"
            isDone={!!checks?.shoulders_visible}
            hint="Ngồi thẳng lưng để camera bắt được trọn vẹn cả hai bên vai."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition font-semibold text-zinc-300 text-sm"
          >
            Hủy và tắt cam
          </button>
          <button
            disabled={!canProceed}
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
              canProceed
                ? "bg-green-500 text-black hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)] cursor-pointer"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Sẵn sàng, bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
};
