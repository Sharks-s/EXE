import type { StatCardData } from "../types/analyticsPage.types";

type StatCardsProps = {
  stats: StatCardData[];
  isLoading: boolean;
};

export function StatCards({ stats, isLoading }: StatCardsProps) {
  return (
    <>
      {stats.map((stat) => (
        <article className={`stat-card stat-${stat.tone}`} key={stat.title}>
          <div className="stat-top">
            <div className={`stat-icon ${stat.tone}`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <span className={`trend-badge ${stat.trend}`}>
              {stat.trendIcon && <span className="material-symbols-outlined">{stat.trendIcon}</span>}
              {stat.change}
            </span>
          </div>
          <div>
            <h3>{stat.title}</h3>
            <p>{isLoading ? "..." : stat.value}</p>
          </div>
        </article>
      ))}
    </>
  );
}
