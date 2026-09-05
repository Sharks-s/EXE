import { useMemo } from "react";
import { useAnalytics } from "../hooks/useAnalytics";
import type { AnalyticsRange } from "../types/analytics.types";
import "./AnalyticsPage.css";

type StatTone = "primary" | "success" | "danger" | "warning";
type Trend = "up" | "down" | "neutral";

const rangeLabels: { range: AnalyticsRange; label: string }[] = [
  { range: "DAY", label: "Ngày" },
  { range: "WEEK", label: "Tuần" },
  { range: "MONTH", label: "Tháng" },
  { range: "YEAR", label: "Năm" },
];

const violationLabels: Record<string, string> = {
  AWAY: "Rời khỏi màn hình",
  LOOK_AWAY: "Nhìn sang nơi khác",
  BAD_POSTURE: "Tư thế chưa tốt",
  POOR_LIGHTING: "Ánh sáng kém",
  TOO_CLOSE: "Ngồi quá gần",
  PHONE: "Dùng điện thoại",
  ENTERTAINMENT: "Ứng dụng giải trí",
};

const formatMinutes = (minutes?: number) => `${Math.max(Math.round(minutes ?? 0), 0)} phút`;

const formatChange = (value?: number, suffix = "") => {
  if (value === undefined || value === null) return "0";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${suffix}`;
};

const trendFromNumber = (value?: number): Trend => {
  if (!value) return "neutral";
  return value > 0 ? "up" : "down";
};

const formatHourRange = (hour: number | null) => {
  if (hour === null) return "Chưa có dữ liệu";
  const endHour = (hour + 1) % 24;
  return `${String(hour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`;
};

const formatChartLabel = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
};

const formatCalendarMonth = (date: Date) =>
  new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(date);

const buildChartPath = (items: { focusMinutes: number }[]) => {
  if (!items.length) return "";
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
    error,
    canGoNextCalendarMonth,
    changeCalendarMonth,
  } = useAnalytics();

  const calendarMonthLabel = useMemo(() => formatCalendarMonth(calendarDate), [calendarDate]);

  const stats = useMemo(
    () => [
      {
        icon: "timer",
        title: "Tổng thời gian",
        value: formatMinutes(summary?.totalFocusMinutes),
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
        title: "Tổng số phiên",
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
        title: "Số lần bạn mất tập trung",
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
        title: "Chuỗi ngày",
        value: `${summary?.currentStreakDays ?? 0} Ngày`,
        change: "Streak",
        trend: "neutral" as Trend,
        tone: "warning" as StatTone,
      },
    ],
    [summary, violations],
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

  return (
    <div className="statistics-page">
      <main className="statistics-main">
        <header className="page-header app-page-header">
          <div className="app-page-title">
            <div className="app-page-title-row">
              <span className="app-page-title-icon">
                <span className="material-symbols-outlined">query_stats</span>
              </span>
              <h1>Phân tích hiệu suất</h1>
            </div>
            <p>Theo dõi tiến độ và tối ưu hóa thời gian tập trung</p>
            {error && <p className="analytics-error">{error}</p>}
          </div>

          {/* BỘ LỌC THỜI GIAN */}
          <div className="time-tabs app-page-actions" role="tablist" aria-label="Bộ lọc thời gian">
            {rangeLabels.map((item) => (
              <button
                key={item.range}
                type="button"
                className={`time-tab-btn ${range === item.range ? "active" : ""}`}
                onClick={() => setRange(item.range)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <section className="bento-grid" aria-label="Thống kê tổng quan">
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
              <h2>Thời gian tập trung</h2>
              <div className="best-day-badge">
                <span className="material-symbols-outlined">star</span>
                <span>
                  Cao nhất:{" "}
                  {bestFocusItem
                    ? `${formatChartLabel(bestFocusItem.date)} (${formatMinutes(bestFocusItem.focusMinutes)})`
                    : "Chưa có dữ liệu"}
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
                <div className="chart-empty">Chưa có dữ liệu tập trung.</div>
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
              <h2>Tần suất tập trung</h2>
              <div className="calendar-controls" aria-label="Chọn tháng tần suất tập trung">
                <button type="button" aria-label="Tháng trước" onClick={() => changeCalendarMonth(-1)}>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span>{calendarMonthLabel}</span>
                <button
                  type="button"
                  aria-label="Tháng sau"
                  disabled={!canGoNextCalendarMonth}
                  onClick={() => changeCalendarMonth(1)}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="heatmap-panel">
              <div className="heatmap-weekdays" aria-hidden="true">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="heatmap-grid" aria-label="Tan suat tap trung">
                {heatmapLevels.map((level, index) => (
                  <span key={index} className={`heatmap-cell level-${level}`} />
                ))}
              </div>
            </div>

            <div className="heatmap-legend">
              <span>Ít</span>
              <div className="legend-cells">
                {[0, 1, 2, 3, 4].map((level) => (
                  <span key={level} className={`heatmap-cell level-${level}`} />
                ))}
              </div>
              <span>Nhiều</span>
            </div>
            <p>Dựa trên lịch tập trung của {calendarMonthLabel}. Màu càng đậm nghĩa là thời gian tập trung càng cao.</p>
          </article>
        </section>

        <section className="bottom-grid" aria-label="Thông tin bổ sung">
          <article className="info-card">
            <h2>Giờ hiệu quả nhất</h2>
            {(topHourlyItems.length
              ? topHourlyItems
              : [{ hour: hourly?.bestHour ?? null, focusMinutes: 0, sessions: 0 }]
            ).map((item, index) => (
              <div className="progress-group" key={`${item.hour}-${index}`}>
                <div className="progress-row">
                  <span>{formatHourRange(item.hour)}</span>
                  <strong>{index === 0 ? "Tối ưu" : "Khá"}</strong>
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
            <h2>Mục tiêu hiện tại</h2>
            <div className="goal-list">
              {goalItems.length ? (
                goalItems.map((goal, index) => (
                  <div className="goal-item" key={goal.goal}>
                    <div>
                      <h3>{goal.goal}</h3>
                      <p>{formatMinutes(goal.focusMinutes)} • {goal.sessions} phiên</p>
                    </div>
                    <div className={`goal-ring ${index === 0 ? "primary" : "secondary"}`}>
                      {Math.round(goal.completionRate)}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-copy">Chưa có dữ liệu mục tiêu.</p>
              )}
            </div>
          </article>

          <article className="info-card violations-card">
            <div className="violation-header">
              <h2>Chi tiết số lần mất tập trung</h2>
              <span>{formatMinutes(violations?.penaltyMinutes)} bị phạt</span>
            </div>
            <div className="violation-list">
              {violationItems.length ? (
                violationItems.map((item) => (
                  <div className="violation-item" key={item.type}>
                    <div>
                      <h3>{violationLabels[item.type] ?? item.type}</h3>
                      <p>{item.minutesDeducted} phút bị trừ</p>
                    </div>
                    <strong>{item.count}</strong>
                  </div>
                ))
              ) : (
                <p className="empty-copy">Chưa có vi phạm nào.</p>
              )}
            </div>

            <div className="top-apps">
              <h3>Ứng dụng gây xao nhãng</h3>
              {topApps.length ? (
                topApps.map((app) => (
                  <div className="top-app-row" key={app.appName}>
                    <span>{app.appName}</span>
                    <strong>{app.count}</strong>
                  </div>
                ))
              ) : (
                <p className="empty-copy">Chưa có dữ liệu ứng dụng.</p>
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}