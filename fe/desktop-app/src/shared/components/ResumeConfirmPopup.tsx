import type { FocusSessionResponse } from "../../features/focus-session/types/focus.types";

interface ResumeConfirmPopupProps {
  session: FocusSessionResponse;
  onContinue: () => void;
  onEnd: () => void;
  isProcessing?: boolean;
}

export function ResumeConfirmPopup({
  session,
  onContinue,
  onEnd,
  isProcessing = false,
}: ResumeConfirmPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          Tiếp tục phiên trước?
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Bạn có 1 phiên tập trung chưa kết thúc
          {session.goal ? ` cho mục tiêu "${session.goal}"` : ""}. Bạn muốn tiếp
          tục hay kết thúc phiên này?
        </p>
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
