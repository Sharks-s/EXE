import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDashboardForm } from "../hooks/useDashboardForm";
import { CameraSetupModal } from "../components/CameraSetupModal";
import { focusApi } from "../api/focus.api";
import { cameraApi } from "../api/cameraApi";
import { tauriStore } from "../../../lib/tauriStore";
import type { FocusSessionResponse } from "../types/focus.types";

export default function Dashboard() {
  const {
    PRESET_GOALS,
    ASSISTANTS,
    DURATIONS,
    selectedPreset,
    customGoal,
    duration,
    assistant,
    handleSelectPreset,
    handleChangeCustomGoal,
    handleSelectDuration,
    handleSelectAssistant,
    buildRequest,
    t,
  } = useDashboardForm();

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenCamera = () => {
    setError(null);
    setIsCameraOpen(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    let session: FocusSessionResponse | null = null;

    try {
      // 1. Tạo session trong DB
      session = await focusApi.createSession(buildRequest());

      // 2. Lưu session vào local store cho widget đọc
      await tauriStore.set("active_session", session);

      // 3. Tắt camera và hạ cờ mở Modal ngay lập tức khi thành công
      setIsCameraOpen(false);
      await cameraApi.stop().catch(() => {});

      // 4. Đợi 100ms nhường quyền cho React chạy xong hàm Cleanup (clearInterval)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 5. Chuyển sang widget an toàn
      await invoke("toggle_windows_to_session");
    } catch (err) {
      if (session?.sessionId) {
        await focusApi.endSession(session.sessionId).catch(() => {});
      }

      setError("Không thể tạo phiên. Vui lòng thử lại.");
      await cameraApi.stop().catch(() => {});
      setIsCameraOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFastTrackToWidget = async () => {
    try {
      // Gọi thẳng lệnh Rust để tính tọa độ góc phải và hoán đổi cửa sổ
      await invoke("toggle_windows_to_session");
    } catch (error) {
      console.error("Không thể mở nhanh Widget:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 select-none">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          {t("common:dashboard.title", {
            defaultValue: "Chào ngày mới, chuẩn bị tập trung nhé!",
          })}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t("common:dashboard.subtitle", {
            defaultValue:
              "Thiết lập nhanh mục tiêu của bạn để kích hoạt Trợ lý ảo.",
          })}
        </p>
        <button
          onClick={handleFastTrackToWidget}
          style={{
            background: "#10B981",
            color: "white",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Widget
        </button>
      </div>

      {/* FORM */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
        {/* BƯỚC 1: MỤC TIÊU */}
        <div className="space-y-3">
          <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider block">
            {t("common:dashboard.goal_label", {
              defaultValue: "1. Hôm nay bạn cần hoàn thành việc gì?",
            })}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {PRESET_GOALS.map((g) => {
              const isSelected = selectedPreset === g.key && !customGoal;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => handleSelectPreset(g.key)}
                  className={`p-3 rounded-xl text-xs sm:text-sm font-medium border text-center transition duration-200 ${
                    isSelected
                      ? "border-yellow-400 bg-yellow-50/40 text-yellow-600 font-semibold shadow-[0_0_12px_rgba(250,204,21,0.2)]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {t(g.labelKey)}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder={t("common:dashboard.goal_placeholder", {
              defaultValue: "Hoặc tự nhập mục tiêu cụ thể khác...",
            })}
            value={customGoal}
            onChange={(e) => handleChangeCustomGoal(e.target.value)}
            className="w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/30 focus:outline-none focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 transition duration-200"
          />
        </div>

        {/* BƯỚC 2 & 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider block">
              {t("common:dashboard.duration_label", {
                defaultValue: "2. Thời gian phiên",
              })}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {DURATIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectDuration(m)}
                  className={`flex-1 min-w-[60px] py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition duration-200 ${
                    duration === m
                      ? "bg-slate-800 text-white font-semibold shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {m}
                  {t("common:dashboard.duration_suffix", { defaultValue: "m" })}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider block">
              {t("common:dashboard.assistant_label", {
                defaultValue: "3. Lựa chọn Gu Trợ lý",
              })}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ASSISTANTS.map((ast) => (
                <button
                  key={ast.id}
                  type="button"
                  onClick={() => handleSelectAssistant(ast.id)}
                  className={`py-2 sm:py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold border transition duration-200 text-center tracking-wide ${
                    assistant === ast.id
                      ? "border-amber-500 bg-amber-50/60 text-amber-700 shadow-sm"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {t(ast.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ERROR */}
        <div className="min-h-[24px] text-center">
          {error && (
            <p className="text-xs sm:text-sm text-red-500 font-medium bg-red-50 border border-red-100 py-2 px-4 rounded-xl inline-block">
              {error}
            </p>
          )}
        </div>

        {/* SUBMIT */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleOpenCamera}
            className={`w-full py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0f172a] transition duration-300 shadow-md ${
              isSubmitting
                ? "bg-slate-200 text-slate-400 cursor-wait shadow-none"
                : "bg-[#9fd6fa] hover:bg-[#7bc3f7] hover:shadow-[0_0_20px_rgba(159,214,250,0.5)]"
            }`}
          >
            {isSubmitting
              ? t("common:dashboard.starting", {
                  defaultValue: "Đang khởi động...",
                })
              : t("common:dashboard.btn_start", {
                  defaultValue: "Bắt đầu phiên làm việc",
                })}
          </button>
        </div>
      </div>

      {/* CAMERA MODAL */}
      <CameraSetupModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
