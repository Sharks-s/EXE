export type AnalyticsRange = "DAY" | "WEEK" | "MONTH" | "YEAR" | "CUSTOM";

export type AnalyticsViolationType =
  | "AWAY"
  | "LOOK_AWAY"
  | "BAD_POSTURE"
  | "POOR_LIGHTING"
  | "TOO_CLOSE"
  | "PHONE"
  | "ENTERTAINMENT";

export type AnalyticsQuery = {
  range: AnalyticsRange;
  from?: string;
  to?: string;
};

export type AnalyticsSummary = {
  totalFocusMinutes: number;
  totalFocusHours: number;
  totalSessions: number;
  completedSessions: number;
  abortedSessions: number;
  cancelledSessions: number;
  completionRate: number;
  averageSessionMinutes: number;
  totalBreakMinutes: number;
  totalViolations: number;
  currentStreakDays: number;
  longestStreakDays: number;
  compareWithPreviousRange: {
    focusMinutesDiff: number;
    focusMinutesPercent: number;
    sessionsDiff: number;
    violationsDiff: number;
  };
};

export type FocusTimeItem = {
  date: string;
  focusMinutes: number;
  completedSessions: number;
  abortedSessions: number;
};

export type FocusTimeAnalytics = {
  unit: "DAY" | "WEEK" | "MONTH" | "YEAR";
  items: FocusTimeItem[];
};

export type HourlyAnalyticsItem = {
  hour: number;
  focusMinutes: number;
  sessions: number;
};

export type HourlyAnalytics = {
  items: HourlyAnalyticsItem[];
  bestHour: number | null;
};

export type GoalAnalyticsItem = {
  goal: string;
  focusMinutes: number;
  sessions: number;
  completionRate: number;
};

export type GoalAnalytics = {
  items: GoalAnalyticsItem[];
};

export type ViolationAnalytics = {
  totalViolations: number;
  penaltyMinutes: number;
  byType: {
    type: AnalyticsViolationType;
    count: number;
    minutesDeducted: number;
  }[];
  topApps: {
    appName: string;
    count: number;
  }[];
};

export type CalendarHeatmapItem = {
  date: string;
  focusMinutes: number;
  sessions: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type CalendarHeatmap = {
  year: number;
  month: number;
  items: CalendarHeatmapItem[];
};
