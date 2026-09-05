import api from "@/lib/axios";
import type { ApiResponse } from "@/types";
import type {
  AnalyticsQuery,
  AnalyticsSummary,
  CalendarHeatmap,
  FocusTimeAnalytics,
  GoalAnalytics,
  HourlyAnalytics,
  ViolationAnalytics,
} from "../types/analytics.types";

const ANALYTICS_ENDPOINT = "/users/me/analytics";

const buildRangeParams = ({ range, from, to }: AnalyticsQuery) => ({
  range,
  ...(range === "CUSTOM" ? { from, to } : {}),
});

export const analyticsApi = {
  getSummary: (query: AnalyticsQuery) =>
    api
      .get<ApiResponse<AnalyticsSummary>>(`${ANALYTICS_ENDPOINT}/summary`, {
        params: buildRangeParams(query),
      })
      .then((r) => r.data.data),

  getFocusTime: (query: AnalyticsQuery) =>
    api
      .get<ApiResponse<FocusTimeAnalytics>>(`${ANALYTICS_ENDPOINT}/focus-time`, {
        params: buildRangeParams(query),
      })
      .then((r) => r.data.data),

  getHourly: (query: AnalyticsQuery) =>
    api
      .get<ApiResponse<HourlyAnalytics>>(`${ANALYTICS_ENDPOINT}/hourly`, {
        params: buildRangeParams(query),
      })
      .then((r) => r.data.data),

  getGoals: (query: AnalyticsQuery) =>
    api
      .get<ApiResponse<GoalAnalytics>>(`${ANALYTICS_ENDPOINT}/goals`, {
        params: buildRangeParams(query),
      })
      .then((r) => r.data.data),

  getViolations: (query: AnalyticsQuery) =>
    api
      .get<ApiResponse<ViolationAnalytics>>(`${ANALYTICS_ENDPOINT}/violations`, {
        params: buildRangeParams(query),
      })
      .then((r) => r.data.data),

  getCalendar: (year: number, month: number) =>
    api
      .get<ApiResponse<CalendarHeatmap>>(`${ANALYTICS_ENDPOINT}/calendar`, {
        params: { year, month },
      })
      .then((r) => r.data.data),
};
