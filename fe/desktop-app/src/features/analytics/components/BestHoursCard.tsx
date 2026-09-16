import type { HourlyAnalyticsItem } from "../types/analytics.types";

type BestHoursCardProps = {
  title: string;
  optimalLabel: string;
  goodLabel: string;
  items: HourlyAnalyticsItem[];
  fallbackBestHour: number | null;
  formatHourRange: (hour: number | null) => string;
};

export function BestHoursCard({
  title,
  optimalLabel,
  goodLabel,
  items,
  fallbackBestHour,
  formatHourRange,
}: BestHoursCardProps) {
  const displayItems = items.length ? items : [{ hour: fallbackBestHour, focusMinutes: 0, sessions: 0 }];

  return (
    <article className="info-card">
      <h2>{title}</h2>
      {displayItems.map((item, index) => (
        <div className="progress-group" key={`${item.hour}-${index}`}>
          <div className="progress-row">
            <span>{formatHourRange(item.hour)}</span>
            <strong>{index === 0 ? optimalLabel : goodLabel}</strong>
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
  );
}
