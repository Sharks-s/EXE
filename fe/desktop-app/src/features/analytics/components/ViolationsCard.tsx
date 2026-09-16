import type { AnalyticsViolationType, ViolationAnalytics } from "../types/analytics.types";

type ViolationsCardProps = {
  title: string;
  penaltyLabel: string;
  emptyViolationLabel: string;
  topAppsTitle: string;
  emptyAppLabel: string;
  violationLabels: Record<AnalyticsViolationType, string>;
  items: ViolationAnalytics["byType"];
  topApps: ViolationAnalytics["topApps"];
  minutesDeductedLabel: (minutes: number) => string;
};

export function ViolationsCard({
  title,
  penaltyLabel,
  emptyViolationLabel,
  topAppsTitle,
  emptyAppLabel,
  violationLabels,
  items,
  topApps,
  minutesDeductedLabel,
}: ViolationsCardProps) {
  return (
    <article className="info-card violations-card">
      <div className="violation-header">
        <h2>{title}</h2>
        <span>{penaltyLabel}</span>
      </div>
      <div className="violation-list">
        {items.length ? (
          items.map((item) => (
            <div className="violation-item" key={item.type}>
              <div>
                <h3>{violationLabels[item.type as AnalyticsViolationType] ?? item.type}</h3>
                <p>{minutesDeductedLabel(item.minutesDeducted)}</p>
              </div>
              <strong>{item.count}</strong>
            </div>
          ))
        ) : (
          <p className="empty-copy">{emptyViolationLabel}</p>
        )}
      </div>

      <div className="top-apps">
        <h3>{topAppsTitle}</h3>
        {topApps.length ? (
          topApps.map((app) => (
            <div className="top-app-row" key={app.appName}>
              <span>{app.appName}</span>
              <strong>{app.count}</strong>
            </div>
          ))
        ) : (
          <p className="empty-copy">{emptyAppLabel}</p>
        )}
      </div>
    </article>
  );
}
