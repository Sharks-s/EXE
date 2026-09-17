import type { FocusSessionResponse } from "@/features/focus-session/types/focus.types";
import type { ReviewedSession, SessionReview } from "../utils/sessionReview.utils";
import { getSessionMinutes, getSessionStatusIcon } from "../utils/sessionReview.utils";

type SessionHistoryModalProps = {
  closeLabel: string;
  title: string;
  popupTitle: string;
  kicker: string;
  noGoalLabel: string;
  loadingLabel: string;
  emptyLabel: string;
  selectHint: string;
  completionLabel: string;
  actualTimeLabel: string;
  penaltiesLabel: string;
  xpLabel: string;
  strengthTitle: string;
  strengthCleanLabel: string;
  improveTitle: string;
  violationTitle: string;
  reviewedSessions: ReviewedSession[];
  selectedSession: FocusSessionResponse | null;
  selectedReview: SessionReview | null;
  isLoading: boolean;
  onSelectSession: (session: FocusSessionResponse) => void;
  onClose: () => void;
  formatMinutes: (minutes: number | undefined) => string;
  sessionCompletionLabel: (percent: number) => string;
  gradeLabel: (grade: string) => string;
  gradeMessage: (grade: string) => string;
  strengthProgressLabel: (count: number) => string;
  improveKeepLabel: string;
  improveCompletionLabel: (percent: number) => string;
  violationLabel: (type: string) => string;
};

export function SessionHistoryModal({
  closeLabel,
  title,
  popupTitle,
  kicker,
  noGoalLabel,
  loadingLabel,
  emptyLabel,
  selectHint,
  completionLabel,
  actualTimeLabel,
  penaltiesLabel,
  xpLabel,
  strengthTitle,
  strengthCleanLabel,
  improveTitle,
  violationTitle,
  reviewedSessions,
  selectedSession,
  selectedReview,
  isLoading,
  onSelectSession,
  onClose,
  formatMinutes,
  sessionCompletionLabel,
  gradeLabel,
  gradeMessage,
  strengthProgressLabel,
  improveKeepLabel,
  improveCompletionLabel,
  violationLabel,
}: SessionHistoryModalProps) {
  const selectedViolations = selectedSession?.violations ?? [];
  const selectedPenaltyCount = selectedViolations.filter((violation) => violation.minutesDeducted > 0).length;

  return (
    <div className="analytics-history-overlay" role="dialog" aria-modal="true">
      <div className="analytics-history-modal">
        <button className="analytics-history-close" type="button" aria-label={closeLabel} onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="analytics-history-list-panel">
          <div className="analytics-history-modal-header">
            <span>{title}</span>
            <h2>{popupTitle}</h2>
          </div>

          <div className="analytics-history-list">
            {isLoading ? (
              <p className="empty-copy">{loadingLabel}</p>
            ) : reviewedSessions.length ? (
              reviewedSessions.map(({ session, review }) => (
                <button
                  className={`analytics-history-list-item ${
                    selectedSession?.id === session.id ? "active" : ""
                  }`}
                  key={session.id}
                  type="button"
                  onClick={() => onSelectSession(session)}
                >
                  <span className={`analytics-session-icon status-${session.status.toLowerCase()}`}>
                    <span className="material-symbols-outlined">{getSessionStatusIcon(session.status)}</span>
                  </span>
                  <span className="history-list-copy">
                    <strong>{session.goal || noGoalLabel}</strong>
                    <small>
                      {formatMinutes(getSessionMinutes(session))} • {sessionCompletionLabel(review.completionRate)}
                    </small>
                  </span>
                  <span className={`analytics-session-score grade-${review.grade.toLowerCase()}`}>
                    <strong>{review.score}</strong>
                    <span>{review.grade}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="empty-copy">{emptyLabel}</p>
            )}
          </div>
        </div>

        <div className="analytics-history-detail-panel">
          {selectedSession && selectedReview ? (
            <>
              <div className="history-detail-header">
                <div>
                  <span>{kicker}</span>
                  <h2>{selectedSession.goal || noGoalLabel}</h2>
                </div>
                <div className={`detail-score grade-${selectedReview.grade.toLowerCase()}`}>
                  <strong>{selectedReview.score}</strong>
                  <span>{selectedReview.grade}</span>
                </div>
              </div>

              <div className="history-detail-grade">
                <strong>{gradeLabel(selectedReview.grade)}</strong>
                <p>{gradeMessage(selectedReview.grade.toLowerCase())}</p>
              </div>

              <div className="history-detail-stats">
                <div>
                  <span className="material-symbols-outlined">task_alt</span>
                  <small>{completionLabel}</small>
                  <strong>{selectedReview.completionRate}%</strong>
                </div>
                <div>
                  <span className="material-symbols-outlined">timer</span>
                  <small>{actualTimeLabel}</small>
                  <strong>{formatMinutes(getSessionMinutes(selectedSession))}</strong>
                </div>
                <div>
                  <span className="material-symbols-outlined">warning</span>
                  <small>{penaltiesLabel}</small>
                  <strong>{selectedPenaltyCount}</strong>
                </div>
                <div>
                  <span className="material-symbols-outlined">stars</span>
                  <small>{xpLabel}</small>
                  <strong>{(selectedSession.accumulatedReward ?? 0) * 60}</strong>
                </div>
              </div>

              <div className="history-detail-feedback">
                <div>
                  <h3>{strengthTitle}</h3>
                  <p>
                    {selectedPenaltyCount === 0
                      ? strengthCleanLabel
                      : strengthProgressLabel(selectedPenaltyCount)}
                  </p>
                </div>
                <div>
                  <h3>{improveTitle}</h3>
                  <p>
                    {selectedReview.completionRate >= 90
                      ? improveKeepLabel
                      : improveCompletionLabel(selectedReview.completionRate)}
                  </p>
                </div>
              </div>

              {selectedViolations.length > 0 && (
                <div className="history-detail-violations">
                  <h3>{violationTitle}</h3>
                  <div>
                    {selectedViolations.map((violation, index) => (
                      <span key={`${violation.type}-${violation.occurredAt}-${index}`}>
                        {violationLabel(violation.type)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="history-detail-empty">{selectHint}</div>
          )}
        </div>
      </div>
    </div>
  );
}
