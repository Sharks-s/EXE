import type { FocusSessionResponse } from "../../features/focus-session/types/focus.types";

interface ResumeConfirmPopupProps {
  session: FocusSessionResponse;
  onContinue: () => void;
  onEnd: () => void;
  isProcessing?: boolean;
}

const formatMinutesSeconds = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m} phút${s > 0 ? ` ${s} giây` : ""}`;
};

export function ResumeConfirmPopup({
  session,
  onContinue,
  onEnd,
  isProcessing = false,
}: ResumeConfirmPopupProps) {
  const elapsedSeconds = session.currentElapsedSeconds ?? 0;
  const plannedSeconds = session.plannedDuration * 60;
  const remainingSeconds = Math.max(plannedSeconds - elapsedSeconds, 0);
  const isOvertime = elapsedSeconds >= plannedSeconds;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Tiếp tục phiên trước?
        </h2>
        <p className="text-sm text-slate-500 mb-3">
          Bạn có 1 phiên tập trung chưa kết thúc
          {session.goal ? ` cho mục tiêu "${session.goal}"` : ""}.
        </p>

        <div className="bg-slate-50 rounded-xl p-3 mb-5 text-sm">
          <p className="text-slate-700">
            Đã học: <strong>{formatMinutesSeconds(elapsedSeconds)}</strong>
          </p>
          {isOvertime ? (
            <p className="text-amber-600 mt-1">
              Đã vượt quá thời gian dự kiến ({session.plannedDuration} phút) — phiên sẽ tự động kết thúc nếu bạn chọn tiếp tục.
            </p>
          ) : (
            <p className="text-slate-500 mt-1">
              Còn lại: {formatMinutesSeconds(remainingSeconds)}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEnd}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium text-sm disabled:opacity-50"
          >
            Kết thúc
          </button>
          <button
            onClick={onContinue}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50"
          >
            {isProcessing ? "Đang xử lý..." : "Tiếp tục"}
          </button>
        </div>
      </div>
    </div>
  );
}