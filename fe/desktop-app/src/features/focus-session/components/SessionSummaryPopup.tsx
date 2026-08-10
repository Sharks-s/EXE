import type { FocusSessionResponse } from "../types/focus.types";

interface SessionSummaryPopupProps {
    session: FocusSessionResponse;
    onClose: () => void;
}

const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} phút`;
    return `${h} giờ ${m} phút`;
};

export function SessionSummaryPopup({ session, onClose }: SessionSummaryPopupProps) {
    const isAborted = session.status === "ABORTED";
    const xpGained = session.accumulatedReward * 60;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
                <div className="flex">
                    {/* KHUNG TRÁI — thông tin chi tiết */}
                    <div className="flex-[3] p-6 space-y-3">
                        <h2 className="text-xl font-bold text-slate-900">
                            {isAborted ? "Đã kết thúc sớm" : "Hoàn thành phiên tập trung! 🎉"}
                        </h2>
                        {isAborted && (
                            <p className="text-xs text-red-500">
                                Phiên bị kết thúc trước thời hạn, phần thưởng đã bị giảm 50%.
                            </p>
                        )}

                        <div className="space-y-2 text-sm text-slate-700 pt-2">
                            <p>Mục tiêu: {session.goal || "Không có mục tiêu cụ thể"}</p>
                            <p>Thời gian dự kiến: {formatMinutes(session.plannedDuration)}</p>
                            <p>
                                Thời gian học thực tế:{" "}
                                {session.actualDuration !== null
                                    ? formatMinutes(session.actualDuration)
                                    : "—"}
                            </p>
                            <p>Số lần nghỉ: {session.breakCount ?? 0}</p>
                            <p>Số lỗi vi phạm: {session.violations?.length ?? 0}</p>

                            {session.violations && session.violations.length > 0 && (
                                <div className="pt-2">
                                    <p className="font-medium text-slate-800 mb-1">Chi tiết vi phạm:</p>
                                    <ul className="space-y-1 max-h-32 overflow-y-auto pr-2">
                                        {session.violations.map((v, idx) => (
                                            <li key={idx} className="text-xs text-slate-500">
                                                • {v.type} — {new Date(v.occurredAt).toLocaleTimeString("vi-VN")}
                                                {v.appName ? ` (${v.appName})` : ""}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KHUNG PHẢI — pet + XP */}
                    <div className="flex-[2] bg-slate-50 p-6 flex flex-col items-center justify-center gap-3 border-l border-slate-200">
                        <img
                            src="/pet/MONKI/khiworking/bot_0.png"
                            alt="Pet"
                            className="w-24 h-24 object-contain"
                        />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-500">+{xpGained} XP</p>
                            <p className="text-xs text-slate-400">
                                ({session.accumulatedReward} phút × 60)
                            </p>
                        </div>
                    </div>
                </div>

                {/* FOOTER — nút hành động */}
                <div className="px-6 py-4 border-t border-slate-200 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-10 py-3 rounded-xl bg-[#9fd6fa] text-[#0f172a] font-semibold text-sm hover:bg-[#7bc3f7] transition"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        </div>
    );
}