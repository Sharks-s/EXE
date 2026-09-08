import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { analyticsApi } from "../api/analytics.api";
import { toast } from "@/shared/store/toastStore";
import type {
    AnalyticsRange,
    AnalyticsSummary,
    CalendarHeatmap,
    FocusTimeAnalytics,
    GoalAnalytics,
    HourlyAnalytics,
    ViolationAnalytics,
} from "../types/analytics.types";

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

                const failedResults = [
                    summaryResult,
                    focusTimeResult,
                    hourlyResult,
                    goalsResult,
                    violationsResult,
                ].filter((result) => result.status === "rejected");

                // Log chi tiết lỗi hệ thống ra console để debug — không cần dịch, chỉ dev xem
                failedResults.forEach((result) => {
                    if (result.status === "rejected") {
                        console.error("[useAnalytics] Lỗi tải dữ liệu:", result.reason);
                    }
                });

                // Báo cho user biết bằng toast, nội dung qua t() để đổi theo ngôn ngữ
                if (failedResults.length > 0) {
                    toast.error(
                        t("analytics.partial_load_error", {
                            defaultValue:
                                "Một vài thống kê chưa tải được, đang hiển thị phần còn lại.",
                        }),
                    );
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadAnalytics();
        return () => {
            cancelled = true;
        };
    }, [range, t]);

    useEffect(() => {
        let cancelled = false;

        const loadCalendar = async () => {
            try {
                const calendarResult = await analyticsApi.getCalendar(calendarYear, calendarMonth);
                if (!cancelled) setCalendar(calendarResult);
            } catch (err) {
                console.error("[useAnalytics] Lỗi tải lịch heatmap:", err);
                if (!cancelled) {
                    setCalendar(null);
                    toast.error(
                        t("analytics.calendar_load_error", {
                            defaultValue: "Chưa tải được tần suất tập trung của tháng này.",
                        }),
                    );
                }
            }
        };

        loadCalendar();
        return () => {
            cancelled = true;
        };
    }, [calendarMonth, calendarYear, t]);

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