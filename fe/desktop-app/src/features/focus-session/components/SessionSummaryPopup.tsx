import { useTranslation } from "react-i18next";
import type {
    FocusSessionCompleteResult,
    FocusSessionResponse,
} from "../types/focus.types";
import { useFocusStore } from "../stores/focusStore";
import "./SessionSummaryPopup.css";

interface SessionSummaryPopupProps {
    session: FocusSessionResponse;
    completionResult?: FocusSessionCompleteResult | null;
    onClose: () => void;
}

const formatMinutes = (minutes: number) => {
    return `${Math.max(Math.round(minutes), 0)} phút`;
};

export function SessionSummaryPopup({
    session,
    completionResult,
    onClose,
}: SessionSummaryPopupProps) {
    const { t } = useTranslation("common");
    const { currentPet } = useFocusStore();
    const isAborted = session.status === "ABORTED";
    const sessionEarnedPoints =
        completionResult?.earnedPoints ?? session.accumulatedReward * 60;
    const achievementPoints =
        completionResult?.unlockedAchievements.reduce(
            (total, achievement) => total + achievement.rewardPoints,
            0,
        ) ?? 0;
    const totalEarnedPoints = sessionEarnedPoints + achievementPoints;
    const actualMinutes = session.actualDuration ?? 0;
    const completionRate = Math.min(
        Math.round((actualMinutes / Math.max(session.plannedDuration, 1)) * 100),
        100,
    );
    const violationCount = session.violations?.length ?? 0;

    const summaryStats = [
        {
            icon: "schedule",
            label: t("focusSession.summary.planned_label"),
            value: formatMinutes(session.plannedDuration),
        },
        {
            icon: "timer",
            label: t("focusSession.summary.actual_label"),
            value: session.actualDuration !== null ? formatMinutes(session.actualDuration) : "-",
        },
        {
            icon: "coffee",
            label: t("focusSession.summary.break_count_label"),
            value: `${session.breakCount ?? 0}`,
        },
        {
            icon: violationCount > 0 ? "warning" : "verified",
            label: t("focusSession.summary.violation_count_label"),
            value: `${violationCount}`,
        },
    ];

    const getViolationLabel = (type: string) =>
        t(`focusSession.activeView.violation_${type.toLowerCase()}`, {
            defaultValue: type.replace(/_/g, " "),
        });

    return (
        <div className="session-summary-overlay fixed inset-0 z-50 flex items-center justify-center bg-[#1a1b25]/65 backdrop-blur-md">
            <div className="session-summary-modal relative w-full overflow-hidden border border-white/70 bg-white shadow-[0_28px_80px_rgba(26,27,37,0.24)]">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={t("focusSession.summary.back_button")}
                    className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/75 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>

                <div className="session-summary-layout grid gap-0 md:grid-cols-[1.45fr_0.95fr]">
                    <section className="session-summary-main relative overflow-hidden bg-[linear-gradient(135deg,#f7f5ff_0%,#ffffff_48%,#fff7ed_100%)] p-6 sm:p-8">
                        <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-[#483bfc]/10 blur-2xl" />
                        <div className="absolute bottom-8 right-10 h-24 w-24 rounded-full bg-amber-300/25 blur-2xl" />

                        <div className="relative">
                            <div className="session-summary-badge mb-5 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-bold text-[#483bfc] shadow-sm">
                                <span className="material-symbols-outlined text-[17px]">
                                    {isAborted ? "flag" : "celebration"}
                                </span>
                                {isAborted ? "Session ended" : "Session complete"}
                            </div>

                            <h2 className="session-summary-title max-w-xl text-2xl font-extrabold leading-tight text-slate-950 sm:text-3xl">
                                {isAborted
                                    ? t("focusSession.summary.title_aborted")
                                    : t("focusSession.summary.title_completed")}
                            </h2>

                            {isAborted && (
                                <p className="session-summary-note mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-600">
                                    {t("focusSession.summary.aborted_note")}
                                </p>
                            )}

                            <div className="session-summary-goal mt-6 rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-sm">
                                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                                    {t("focusSession.summary.goal_label")}
                                </p>
                                <p className="line-clamp-2 text-base font-bold leading-6 text-slate-900">
                                    {session.goal || t("focusSession.summary.no_goal")}
                                </p>
                            </div>

                            <div className="session-summary-stats mt-4 grid grid-cols-2 gap-3">
                                {summaryStats.map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="session-summary-stat rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm"
                                    >
                                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#483bfc]/10 text-[#483bfc]">
                                            <span className="material-symbols-outlined text-[20px]">
                                                {stat.icon}
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-bold leading-4 text-slate-500">
                                            {stat.label}
                                        </p>
                                        <strong className="mt-1 block text-lg font-extrabold text-slate-950">
                                            {stat.value}
                                        </strong>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="session-summary-back session-summary-back-left"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    arrow_back
                                </span>
                                {t("focusSession.summary.back_button")}
                            </button>
                        </div>
                    </section>

                    <aside className="session-summary-side flex flex-col gap-4 border-t border-slate-200 bg-[#fcfbff] p-6 sm:p-8 md:border-l md:border-t-0">
                        <div className="session-summary-side-scroll">
                            <div className="session-summary-xp text-center">
                                <div className="session-summary-pet mx-auto mb-3 flex h-32 w-32 items-center justify-center rounded-[24px] bg-white shadow-[inset_0_0_0_1px_rgba(199,196,218,0.45),0_16px_36px_rgba(72,59,252,0.12)]">
                                    <img
                                        src={`/pet/${currentPet?.code || 'MONKI'}/working/bot_0.png`}
                                        alt=""
                                        className="session-summary-pet-img h-24 w-24 object-contain drop-shadow-md"
                                    />
                                </div>
                                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                                    Focus Points
                                </p>
                                <p className="mt-1 text-4xl font-black text-emerald-500">
                                    +{totalEarnedPoints}
                                </p>
                                <p className="text-xs font-semibold text-slate-400">
                                    {completionResult
                                        ? t("focusSession.summary.current_points", {
                                            points: completionResult.currentPoints,
                                        })
                                        : "Points"}
                                </p>
                            </div>

                            {completionResult && (
                                <div className="session-summary-rewards rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                                    <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-700">
                                        <span className="material-symbols-outlined text-[18px]">
                                            verified
                                        </span>
                                        {t("focusSession.summary.rewards_title")}
                                    </p>
                                    <div className="session-summary-point-breakdown">
                                        <div>
                                            <span>Điểm phiên học</span>
                                            <strong>+{sessionEarnedPoints}</strong>
                                        </div>
                                        {achievementPoints > 0 && (
                                            <div>
                                                <span>Điểm thành tựu</span>
                                                <strong>+{achievementPoints}</strong>
                                            </div>
                                        )}
                                    </div>
                                    <div className="session-summary-reward-line">
                                        <span>{t("focusSession.summary.streak_label")}</span>
                                        <strong>
                                            {completionResult.streak.current}
                                            {completionResult.streak.isNewMilestone
                                                ? ` ${t("focusSession.summary.streak_milestone")}`
                                                : ""}
                                        </strong>
                                    </div>
                                    {completionResult.unlockedAchievements.length > 0 && (
                                        <div className="session-summary-achievements">
                                            {completionResult.unlockedAchievements.map((achievement) => (
                                                <div
                                                    key={achievement.code}
                                                    className="session-summary-achievement"
                                                >
                                                    <span className="material-symbols-outlined">
                                                        emoji_events
                                                    </span>
                                                    <div>
                                                        <strong>{achievement.name}</strong>
                                                        <small>+{achievement.rewardPoints}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="session-summary-progress rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500">Progress</span>
                                    <strong className="text-sm font-extrabold text-[#483bfc]">
                                        {completionRate}%
                                    </strong>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className={`h-full rounded-full ${isAborted ? "bg-amber-400" : "bg-emerald-400"}`}
                                        style={{ width: `${completionRate}%` }}
                                    />
                                </div>
                                <p className="mt-3 text-center text-xs font-semibold text-slate-400">
                                    {t("focusSession.summary.xp_formula", {
                                        minutes: session.accumulatedReward,
                                    })}
                                </p>
                            </div>

                            {session.violations && session.violations.length > 0 && (
                                <div className="session-summary-violations rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                                    <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-amber-700">
                                        <span className="material-symbols-outlined text-[18px]">
                                            report
                                        </span>
                                        {t("focusSession.summary.violation_detail_title")}
                                    </p>
                                    <ul className="session-summary-violation-list space-y-2 overflow-y-auto pr-1">
                                        {session.violations.map((violation, index) => (
                                            <li
                                                key={`${violation.type}-${violation.occurredAt}-${index}`}
                                                className="rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600"
                                            >
                                                <span className="block text-slate-800">
                                                    {getViolationLabel(violation.type)}
                                                </span>
                                                <span className="text-slate-400">
                                                    {new Date(violation.occurredAt).toLocaleTimeString(
                                                        "vi-VN",
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        },
                                                    )}
                                                    {violation.appName ? ` - ${violation.appName}` : ""}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
