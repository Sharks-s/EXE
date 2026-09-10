import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { analyticsApi } from "../api/analytics.api";
import { handleApiError, handleBatchApiErrors } from "@/utils/handleApiError";
import type {
    AnalyticsRange,
    AnalyticsSummary,
    CalendarHeatmap,
    FocusTimeAnalytics,
    GoalAnalytics,
    HourlyAnalytics,
    ViolationAnalytics,
} from "../types/analytics.types";

const LOG_CONTEXT = "[useAnalytics]";

export function useAnalytics() {
    const { t } = useTranslation("common");

    const [range, setRange] = useState<AnalyticsRange>("WEEK");
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [focusTime, setFocusTime] = useState<FocusTimeAnalytics | null>(null);
    const [hourly, setHourly] = useState<HourlyAnalytics | null>(null);
    const [goals, setGoals] = useState<GoalAnalytics | null>(null);
    const [violations, setViolations] = useState<ViolationAnalytics | null>(null);
    const [calendar, setCalendar] = useState<CalendarHeatmap | null>(null);
    const [calendarDate, setCalendarDate] = useState(() => new Date());
    const [isLoading, setIsLoading] = useState(true);

    const calendarYear = calendarDate.getFullYear();
    const calendarMonth = calendarDate.getMonth() + 1;

    const canGoNextCalendarMonth = useMemo(() => {
        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const selectedMonthStart = new Date(calendarYear, calendarMonth - 1, 1);
        return selectedMonthStart.getTime() < currentMonthStart.getTime();
    }, [calendarMonth, calendarYear]);

    const changeCalendarMonth = (offset: number) => {
        setCalendarDate((current) => {
            const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
            const today = new Date();
            const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return next.getTime() > currentMonthStart.getTime() ? currentMonthStart : next;
        });
    };

    // Lưu ý: KHÔNG đưa `t` vào dependency. Reference của `t` đổi mỗi lần
    // đổi ngôn ngữ (i18n.changeLanguage) nhưng dữ liệu analytics (số liệu)
    // không phụ thuộc ngôn ngữ — nếu để `t` trong deps sẽ khiến effect chạy
    // lại và gọi lại toàn bộ 5 API mỗi khi user chỉ đổi vi/en, hoàn toàn lãng phí.
    // Bản thân `t` vẫn luôn trả về đúng ngôn ngữ hiện tại tại thời điểm gọi
    // (đọc trực tiếp từ i18n instance), nên bỏ khỏi deps không gây sai lệch dịch thuật.
    useEffect(() => {
        let cancelled = false;

        const loadAnalytics = async () => {
            try {
                setIsLoading(true);

                const [
                    summaryResult,
                    focusTimeResult,
                    hourlyResult,
                    goalsResult,
                    violationsResult,
                ] = await Promise.allSettled([
                    analyticsApi.getSummary({ range }),
                    analyticsApi.getFocusTime({ range }),
                    analyticsApi.getHourly({ range }),
                    analyticsApi.getGoals({ range }),
                    analyticsApi.getViolations({ range }),
                ]);

                if (cancelled) return;

                if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
                if (focusTimeResult.status === "fulfilled") setFocusTime(focusTimeResult.value);
                if (hourlyResult.status === "fulfilled") setHourly(hourlyResult.value);
                if (goalsResult.status === "fulfilled") setGoals(goalsResult.value);
                if (violationsResult.status === "fulfilled") setViolations(violationsResult.value);

                const failedErrors = [
                    summaryResult,
                    focusTimeResult,
                    hourlyResult,
                    goalsResult,
                    violationsResult,
                ]
                    .filter((result) => result.status === "rejected")
                    .map((result) => (result as PromiseRejectedResult).reason);

                // Gộp lỗi: 1 lỗi -> hiện đúng message cụ thể (SESSION_xxx, PREMIUM_xxx...);
                // nhiều lỗi cùng lúc -> 1 toast chung, tránh spam 5 toast cho user.
                handleBatchApiErrors(failedErrors, {
                    context: LOG_CONTEXT,
                    action: "Lỗi tải dữ liệu analytics",
                    groupedMessage: t("analytics.partial_load_error", {
                        defaultValue:
                            "Một vài thống kê chưa tải được, đang hiển thị phần còn lại.",
                    }),
                    dedupeKey: `analytics-summary-${range}`,
                });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadAnalytics();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    useEffect(() => {
        let cancelled = false;

        const loadCalendar = async () => {
            try {
                const calendarResult = await analyticsApi.getCalendar(calendarYear, calendarMonth);
                if (!cancelled) setCalendar(calendarResult);
            } catch (err) {
                if (cancelled) return;

                setCalendar(null);
                handleApiError(err, {
                    context: LOG_CONTEXT,
                    action: "Lỗi tải lịch heatmap",
                    fallbackMessage: t("analytics.calendar_load_error", {
                        defaultValue: "Chưa tải được tần suất tập trung của tháng này.",
                    }),
                    // Dedupe theo tháng: user bấm next/prev liên tục khi BE lỗi
                    // sẽ không bị spam toast, nhưng console vẫn log đầy đủ để debug.
                    dedupeKey: "analytics-calendar",
                });
            }
        };

        loadCalendar();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [calendarMonth, calendarYear]);

    return {
        range,
        setRange,
        summary,
        focusTime,
        hourly,
        goals,
        violations,
        calendar,
        calendarDate,
        isLoading,
        canGoNextCalendarMonth,
        changeCalendarMonth,
    };
}