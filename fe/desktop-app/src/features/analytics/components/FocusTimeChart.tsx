import type { FocusTimeItem } from "../types/analytics.types";
import type { SVGChartPath } from "../types/analyticsPage.types";

type FocusTimeChartProps = {
  title: string;
  bestDayPrefix: string;
  noDataLabel: string;
  noFocusDataLabel: string;
  chartItems: FocusTimeItem[];
  chartPath: SVGChartPath | null;
  bestFocusItem: FocusTimeItem | null;
  formatChartLabel: (dateValue: string) => string;
  formatMinutes: (minutes: number | undefined) => string;
};

export function FocusTimeChart({
  title,
  bestDayPrefix,
  noDataLabel,
  noFocusDataLabel,
  chartItems,
  chartPath,
  bestFocusItem,
  formatChartLabel,
  formatMinutes,
}: FocusTimeChartProps) {
  return (
    <article className="focus-chart-card">
      <div className="card-header">
        <h2>{title}</h2>
        <div className="best-day-badge">
          <span className="material-symbols-outlined">star</span>
          <span>
            {bestDayPrefix}{" "}
            {bestFocusItem
              ? `${formatChartLabel(bestFocusItem.date)} (${formatMinutes(bestFocusItem.focusMinutes)})`
              : noDataLabel}
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
          <div className="chart-empty">{noFocusDataLabel}</div>
        )}

        <div className="chart-labels">
          {chartItems.map((item) => (
            <span key={item.date}>{formatChartLabel(item.date)}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
