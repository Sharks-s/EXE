import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAnalytics } from "./useAnalytics";
import { useAnalyticsSessionHistory } from "./useAnalyticsSessionHistory";
import type { AnalyticsViolationType } from "../types/analytics.types";
import type { RangeOption, SVGChartPath, StatCardData, StatTone, Trend } from "../types/analyticsPage.types";
import type { FocusSessionResponse } from "@/features/focus-session/types/focus.types";
import { getSessionReview } from "../utils/sessionReview.utils";

const formatChange = (value?: number, suffix = "") => {
  if (value === undefined || value === null) return "0";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${suffix}`;
};

const trendFromNumber = (value?: number): Trend => {
  if (!value) return "neutral";
  return value > 0 ? "up" : "down";
};

const buildChartPath = (items: { focusMinutes: number }[]): SVGChartPath | null => {
  if (!items.length) return null;
  const maxMinutes = Math.max(...items.map((item) => item.focusMinutes), 1);
  const lastIndex = Math.max(items.length - 1, 1);
  const points = items.map((item, index) => ({
    x: (index / lastIndex) * 1000,
    y: 280 - (item.focusMinutes / maxMinutes) * 220,
  }));

  const line = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const area = `${line} L1000,300 L0,300 Z`;
  return { line, area };
};

export function useAnalyticsPageModel() {
  const { t, i18n } = useTranslation("common");
  const [isHistoryPopupOpen, setIsHistoryPopupOpen] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState<FocusSessionResponse | null>(null);

  const analytics = useAnalytics();
  const {
    sessionHistory,
    reviewedSessions,
    averageReviewScore,
    isSessionHistoryLoading,
  } = useAnalyticsSessionHistory();

  const dateLocale = i18n.language === "en" ? "en-US" : "vi-VN";

  const formatMinutes = (minutes: number | undefined) =>
    t("analytics.minutes_format", {
      defaultValue: "{{value}} phut",
      value: Math.max(Math.round(minutes ?? 0), 0),
    });

  const formatHourRange = (hour: number | null) => {
    if (hour === null) return t("analytics.no_data", { defaultValue: "Chua co du lieu" });
    const endHour = (hour + 1) % 24;
    return `${String(hour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`;
  };

  const formatChartLabel = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "2-digit" }).format(date);
  };

  const calendarMonthLabel = useMemo(
    () => new Intl.DateTimeFormat(dateLocale, { month: "long", year: "numeric" }).format(analytics.calendarDate),
    [analytics.calendarDate, dateLocale],
  );

  const rangeLabels = useMemo<RangeOption[]>(
    () => [
      { range: "DAY", label: t("analytics.range_day", { defaultValue: "Ngay" }) },
      { range: "WEEK", label: t("analytics.range_week", { defaultValue: "Tuan" }) },
      { range: "MONTH", label: t("analytics.range_month", { defaultValue: "Thang" }) },
      { range: "YEAR", label: t("analytics.range_year", { defaultValue: "Nam" }) },
    ],
    [t],
  );

  const violationLabels = useMemo<Record<AnalyticsViolationType, string>>(
    () => ({
      AWAY: t("analytics.violation_away", { defaultValue: "Roi khoi man hinh" }),
      LOOK_AWAY: t("analytics.violation_look_away", { defaultValue: "Nhin sang noi khac" }),
      BAD_POSTURE: t("analytics.violation_bad_posture", { defaultValue: "Tu the chua tot" }),
      POOR_LIGHTING: t("analytics.violation_poor_lighting", { defaultValue: "Anh sang kem" }),
      TOO_CLOSE: t("analytics.violation_too_close", { defaultValue: "Ngoi qua gan" }),
      PHONE: t("analytics.violation_phone", { defaultValue: "Dung dien thoai" }),
      ENTERTAINMENT: t("analytics.violation_entertainment", { defaultValue: "Ung dung giai tri" }),
    }),
    [t],
  );

  const stats = useMemo<StatCardData[]>(
    () => [
      {
        icon: "timer",
        title: t("analytics.stat_total_time", { defaultValue: "Tong thoi gian" }),
        value: formatMinutes(analytics.summary?.totalFocusMinutes),
        change: formatChange(analytics.summary?.compareWithPreviousRange.focusMinutesPercent, "%"),
        trendIcon:
          trendFromNumber(analytics.summary?.compareWithPreviousRange.focusMinutesDiff) === "down"
            ? "trending_down"
            : "trending_up",
        trend: trendFromNumber(analytics.summary?.compareWithPreviousRange.focusMinutesDiff),
        tone: "primary" as StatTone,
      },
      {
        icon: "task_alt",
        title: t("analytics.stat_total_sessions", { defaultValue: "Tong so phien" }),
        value: String(analytics.summary?.totalSessions ?? 0),
        change: formatChange(analytics.summary?.compareWithPreviousRange.sessionsDiff),
        trendIcon:
          trendFromNumber(analytics.summary?.compareWithPreviousRange.sessionsDiff) === "down"
            ? "trending_down"
            : "trending_up",
        trend: trendFromNumber(analytics.summary?.compareWithPreviousRange.sessionsDiff),
        tone: "success" as StatTone,
      },
      {
        icon: "warning",
        title: t("analytics.stat_violations", { defaultValue: "So lan ban mat tap trung" }),
        value: String(analytics.violations?.totalViolations ?? analytics.summary?.totalViolations ?? 0),
        change: formatChange(analytics.summary?.compareWithPreviousRange.violationsDiff),
        trendIcon:
          trendFromNumber(analytics.summary?.compareWithPreviousRange.violationsDiff) === "down"
            ? "trending_down"
            : "trending_up",
        trend: trendFromNumber(analytics.summary?.compareWithPreviousRange.violationsDiff),
        tone: "danger" as StatTone,
      },
      {
        icon: "local_fire_department",
        title: t("analytics.stat_streak", { defaultValue: "Chuoi ngay" }),
        value: t("analytics.stat_streak_value", {
          defaultValue: "{{days}} Ngay",
          days: analytics.summary?.currentStreakDays ?? 0,
        }),
        change: "Streak",
        trend: "neutral" as Trend,
        tone: "warning" as StatTone,
      },
    ],
    [analytics.summary, analytics.violations, t],
  );

  const chartItems = analytics.focusTime?.items ?? [];
  const chartPath = useMemo(() => buildChartPath(chartItems), [chartItems]);
  const bestFocusItem = useMemo(
    () =>
      chartItems.reduce<(typeof chartItems)[number] | null>(
        (best, item) => (!best || item.focusMinutes > best.focusMinutes ? item : best),
        null,
      ),
    [chartItems],
  );

  const heatmapLevels = analytics.calendar?.items.map((item) => item.level) ?? [];
  const topHourlyItems = useMemo(
    () =>
      [...(analytics.hourly?.items ?? [])]
        .sort((a, b) => b.focusMinutes - a.focusMinutes)
        .slice(0, 2),
    [analytics.hourly],
  );
  const goalItems = useMemo(() => (analytics.goals?.items ?? []).slice(0, 2), [analytics.goals]);
  const violationItems = useMemo(
    () =>
      [...(analytics.violations?.byType ?? [])]
        .filter((item) => item.minutesDeducted > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4),
    [analytics.violations],
  );
  const topApps = useMemo(() => (analytics.violations?.topApps ?? []).slice(0, 4), [analytics.violations]);
  const selectedReview = selectedHistorySession ? getSessionReview(selectedHistorySession) : null;
  const weekdayLabels = t("analytics.weekdays", {
    defaultValue: "T2,T3,T4,T5,T6,T7,CN",
  }).split(",");

  const openHistoryPopup = () => {
    setSelectedHistorySession((current) => current ?? sessionHistory[0] ?? null);
    setIsHistoryPopupOpen(true);
  };

  return {
    t,
    analytics,
    rangeLabels,
    stats,
    chartItems,
    chartPath,
    bestFocusItem,
    heatmapLevels,
    calendarMonthLabel,
    weekdayLabels,
    topHourlyItems,
    goalItems,
    violationItems,
    violationLabels,
    topApps,
    reviewedSessions,
    averageReviewScore,
    selectedHistorySession,
    selectedReview,
    isSessionHistoryLoading,
    isHistoryPopupOpen,
    setSelectedHistorySession,
    setIsHistoryPopupOpen,
    openHistoryPopup,
    formatMinutes,
    formatHourRange,
    formatChartLabel,
  };
}
