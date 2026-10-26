import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useCameraSetup } from "../hooks/useCameraSetup";
import { useFocusStore } from "../stores/focusStore";
import { cameraApi } from "../api/cameraApi";
import { isDailyLimitExceededError } from "@/utils/api-error-code";
import { startFocusSessionService } from "../services/focus.service";
import { settingsApi } from "@/features/settings";

import { CheckItem } from "./CheckItemProps";
import type { FocusMode } from "../types/focus.types";

interface CameraSetupModalProps {
  goal: string;
  durationMinutes: number;
  focusMode: FocusMode;
  onClose: () => void;
}

export const CameraSetupModal: React.FC<CameraSetupModalProps> = ({
  goal,
  durationMinutes,
  focusMode,
  onClose,
}) => {
  const { t } = useTranslation("common");
  const [hasCameraConsent, setHasCameraConsent] = useState(false);

  // Vì SetupView render cưỡng bức bằng toán tử &&, nên mặc định mở ra là isOpen = true
  const {
    status,
    error: hookError,
    isLoading,
    canProceed,
    streamUrl,
    // Camera selection
    devices,
    selectedDeviceIndex,
    isLoadingDevices,
    hasNoDevices,
    changeDevice,
  } = useCameraSetup(hasCameraConsent);

  const [streamError, setStreamError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setStreamError(null);
    setSubmitError(null);
  }, []);

  useEffect(() => {
    setStreamError(null);
  }, [selectedDeviceIndex]);

  useEffect(() => {
    document.body.classList.add("camera-modal-open");
    return () => {
      document.body.classList.remove("camera-modal-open");
    };
  }, []);

  const { pitch = 0, yaw = 0, face_detected = false, checks } = status || {};
  const activeError = hasNoDevices
    ? t("focusSession.cameraSetup.no_devices")
    : hookError || streamError || submitError;
  const passedCount = checks ? Object.values(checks).filter(Boolean).length : 0;

  // ── LUỒNG XỬ LÝ KÍCH HOẠT CHUẨN: PYTHON TRƯỚC -> BACKEND SAU ──
  const handleStartFocus = async (withoutCamera = false) => {
    if (!withoutCamera && !canProceed) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (withoutCamera) {
        await settingsApi.updateCameraEnabled(false).catch(() => undefined);
      }
      await startFocusSessionService({
        goal: goal,
        durationMinutes: durationMinutes,
        focusMode,
      }, async () => {
        onClose();
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
    } catch (err: any) {
      console.error("[Start Focus Error]:", err);
      if (isDailyLimitExceededError(err)) {
        useFocusStore.getState().showUpgradeNudge();
        setSubmitError(t("focusSession.cameraSetup.daily_limit_error"));
      } else {
        setSubmitError(err.message || t("focusSession.cameraSetup.start_error"));
      }

      // Nếu lỗi tạo phiên (Modal không đóng), lúc này mới cần chủ động tắt cam để giải phóng thiết bị
      await cameraApi.stop().catch(() => { });
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1e1e1e] text-white shadow-2xl border border-zinc-800">
        {/* Header — luôn cố định, có nút back rõ ràng */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#1e1e1e] border-b border-zinc-800">
          <button
            data-tutorial="camera-back"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition disabled:opacity-50"
          >
            <i
              className="ti ti-arrow-left"
              style={{ fontSize: 16 }}
              aria-hidden="true"
            />
            {t("focusSession.cameraSetup.back")}
          </button>
          <h3 className="text-sm font-medium text-zinc-100">
            {t(hasCameraConsent
              ? "focusSession.cameraSetup.title"
              : "focusSession.cameraSetup.permission_title")}
          </h3>
          <span className="text-xs text-zinc-500 w-[60px] text-right">
            {hasCameraConsent ? `${passedCount}/4` : ""}
          </span>
        </div>

        {!hasCameraConsent ? (
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-500/15 text-blue-400">
              <span className="material-symbols-outlined text-3xl">photo_camera</span>
            </div>
            <div className="space-y-2" data-tutorial="camera-permission">
              <h4 className="text-base font-semibold text-zinc-100">
                {t("focusSession.cameraSetup.permission_heading")}
              </h4>
              <p className="text-sm leading-6 text-zinc-400">
                {t("focusSession.cameraSetup.permission_desc")}
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-left text-xs leading-5 text-zinc-400">
              <span className="material-symbols-outlined mt-0.5 text-base text-green-400">shield</span>
              <span>{t("focusSession.cameraSetup.permission_privacy")}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
          {/* Camera device selector */}
          {devices.length > 0 && (
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                <i
                  className="ti ti-camera"
                  style={{ fontSize: 16 }}
                  aria-hidden="true"
                />
                {t("focusSession.cameraSetup.select_camera")}
              </span>
              <select
                value={selectedDeviceIndex}
                onChange={(e) => changeDevice(Number(e.target.value))}
                disabled={isLoadingDevices || isSubmitting}
                className="w-full text-xs bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-green-500 transition-colors disabled:opacity-50 cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: "28px",
                }}
              >
                {devices.map((device) => (
                  <option key={device.index} value={device.index}>
                    {device.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {isLoadingDevices && (
            <p className="text-center text-xs text-zinc-400 animate-pulse">
              {t("focusSession.cameraSetup.loading_devices")}
            </p>
          )}

          {/* Video stream hiển thị */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center">
            {isLoadingDevices || isLoading || (!status && !activeError) ? (
              <span className="text-xs text-zinc-400 animate-pulse">
                {t("focusSession.cameraSetup.starting_camera")}
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
                key={selectedDeviceIndex}
                src={`${streamUrl}?device=${selectedDeviceIndex}`}
                className="w-full h-full object-cover"
                alt="Live camera stream"
                onError={() =>
                  setStreamError(t("focusSession.cameraSetup.stream_error"))
                }
              />
            )}

            {/* Pitch/Yaw overlay nhỏ gọn trên video */}
            {!isLoading && !activeError && face_detected && (
              <div className="absolute bottom-2 left-2 flex gap-1.5">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 ${checks?.face_centered ? "text-green-400" : "text-amber-400"
                    }`}
                >
                  P {pitch}°
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 ${checks?.face_centered ? "text-green-400" : "text-amber-400"
                    }`}
                >
                  Y {yaw}°
                </span>
              </div>
            )}

            {!isLoading && !activeError && !face_detected && (
              <div className="absolute bottom-2 left-2">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-red-400">
                  {t("focusSession.cameraSetup.no_face")}
                </span>
              </div>
            )}
          </div>

          {/* Checklist điều kiện */}
          <div className="space-y-1">
            <CheckItem
              label={t("focusSession.cameraSetup.check_face_centered")}
              isDone={!!checks?.face_centered}
              hint={t("focusSession.cameraSetup.hint_face_centered")}
            />
            <CheckItem
              label={t("focusSession.cameraSetup.check_distance")}
              isDone={!!checks?.close_enough}
              hint={t("focusSession.cameraSetup.hint_distance")}
            />
            <CheckItem
              label={t("focusSession.cameraSetup.check_lighting")}
              isDone={!!checks?.lighting_ok}
              hint={t("focusSession.cameraSetup.hint_lighting")}
            />
            <CheckItem
              label={t("focusSession.cameraSetup.check_shoulders")}
              isDone={!!checks?.shoulders_visible}
              hint={t("focusSession.cameraSetup.hint_shoulders")}
            />
          </div>
          </div>
        )}

        {/* Footer chứa nút bấm hành động */}
        <div className="sticky bottom-0 px-4 py-3 bg-[#1e1e1e] border-t border-zinc-800">
          {!hasCameraConsent ? (
            <div className="space-y-2">
              <button
                type="button"
                data-tutorial-choice="with-camera"
                disabled={isSubmitting}
                onClick={() => setHasCameraConsent(true)}
                className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-400 transition disabled:opacity-50"
              >
                {t("focusSession.cameraSetup.allow_camera")}
              </button>
              <button
                type="button"
                data-tutorial-choice="without-camera"
                disabled={isSubmitting}
                onClick={() => handleStartFocus(true)}
                className="w-full py-2.5 rounded-xl text-zinc-400 text-sm hover:bg-zinc-800 hover:text-zinc-200 transition disabled:opacity-50"
              >
                {isSubmitting
                  ? t("focusSession.cameraSetup.starting_session")
                  : t("focusSession.cameraSetup.continue_without_camera")}
              </button>
            </div>
          ) : (
            <button
              data-tutorial="camera-ready"
              disabled={!canProceed || isSubmitting}
              onClick={() => handleStartFocus(false)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${canProceed && !isSubmitting
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
                  {t("focusSession.cameraSetup.starting_session")}
                </>
              ) : canProceed ? (
                t("focusSession.cameraSetup.ready_button")
              ) : (
                t("focusSession.cameraSetup.incomplete_button")
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
