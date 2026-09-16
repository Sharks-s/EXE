import type { ReviewedSession } from "../utils/sessionReview.utils";
import { getSessionMinutes, getSessionStatusIcon } from "../utils/sessionReview.utils";

type SessionReviewCardProps = {
  title: string;
  subtitle: string;
  averageScoreLabel: string;
  loadingLabel: string;
  emptyLabel: string;
  noGoalLabel: string;
  sessionCompletionLabel: (percent: number) => string;
  reviewedSessions: ReviewedSession[];
  averageReviewScore: number;
  isLoading: boolean;
  formatMinutes: (minutes: number | undefined) => string;
};

export function SessionReviewCard({
  title,
  subtitle,
  averageScoreLabel,
  loadingLabel,
  emptyLabel,
  noGoalLabel,
  sessionCompletionLabel,
  reviewedSessions,
  averageReviewScore,
  isLoading,
  formatMinutes,
}: SessionReviewCardProps) {
  return (
    <article className="info-card session-review-card">
      <div className="session-review-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="average-score">
          <strong>{isLoading ? "..." : averageReviewScore}</strong>
          <span>{averageScoreLabel}</span>
        </div>
      </div>

      <div className="session-review-list">
        {isLoading ? (
          <p className="empty-copy">{loadingLabel}</p>
        ) : reviewedSessions.length ? (
          reviewedSessions.map(({ session, review }) => (
            <div className="analytics-session-row" key={session.id}>
              <div className={`analytics-session-icon status-${session.status.toLowerCase()}`}>
                <span className="material-symbols-outlined">{getSessionStatusIcon(session.status)}</span>
              </div>
              <div className="analytics-session-main">
                <h3>{session.goal || noGoalLabel}</h3>
                <p>
                  {formatMinutes(getSessionMinutes(session))} • {sessionCompletionLabel(review.completionRate)}
                </p>
                <div className="analytics-score-track">
                  <span style={{ width: `${review.score}%` }} />
                </div>
              </div>
              <div className={`analytics-session-score grade-${review.grade.toLowerCase()}`}>
                <strong>{review.score}</strong>
                <span>{review.grade}</span>
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
