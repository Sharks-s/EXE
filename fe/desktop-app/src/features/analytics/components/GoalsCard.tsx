import type { GoalAnalyticsItem } from "../types/analytics.types";

type GoalsCardProps = {
  title: string;
  emptyLabel: string;
  items: GoalAnalyticsItem[];
  sessionsCountLabel: (count: number) => string;
  formatMinutes: (minutes: number | undefined) => string;
};

export function GoalsCard({ title, emptyLabel, items, sessionsCountLabel, formatMinutes }: GoalsCardProps) {
  return (
    <article className="info-card">
      <h2>{title}</h2>
      <div className="goal-list">
        {items.length ? (
          items.map((goal, index) => (
            <div className="goal-item" key={goal.goal}>
              <div>
                <h3>{goal.goal}</h3>
                <p>
                  {formatMinutes(goal.focusMinutes)} • {sessionsCountLabel(goal.sessions)}
                </p>
              </div>
              <div className={`goal-ring ${index === 0 ? "primary" : "secondary"}`}>
                {Math.round(goal.completionRate)}%
              </div>
            </div>
          ))
        ) : (
          <p className="empty-copy">{emptyLabel}</p>
        )}
      </div>
    </article>
  );
}
