import type {
    AnalyticsRange,
    AnalyticsSummary,
    AnalyticsViolationType,
    CalendarHeatmap,
    FocusTimeAnalytics,
    GoalAnalytics,
    HourlyAnalytics,
    ViolationAnalytics,
} from "../types/analytics.types";

export type StatTone = "primary" | "success" | "danger" | "warning";
export type Trend = "up" | "down" | "neutral";

export interface RangeOption {
    range: AnalyticsRange;
    label: string;
}

export interface StatCardData {
    icon: string;
    title: string;
    value: string;
    change: string;
    trendIcon?: string;
    trend: Trend;
    tone: StatTone;
}

export interface SVGChartPath {
    line: string;
    area: string;
}

export type ViolationLabels = Record<AnalyticsViolationType, string>;

export interface UseAnalyticsReturn {
    range: AnalyticsRange;
    setRange: (range: AnalyticsRange) => void;
    summary?: AnalyticsSummary;
    focusTime?: FocusTimeAnalytics;
    hourly?: HourlyAnalytics;
    goals?: GoalAnalytics;
    violations?: ViolationAnalytics;
    calendar?: CalendarHeatmap;
    calendarDate: Date;
    isLoading: boolean;
    error?: string | null;
    canGoNextCalendarMonth: boolean;
    changeCalendarMonth: (delta: number) => void;
}