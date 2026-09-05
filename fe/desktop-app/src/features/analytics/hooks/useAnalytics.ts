import { useEffect, useMemo, useState } from "react";
import { analyticsApi } from "../api/analytics.api";
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
    const [range, setRange] = useState<AnalyticsRange>("WEEK");
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [focusTime, setFocusTime] = useState<FocusTimeAnalytics | null>(null);
    const [hourly, setHourly] = useState<HourlyAnalytics | null>(null);
    const [goals, setGoals] = useState<GoalAnalytics | null>(null);
    const [violations, setViolations] = useState<ViolationAnalytics | null>(null);
    const [calendar, setCalendar] = useState<CalendarHeatmap | null>(null);
    const [calendarDate, setCalendarDate] = useState(() => new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

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
                setError("");

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

                const hasFailure = [
                    summaryResult,
                    focusTimeResult,
                    hourlyResult,
                    goalsResult,
                    violationsResult,
                ].some((result) => result.status === "rejected");

                if (hasFailure) {
                    setError("Một vài thống kê chưa tải được, đang hiển thị phần còn lại.");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadAnalytics();
        return () => {
            cancelled = true;
        };
    }, [range]);

    useEffect(() => {
        let cancelled = false;

        const loadCalendar = async () => {
            try {
                const calendarResult = await analyticsApi.getCalendar(calendarYear, calendarMonth);
                if (!cancelled) setCalendar(calendarResult);
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setCalendar(null);
                    setError("Chưa tải được tần suất tập trung của tháng này.");
                }
            }
        };

        loadCalendar();
        return () => {
            cancelled = true;
        };
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
        error,
        canGoNextCalendarMonth,
        changeCalendarMonth,
    };
}