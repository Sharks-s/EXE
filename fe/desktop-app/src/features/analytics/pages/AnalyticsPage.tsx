import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAnalytics } from "../hooks/useAnalytics";
import type { AnalyticsRange, AnalyticsViolationType } from "../types/analytics.types";
import type { RangeOption, SVGChartPath, StatCardData, StatTone, Trend } from "../index";
import "./AnalyticsPage.css";

const formatMinutes = (minutes: number | undefined, t: (key: string, opts?: any) => string) =>
  t("analytics.minutes_format", {
    defaultValue: "{{value}} phút",
    value: Math.max(Math.round(minutes ?? 0), 0),
  });

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

export default function StatisticsPage() {
  const { t, i18n } = useTranslation("common");

  const {
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
  } = useAnalytics();

  // Locale cho Intl.DateTimeFormat đổi theo ngôn ngữ đang chọn
  const dateLocale = i18n.language === "en" ? "en-US" : "vi-VN";

  const rangeLabels: RangeOption[] = [
    { range: "DAY", label: t("analytics.range_day", { defaultValue: "Ngày" }) },
    { range: "WEEK", label: t("analytics.range_week", { defaultValue: "Tuần" }) },
    { range: "MONTH", label: t("analytics.range_month", { defaultValue: "Tháng" }) },
    { range: "YEAR", label: t("analytics.range_year", { defaultValue: "Năm" }) },
  ];

  const violationLabels: Record<AnalyticsViolationType, string> = {
    AWAY: t("analytics.violation_away", { defaultValue: "Rời khỏi màn hình" }),
    LOOK_AWAY: t("analytics.violation_look_away", { defaultValue: "Nhìn sang nơi khác" }),
    BAD_POSTURE: t("analytics.violation_bad_posture", { defaultValue: "Tư thế chưa tốt" }),
    POOR_LIGHTING: t("analytics.violation_poor_lighting", { defaultValue: "Ánh sáng kém" }),
    TOO_CLOSE: t("analytics.violation_too_close", { defaultValue: "Ngồi quá gần" }),
    PHONE: t("analytics.violation_phone", { defaultValue: "Dùng điện thoại" }),
    ENTERTAINMENT: t("analytics.violation_entertainment", { defaultValue: "Ứng dụng giải trí" }),
  };

  const formatHourRange = (hour: number | null) => {
    if (hour === null) return t("analytics.no_data", { defaultValue: "Chưa có dữ liệu" });
    const endHour = (hour + 1) % 24;
    return `${String(hour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`;
  };

  const formatChartLabel = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "2-digit" }).format(date);
  };

  const formatCalendarMonth = (date: Date) =>
    new Intl.DateTimeFormat(dateLocale, { month: "long", year: "numeric" }).format(date);

  const calendarMonthLabel = useMemo(
    () => formatCalendarMonth(calendarDate),
    [calendarDate, dateLocale],
  );

  const stats = useMemo<StatCardData[]>(
    () => [
      {
        icon: "timer",
        title: t("analytics.stat_total_time", { defaultValue: "Tổng thời gian" }),
        value: formatMinutes(summary?.totalFocusMinutes, t),
        change: formatChange(summary?.compareWithPreviousRange.focusMinutesPercent, "%"),
        trendIcon:
          trendFromNumber(summary?.compareWithPreviousRange.focusMinutesDiff) === "down"
            ? "trending_down"
            : "trending_up",
        trend: trendFromNumber(summary?.compareWithPreviousRange.focusMinutesDiff),
        tone: "primary" as StatTone,
      },
      {
        icon: "task_alt",
        title: t("analytics.stat_total_sessions", { defaultValue: "Tổng số phiên" }),
        value: String(summary?.totalSessions ?? 0),
        change: formatChange(summary?.compareWithPreviousRange.sessionsDiff),
        trendIcon:
          trendFromNumber(summary?.compareWithPreviousRange.sessionsDiff) === "down"
            ? "trending_down"
            : "trending_up",
        trend: trendFromNumber(summary?.compareWithPreviousRange.sessionsDiff),
        tone: "success" as StatTone,
      },
      {
        icon: "warning",
        title: t("analytics.stat_violations", { defaultValue: "Số lần bạn mất tập trung" }),
        value: String(violations?.totalViolations ?? summary?.totalViolations ?? 0),
        change: formatChange(summary?.compareWithPreviousRange.violationsDiff),
        trendIcon:
          trendFromNumber(summary?.compareWithPreviousRange.violationsDiff) === "down"
            ? "trending_down"
            : "trending_up",
        trend: trendFromNumber(summary?.compareWithPreviousRange.violationsDiff),
        tone: "danger" as StatTone,
      },
      {
        icon: "local_fire_department",
        title: t("analytics.stat_streak", { defaultValue: "Chuỗi ngày" }),
        value: t("analytics.stat_streak_value", {
          defaultValue: "{{days}} Ngày",
          days: summary?.currentStreakDays ?? 0,
        }),
        change: "Streak",
        trend: "neutral" as Trend,
        tone: "warning" as StatTone,
      },
    ],
    [summary, violations, t],
  );

  const chartItems = focusTime?.items ?? [];
  const chartPath = buildChartPath(chartItems);
  const bestFocusItem = chartItems.reduce<(typeof chartItems)[number] | null>(
    (best, item) => (!best || item.focusMinutes > best.focusMinutes ? item : best),
    null,
  );

  const heatmapLevels = calendar?.items.map((item) => item.level) ?? [];
  const topHourlyItems = [...(hourly?.items ?? [])]
    .sort((a, b) => b.focusMinutes - a.focusMinutes)
    .slice(0, 2);
  const goalItems = (goals?.items ?? []).slice(0, 2);
  const violationItems = [...(violations?.byType ?? [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  const topApps = (violations?.topApps ?? []).slice(0, 4);

  const weekdayLabels = t("analytics.weekdays", {
    defaultValue: "T2,T3,T4,T5,T6,T7,CN",
  }).split(",");

  return (
    <div className="statistics-page">
      <main className="statistics-main">
        <header className="page-header app-page-header">
          <div className="app-page-title">
            <div className="app-page-title-row">
              <span className="app-page-title-icon">
                <span className="material-symbols-outlined">query_stats</span>
              </span>
              <h1>{t("analytics.page_title", { defaultValue: "Phân tích hiệu suất" })}</h1>
            </div>
            <p>
              {t("analytics.page_subtitle", {
                defaultValue: "Theo dõi tiến độ và tối ưu hóa thời gian tập trung",
              })}
            </p>
          </div>

          {/* BỘ LỌC THỜI GIAN */}
          <div
            className="time-tabs app-page-actions"
            role="tablist"
            aria-label={t("analytics.time_filter_label", { defaultValue: "Bộ lọc thời gian" })}
          >
            {rangeLabels.map((item) => (
              <button
                key={item.range}
                type="button"
                className={`time-tab-btn ${range === item.range ? "active" : ""}`}
                onClick={() => setRange(item.range as AnalyticsRange)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <section
          className="bento-grid"
          aria-label={t("analytics.overview_label", { defaultValue: "Thống kê tổng quan" })}
        >
          {stats.map((stat) => (
            <article className="stat-card" key={stat.title}>
              <div className="stat-top">
                <div className={`stat-icon ${stat.tone}`}>
                  <span className="material-symbols-outlined">{stat.icon}</span>
                </div>
                <span className={`trend-badge ${stat.trend}`}>
                  {stat.trendIcon && (
                    <span className="material-symbols-outlined">{stat.trendIcon}</span>
                  )}
                  {stat.change}
                </span>
              </div>
              <div>
                <h3>{stat.title}</h3>
                <p>{isLoading ? "..." : stat.value}</p>
              </div>
            </article>
          ))}

          <article className="focus-chart-card">
            <div className="card-header">
              <h2>{t("analytics.focus_time_title", { defaultValue: "Thời gian tập trung" })}</h2>
              <div className="best-day-badge">
                <span className="material-symbols-outlined">star</span>
                <span>
                  {t("analytics.best_day_prefix", { defaultValue: "Cao nhất:" })}{" "}
                  {bestFocusItem
                    ? `${formatChartLabel(bestFocusItem.date)} (${formatMinutes(bestFocusItem.focusMinutes, t)})`
                    : t("analytics.no_data", { defaultValue: "Chưa có dữ liệu" })}
                </span>
              </div>
            </div>

            <div className="chart-box">
              {chartPath ? (
                <svg className="chart-svg" preserveAspectRatio="none" viewBox="0 0 1000 300">
                  <path d={chartPath.area} fill="#483bfc" opacity="0.1" />
                  <path d={chartPath.line} fill="none" stroke="#483bfc" strokeWidth="4" />
                </svg>
              ) : (
                <div className="chart-empty">
                  {t("analytics.no_focus_data", { defaultValue: "Chưa có dữ liệu tập trung." })}
                </div>
              )}

              <div className="chart-labels">
                {chartItems.map((item) => (
                  <span key={item.date}>{formatChartLabel(item.date)}</span>
                ))}
              </div>
            </div>
          </article>

          <article className="heatmap-card">
            <div className="heatmap-header">
              <h2>{t("analytics.heatmap_title", { defaultValue: "Tần suất tập trung" })}</h2>
              <div
                className="calendar-controls"
                aria-label={t("analytics.heatmap_month_select", {
                  defaultValue: "Chọn tháng tần suất tập trung",
                })}
              >
                <button
                  type="button"
                  aria-label={t("analytics.prev_month", { defaultValue: "Tháng trước" })}
                  onClick={() => changeCalendarMonth(-1)}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span>{calendarMonthLabel}</span>
                <button
                  type="button"
                  aria-label={t("analytics.next_month", { defaultValue: "Tháng sau" })}
                  disabled={!canGoNextCalendarMonth}
                  onClick={() => changeCalendarMonth(1)}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="heatmap-panel">
              <div className="heatmap-weekdays" aria-hidden="true">
                {weekdayLabels.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div
                className="heatmap-grid"
                aria-label={t("analytics.heatmap_grid_label", {
                  defaultValue: "Tần suất tập trung",
                })}
              >
                {heatmapLevels.map((level, index) => (
                  <span key={index} className={`heatmap-cell level-${level}`} />
                ))}
              </div>
            </div>

            <div className="heatmap-legend">
              <span>{t("analytics.legend_low", { defaultValue: "Ít" })}</span>
              <div className="legend-cells">
                {[0, 1, 2, 3, 4].map((level) => (
                  <span key={level} className={`heatmap-cell level-${level}`} />
                ))}
              </div>
              <span>{t("analytics.legend_high", { defaultValue: "Nhiều" })}</span>
            </div>
            <p>
              {t("analytics.heatmap_footer", {
                defaultValue:
                  "Dựa trên lịch tập trung của {{month}}. Màu càng đậm nghĩa là thời gian tập trung càng cao.",
                month: calendarMonthLabel,
              })}
            </p>
          </article>
        </section>

        <section
          className="bottom-grid"
          aria-label={t("analytics.additional_info_label", { defaultValue: "Thông tin bổ sung" })}
        >
          <article className="info-card">
            <h2>{t("analytics.best_hours_title", { defaultValue: "Giờ hiệu quả nhất" })}</h2>
            {(topHourlyItems.length
              ? topHourlyItems
              : [{ hour: hourly?.bestHour ?? null, focusMinutes: 0, sessions: 0 }]
            ).map((item, index) => (
              <div className="progress-group" key={`${item.hour}-${index}`}>
                <div className="progress-row">
                  <span>{formatHourRange(item.hour)}</span>
                  <strong>
                    {index === 0
                      ? t("analytics.rank_optimal", { defaultValue: "Tối ưu" })
                      : t("analytics.rank_good", { defaultValue: "Khá" })}
                  </strong>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${index === 0 ? "primary" : "secondary"}`}
                    style={{
                      width: `${Math.max(8, Math.min(100, (item.focusMinutes / 120) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </article>

          <article className="info-card">
            <h2>{t("analytics.current_goals_title", { defaultValue: "Mục tiêu hiện tại" })}</h2>
            <div className="goal-list">
              {goalItems.length ? (
                goalItems.map((goal, index) => (
                  <div className="goal-item" key={goal.goal}>
                    <div>
                      <h3>{goal.goal}</h3>
                      <p>
                        {formatMinutes(goal.focusMinutes, t)} •{" "}
                        {t("analytics.sessions_count", {
                          defaultValue: "{{count}} phiên",
                          count: goal.sessions,
                        })}
                      </p>
                    </div>
                    <div className={`goal-ring ${index === 0 ? "primary" : "secondary"}`}>
                      {Math.round(goal.completionRate)}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-copy">
                  {t("analytics.no_goal_data", { defaultValue: "Chưa có dữ liệu mục tiêu." })}
                </p>
              )}
            </div>
          </article>

          <article className="info-card violations-card">
            <div className="violation-header">
              <h2>{t("analytics.violation_detail_title", { defaultValue: "Chi tiết số lần mất tập trung" })}</h2>
              <span>
                {t("analytics.penalty_minutes", {
                  defaultValue: "{{minutes}} bị phạt",
                  minutes: formatMinutes(violations?.penaltyMinutes, t),
                })}
              </span>
            </div>
            <div className="violation-list">
              {violationItems.length ? (
                violationItems.map((item) => (
                  <div className="violation-item" key={item.type}>
                    <div>
                      <h3>{violationLabels[item.type as AnalyticsViolationType] ?? item.type}</h3>
                      <p>
                        {t("analytics.minutes_deducted", {
                          defaultValue: "{{minutes}} phút bị trừ",
                          minutes: item.minutesDeducted,
                        })}
                      </p>
                    </div>
                    <strong>{item.count}</strong>
                  </div>
                ))
              ) : (
                <p className="empty-copy">
                  {t("analytics.no_violation_data", { defaultValue: "Chưa có vi phạm nào." })}
                </p>
              )}
            </div>

            <div className="top-apps">
              <h3>{t("analytics.top_apps_title", { defaultValue: "Ứng dụng gây xao nhãng" })}</h3>
              {topApps.length ? (
                topApps.map((app) => (
                  <div className="top-app-row" key={app.appName}>
                    <span>{app.appName}</span>
                    <strong>{app.count}</strong>
                  </div>
                ))
              ) : (
                <p className="empty-copy">
                  {t("analytics.no_app_data", { defaultValue: "Chưa có dữ liệu ứng dụng." })}
                </p>
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}