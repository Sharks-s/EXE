import type { CalendarHeatmapItem } from "../types/analytics.types";

type HeatmapCardProps = {
  title: string;
  monthSelectLabel: string;
  prevMonthLabel: string;
  nextMonthLabel: string;
  gridLabel: string;
  lowLabel: string;
  highLabel: string;
  footer: string;
  calendarMonthLabel: string;
  weekdayLabels: string[];
  heatmapLevels: CalendarHeatmapItem["level"][];
  canGoNextCalendarMonth: boolean;
  onChangeCalendarMonth: (offset: number) => void;
};

export function HeatmapCard({
  title,
  monthSelectLabel,
  prevMonthLabel,
  nextMonthLabel,
  gridLabel,
  lowLabel,
  highLabel,
  footer,
  calendarMonthLabel,
  weekdayLabels,
  heatmapLevels,
  canGoNextCalendarMonth,
  onChangeCalendarMonth,
}: HeatmapCardProps) {
  return (
    <article className="heatmap-card">
      <div className="heatmap-header">
        <h2>{title}</h2>
        <div className="calendar-controls" aria-label={monthSelectLabel}>
          <button type="button" aria-label={prevMonthLabel} onClick={() => onChangeCalendarMonth(-1)}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span>{calendarMonthLabel}</span>
          <button
            type="button"
            aria-label={nextMonthLabel}
            disabled={!canGoNextCalendarMonth}
            onClick={() => onChangeCalendarMonth(1)}
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
        <div className="heatmap-grid" aria-label={gridLabel}>
          {heatmapLevels.map((level, index) => (
            <span key={index} className={`heatmap-cell level-${level}`} />
          ))}
        </div>
      </div>

      <div className="heatmap-legend">
        <span>{lowLabel}</span>
        <div className="legend-cells">
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`heatmap-cell level-${level}`} />
          ))}
        </div>
        <span>{highLabel}</span>
      </div>
      <p>{footer}</p>
    </article>
  );
}
