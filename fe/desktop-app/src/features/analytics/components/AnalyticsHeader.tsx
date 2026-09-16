import type { AnalyticsRange } from "../types/analytics.types";
import type { RangeOption } from "../types/analyticsPage.types";

type AnalyticsHeaderProps = {
  title: string;
  subtitle: string;
  timeFilterLabel: string;
  range: AnalyticsRange;
  rangeLabels: RangeOption[];
  onRangeChange: (range: AnalyticsRange) => void;
};

export function AnalyticsHeader({
  title,
  subtitle,
  timeFilterLabel,
  range,
  rangeLabels,
  onRangeChange,
}: AnalyticsHeaderProps) {
  return (
    <header className="page-header app-page-header">
      <div className="app-page-title">
        <div className="app-page-title-row">
          <span className="app-page-title-icon">
            <span className="material-symbols-outlined">query_stats</span>
          </span>
          <h1>{title}</h1>
        </div>
        <p>{subtitle}</p>
      </div>

      <div className="time-tabs app-page-actions" role="tablist" aria-label={timeFilterLabel}>
        {rangeLabels.map((item) => (
          <button
            key={item.range}
            type="button"
            className={`time-tab-btn ${range === item.range ? "active" : ""}`}
            onClick={() => onRangeChange(item.range)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
