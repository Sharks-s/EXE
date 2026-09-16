import type { ReviewedSession } from "../utils/sessionReview.utils";

type SessionHistoryLaunchCardProps = {
  title: string;
  subtitle: string;
  averageScoreLabel: string;
  loadingLabel: string;
  emptyLabel: string;
  noGoalLabel: string;
  openLabel: string;
  reviewedSessions: ReviewedSession[];
  averageReviewScore: number;
  isLoading: boolean;
  onOpen: () => void;
};

export function SessionHistoryLaunchCard({
  title,
  subtitle,
  averageScoreLabel,
  loadingLabel,
  emptyLabel,
  noGoalLabel,
  openLabel,
  reviewedSessions,
  averageReviewScore,
  isLoading,
  onOpen,
}: SessionHistoryLaunchCardProps) {
  return (
    <article className="info-card history-launch-card">
      <button className="history-launch-button" type="button" onClick={onOpen}>
        <div className="session-review-header compact">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <div className="average-score">
            <strong>{isLoading ? "..." : averageReviewScore}</strong>
            <span>{averageScoreLabel}</span>
          </div>
        </div>

        <div className="history-preview-list">
          {isLoading ? (
            <p className="empty-copy">{loadingLabel}</p>
          ) : reviewedSessions.length ? (
            reviewedSessions.slice(0, 3).map(({ session, review }) => (
              <div className="history-preview-row" key={session.id}>
                <span>{session.goal || noGoalLabel}</span>
                <strong>{review.score}</strong>
              </div>
            ))
          ) : (
            <p className="empty-copy">{emptyLabel}</p>
          )}
        </div>

        <div className="history-launch-footer">
          <span>{openLabel}</span>
          <span className="material-symbols-outlined">open_in_new</span>
        </div>
      </button>
    </article>
  );
}
