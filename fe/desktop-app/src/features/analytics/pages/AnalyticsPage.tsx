import { useEffect, useMemo, useState } from "react";
import { analyticsApi } from "../api/analytics.api";
import type {
  AnalyticsQuery,
  AnalyticsRange,
  AnalyticsSummary,
  CalendarHeatmap,
  FocusTimeAnalytics,
  GoalAnalytics,
  HourlyAnalytics,
  ViolationAnalytics,
} from "../types/analytics.types";
import "./AnalyticsPage.css";

const rangeOptions: { label: string; value: AnalyticsRange }[] = [
  { label: "Ngày", value: "DAY" },
  { label: "Tuần", value: "WEEK" },
  { label: "Tháng", value: "MONTH" },
  { label: "Năm", value: "YEAR" },
  { label: "Tùy chọn", value: "CUSTOM" },
];

const violationLabels: Record<string, string> = {
  AWAY: "Rời chỗ",
  LOOK_AWAY: "Nhìn ra ngoài",
  BAD_POSTURE: "Sai tư thế",
  POOR_LIGHTING: "Thiếu sáng",
  TOO_CLOSE: "Quá gần",
  PHONE: "Điện thoại",
  ENTERTAINMENT: "Giải trí",
};

type AnalyticsState = {
  summary: AnalyticsSummary | null;
  focusTime: FocusTimeAnalytics | null;
  hourly: HourlyAnalytics | null;
  goals: GoalAnalytics | null;
  violations: ViolationAnalytics | null;
  calendar: CalendarHeatmap | null;
};

const emptyState: AnalyticsState = {
  summary: null,
  focusTime: null,
  hourly: null,
  goals: null,
  violations: null,
  calendar: null,
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function formatPercent(value?: number) {
  return `${(value ?? 0).toFixed(1)}%`;
}

function formatHour(hour?: number | null) {
  if (hour === null || hour === undefined) return "--:--";
  return `${String(hour).padStart(2, "0")}:00`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildMonthDays(year: number, month: number) {
  return Array.from({ length: getDaysInMonth(year, month) }, (_, index) => {
    const day = index + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
}

function StatCard({
  label,
  value,
  detail,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  return (
    <div className={`analytics-stat analytics-stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function FocusChart({ data }: { data: FocusTimeAnalytics | null }) {
  const items = data?.items ?? [];
  const maxMinutes = Math.max(...items.map((item) => item.focusMinutes), 1);
  const width = Math.max(items.length * 72, 420);
  const height = 220;
  const chartHeight = 150;
  const points = items
    .map((item, index) => {
      const x = 36 + index * ((width - 72) / Math.max(items.length - 1, 1));
      const y = 24 + chartHeight - (item.focusMinutes / maxMinutes) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  if (!items.length) {
    return <div className="analytics-empty">Chưa có dữ liệu focus time.</div>;
  }

  return (
    <div className="analytics-chart-scroll">
      <svg className="analytics-chart" viewBox={`0 0 ${width} ${height}`}>
        <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="3" />
        {items.map((item, index) => {
          const x = 36 + index * ((width - 72) / Math.max(items.length - 1, 1));
          const barHeight = (item.focusMinutes / maxMinutes) * chartHeight;
          const y = 24 + chartHeight - barHeight;

          return (
            <g key={item.date}>
              <rect
                x={x - 14}
                y={y}
                width="28"
                height={barHeight}
                rx="6"
                className="analytics-chart-bar"
              />
              <circle cx={x} cy={y} r="5" className="analytics-chart-dot" />
              <text x={x} y="198" textAnchor="middle" className="analytics-chart-label">
                {formatShortDate(item.date)}
              </text>
              <text x={x} y={Math.max(y - 8, 14)} textAnchor="middle" className="analytics-chart-value">
                {item.focusMinutes}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today],
  );
  const [range, setRange] = useState<AnalyticsRange>("WEEK");
  const [from, setFrom] = useState(toDateInputValue(monthStart));
  const [to, setTo] = useState(toDateInputValue(today));
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1);
  const [data, setData] = useState<AnalyticsState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo<AnalyticsQuery>(
    () => ({
      range,
      ...(range === "CUSTOM" ? { from, to } : {}),
    }),
    [from, range, to],
  );

  useEffect(() => {
    if (range === "CUSTOM" && (!from || !to)) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      analyticsApi.getSummary(query),
      analyticsApi.getFocusTime(query),
      analyticsApi.getHourly(query),
      analyticsApi.getGoals(query),
      analyticsApi.getViolations(query),
    ])
      .then(([summary, focusTime, hourly, goals, violations]) => {
        if (!isMounted) return;
        setData((current) => ({
          ...current,
          summary,
          focusTime,
          hourly,
          goals,
          violations,
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        setData((current) => ({
          ...current,
          summary: null,
          focusTime: null,
          hourly: null,
          goals: null,
          violations: null,
        }));
        setError("Không tải được dữ liệu analytics. Vui lòng thử lại.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [from, query, range, to]);

  useEffect(() => {
    let isMounted = true;

    analyticsApi
      .getCalendar(calendarYear, calendarMonth)
      .then((calendar) => {
        if (!isMounted) return;
        setData((current) => ({ ...current, calendar }));
      })
      .catch(() => {
        if (!isMounted) return;
        setData((current) => ({ ...current, calendar: null }));
      });

    return () => {
      isMounted = false;
    };
  }, [calendarMonth, calendarYear]);

  const calendarItems = useMemo(() => {
    const itemMap = new Map(
      (data.calendar?.items ?? []).map((item) => [item.date, item]),
    );
    return buildMonthDays(calendarYear, calendarMonth).map((date) => ({
      date,
      item: itemMap.get(date),
    }));
  }, [calendarMonth, calendarYear, data.calendar?.items]);

  const summary = data.summary;
  const compare = summary?.compareWithPreviousRange;
  const maxGoalMinutes = Math.max(
    ...(data.goals?.items ?? []).map((item) => item.focusMinutes),
    1,
  );
  const maxViolationCount = Math.max(
    ...(data.violations?.byType ?? []).map((item) => item.count),
    1,
  );

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <p className="analytics-kicker">Analytics</p>
          <h1>Thống kê học tập</h1>
          <span>Theo dõi thời gian tập trung, mục tiêu và các lần vi phạm.</span>
        </div>

        <div className="analytics-filters">
          <div className="analytics-range-tabs" aria-label="Chọn khoảng thời gian">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                className={range === option.value ? "active" : ""}
                onClick={() => setRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {range === "CUSTOM" && (
            <div className="analytics-date-row">
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </div>
          )}
        </div>
      </header>

      {error && <div className="analytics-alert">{error}</div>}

      <section className="analytics-grid analytics-summary-grid">
        <StatCard
          label="Tổng tập trung"
          value={`${formatNumber(summary?.totalFocusMinutes)} phút`}
          detail={`${(summary?.totalFocusHours ?? 0).toFixed(1)} giờ`}
        />
        <StatCard
          label="Số phiên"
          value={formatNumber(summary?.totalSessions)}
          detail={`${formatNumber(summary?.completedSessions)} hoàn thành`}
          tone="green"
        />
        <StatCard
          label="Tỷ lệ hoàn thành"
          value={formatPercent(summary?.completionRate)}
          detail={`${formatNumber(summary?.abortedSessions)} bỏ dở, ${formatNumber(summary?.cancelledSessions)} hủy`}
          tone="amber"
        />
        <StatCard
          label="Vi phạm"
          value={formatNumber(summary?.totalViolations)}
          detail={`${formatNumber(data.violations?.penaltyMinutes)} phút phạt`}
          tone="red"
        />
      </section>

      <section className="analytics-grid analytics-insight-grid">
        <article className="analytics-panel analytics-panel-wide">
          <div className="analytics-panel-header">
            <div>
              <h2>Focus time</h2>
              <span>Đơn vị: {data.focusTime?.unit ?? "--"}</span>
            </div>
            {isLoading && <span className="analytics-loading">Đang tải</span>}
          </div>
          <FocusChart data={data.focusTime} />
        </article>

        <article className="analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <h2>Giờ hiệu quả</h2>
              <span>Phân bổ theo giờ trong ngày</span>
            </div>
          </div>
          <div className="analytics-best-hour">
            <strong>{formatHour(data.hourly?.bestHour)}</strong>
            <p>Bạn học hiệu quả nhất lúc {formatHour(data.hourly?.bestHour)}.</p>
          </div>
          <div className="analytics-hour-list">
            {(data.hourly?.items ?? []).slice(0, 5).map((item) => (
              <div key={item.hour} className="analytics-mini-row">
                <span>{formatHour(item.hour)}</span>
                <div>
                  <i style={{ width: `${Math.min(item.focusMinutes, 180) / 1.8}%` }} />
                </div>
                <strong>{item.focusMinutes}p</strong>
              </div>
            ))}
            {!data.hourly?.items.length && <div className="analytics-empty small">Chưa có dữ liệu.</div>}
          </div>
        </article>
      </section>

      <section className="analytics-grid analytics-detail-grid">
        <article className="analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <h2>Mục tiêu</h2>
              <span>Focus time theo từng goal</span>
            </div>
          </div>
          <div className="analytics-list">
            {(data.goals?.items ?? []).map((goal) => (
              <div key={goal.goal} className="analytics-goal-row">
                <div>
                  <strong>{goal.goal}</strong>
                  <span>{goal.sessions} phiên · {formatPercent(goal.completionRate)}</span>
                </div>
                <em>{goal.focusMinutes}p</em>
                <i style={{ width: `${(goal.focusMinutes / maxGoalMinutes) * 100}%` }} />
              </div>
            ))}
            {!data.goals?.items.length && <div className="analytics-empty">Chưa có goal nào.</div>}
          </div>
        </article>

        <article className="analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <h2>Vi phạm</h2>
              <span>Theo loại và ứng dụng</span>
            </div>
          </div>
          <div className="analytics-list">
            {(data.violations?.byType ?? []).map((violation) => (
              <div key={violation.type} className="analytics-violation-row">
                <div>
                  <strong>{violationLabels[violation.type] ?? violation.type}</strong>
                  <span>{violation.minutesDeducted} phút bị trừ</span>
                </div>
                <em>{violation.count}</em>
                <i style={{ width: `${(violation.count / maxViolationCount) * 100}%` }} />
              </div>
            ))}
            {!data.violations?.byType.length && <div className="analytics-empty">Không có vi phạm.</div>}
          </div>

          <div className="analytics-top-apps">
            {(data.violations?.topApps ?? []).map((app) => (
              <span key={app.appName}>{app.appName}: {app.count}</span>
            ))}
          </div>
        </article>
      </section>

      <section className="analytics-grid analytics-bottom-grid">
        <article className="analytics-panel">
          <div className="analytics-panel-header">
            <div>
              <h2>Calendar heatmap</h2>
              <span>Level 0-4 theo số phút học mỗi ngày</span>
            </div>
            <div className="analytics-calendar-controls">
              <input
                type="number"
                min="2020"
                max="2100"
                value={calendarYear}
                onChange={(event) => setCalendarYear(Number(event.target.value))}
              />
              <select
                value={calendarMonth}
                onChange={(event) => setCalendarMonth(Number(event.target.value))}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                  <option key={month} value={month}>Tháng {month}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="analytics-calendar">
            {calendarItems.map(({ date, item }) => (
              <div
                key={date}
                className={`analytics-day level-${item?.level ?? 0}`}
                title={`${date}: ${item?.focusMinutes ?? 0} phút, ${item?.sessions ?? 0} phiên`}
              >
                {Number(date.slice(-2))}
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-panel analytics-compare-panel">
          <div className="analytics-panel-header">
            <div>
              <h2>So với kỳ trước</h2>
              <span>Tổng hợp biến động chính</span>
            </div>
          </div>
          <div className="analytics-compare-grid">
            <StatCard
              label="Focus"
              value={`${compare?.focusMinutesDiff ?? 0}p`}
              detail={`${compare?.focusMinutesPercent ?? 0}%`}
              tone={(compare?.focusMinutesDiff ?? 0) >= 0 ? "green" : "red"}
            />
            <StatCard
              label="Sessions"
              value={`${compare?.sessionsDiff ?? 0}`}
              tone={(compare?.sessionsDiff ?? 0) >= 0 ? "green" : "red"}
            />
            <StatCard
              label="Violations"
              value={`${compare?.violationsDiff ?? 0}`}
              tone={(compare?.violationsDiff ?? 0) <= 0 ? "green" : "red"}
            />
            <StatCard
              label="Streak"
              value={`${summary?.currentStreakDays ?? 0} ngày`}
              detail={`Kỷ lục ${summary?.longestStreakDays ?? 0} ngày`}
              tone="blue"
            />
          </div>
        </article>
      </section>
    </div>
  );
}
