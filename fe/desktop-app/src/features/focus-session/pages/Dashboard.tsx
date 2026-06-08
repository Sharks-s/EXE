import { useDashboardForm } from "../hooks/useDashboardForm";

export default function Dashboard() {
  const {
    PRESET_GOALS,
    ASSISTANTS,
    DURATIONS,
    selectedPreset,
    customGoal,
    duration,
    assistant,
    isLoading,
    displayGlobalError,
    handleSelectPreset,
    handleChangeCustomGoal,
    handleSelectDuration,
    handleSelectAssistant,
    onSubmit,
    t,
  } = useDashboardForm();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 select-none">
      {/* ── HEADER LỜI CHÀO ──────────────────────────────── */}
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
      </div>

      {/* ── BẢNG ĐIỀU KHIỂN CHÍNH ───────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
        {/* BƯỚC 1: LỰA CHỌN MỤC TIÊU */}
        <div className="space-y-3">
          <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider block">
            {t("common:dashboard.goal_label", {
              defaultValue: "1. Hôm nay bạn cần hoàn thành việc gì?",
            })}
          </label>

          {/* Grid Presets linh hoạt từ mobile lên desktop */}
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

          {/* Ô nhập tự do */}
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

        {/* ── CHIA CỘT RESPONSIVE CHO BƯỚC 2 & BƯỚC 3 ─────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BƯỚC 2: THỜI GIAN PHIÊN */}
          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider block">
              {t("common:dashboard.duration_label", {
                defaultValue: "2. Thời gian phiên",
              })}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {DURATIONS.map((m) => {
                const isSelected = duration === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectDuration(m)}
                    className={`flex-1 min-w-[60px] py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition duration-200 ${
                      isSelected
                        ? "bg-slate-800 text-white font-semibold shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {m}
                    {t("common:dashboard.duration_suffix", {
                      defaultValue: "m",
                    })}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BƯỚC 3: GU TRỢ LÝ AI */}
          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider block">
              {t("common:dashboard.assistant_label", {
                defaultValue: "3. Lựa chọn Gu Trợ lý",
              })}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ASSISTANTS.map((ast) => {
                const isSelected = assistant === ast.id;
                return (
                  <button
                    key={ast.id}
                    type="button"
                    onClick={() => handleSelectAssistant(ast.id)}
                    className={`py-2 sm:py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold border transition duration-200 text-center tracking-wide ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/60 text-amber-700 shadow-sm"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {t(ast.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── GLOBAL ERROR DISPLAY ───────────────────────── */}
        <div className="min-h-[24px] text-center">
          {displayGlobalError && (
            <p className="text-xs sm:text-sm text-red-500 font-medium bg-red-50 border border-red-100 py-2 px-4 rounded-xl inline-block">
              {displayGlobalError}
            </p>
          )}
        </div>

        {/* ── NÚT SUBMIT KÍCH HOẠT PHIÊN ──────────────────── */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={onSubmit}
            className={`w-full py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0f172a] transition duration-300 shadow-md ${
              isLoading
                ? "bg-slate-200 text-slate-400 cursor-wait shadow-none"
                : "bg-[#9fd6fa] hover:bg-[#7bc3f7] hover:shadow-[0_0_20px_rgba(159,214,250,0.5)]"
            }`}
          >
            {isLoading
              ? t("common:dashboard.starting", {
                  defaultValue: "Đang khởi động...",
                })
              : t("common:dashboard.btn_start", {
                  defaultValue: "Bắt đầu phiên làm việc",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
