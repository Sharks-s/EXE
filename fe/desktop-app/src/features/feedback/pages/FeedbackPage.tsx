import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useFeedback } from "../hooks/useFeedback";
import type { UserFeedbackStatus, UserFeedbackType } from "../types/feedback.types";
import "./FeedbackPage.css";

const FEEDBACK_TYPES: Array<{
  type: UserFeedbackType;
  icon: string;
  descriptionKey: string;
}> = [
  {
    type: "GENERAL",
    icon: "chat_bubble",
    descriptionKey: "feedback.types.GENERAL.description",
  },
  {
    type: "BUG",
    icon: "bug_report",
    descriptionKey: "feedback.types.BUG.description",
  },
  {
    type: "FEATURE_REQUEST",
    icon: "add_circle",
    descriptionKey: "feedback.types.FEATURE_REQUEST.description",
  },
  {
    type: "UI_UX",
    icon: "palette",
    descriptionKey: "feedback.types.UI_UX.description",
  },
  {
    type: "PAYMENT",
    icon: "payments",
    descriptionKey: "feedback.types.PAYMENT.description",
  },
];

const formatDate = (value: string, language?: string) =>
  new Intl.DateTimeFormat(language?.startsWith("en") ? "en-US" : "vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function FeedbackPage() {
  const { i18n, t } = useTranslation("common");
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const {
    canSubmit,
    contentMaxLength,
    feedbacks,
    form,
    isLoading,
    isSubmitting,
    loadFeedbacks,
    setForm,
    setRating,
    setType,
    submitFeedback,
    titleMaxLength,
  } = useFeedback();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitFeedback();
  };

  const selectedType = FEEDBACK_TYPES.find((item) => item.type === form.type);
  const displayRating = hoverRating ?? form.rating ?? 0;
  const ratingPercent = displayRating ? `${(displayRating / 5) * 100}%` : "0%";
  const ratingStyle = {
    "--rating-percent": ratingPercent,
  } as CSSProperties;

  const getRatingFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      Math.max((event.clientX - rect.left) / rect.width, 0),
      1,
    );
    return Math.min(Math.max(Math.ceil(ratio * 10) / 2, 1), 5);
  };

  const handleRatingMove = (event: PointerEvent<HTMLDivElement>) => {
    const nextRating = getRatingFromPointer(event);
    setHoverRating((current) => (current === nextRating ? current : nextRating));
  };

  const handleRatingClick = (event: PointerEvent<HTMLDivElement>) => {
    setRating(getRatingFromPointer(event));
  };

  const getTypeLabel = (type: UserFeedbackType) =>
    t(`feedback.types.${type}.label`);
  const getStatusLabel = (status: UserFeedbackStatus) =>
    t(`feedback.status.${status}`);

  const statusCounts = useMemo(
    () =>
      feedbacks.reduce(
        (counts, item) => ({
          ...counts,
          [item.status]: counts[item.status] + 1,
        }),
        {
          NEW: 0,
          REVIEWING: 0,
          RESOLVED: 0,
          REJECTED: 0,
        },
      ),
    [feedbacks],
  );

  return (
    <div className="feedback-page">
      <main className="main-content">
        <header className="mobile-header">
          <span className="material-symbols-outlined mobile-menu-icon">menu</span>
          <h1>{t("feedback.title")}</h1>
          <div className="mobile-header-spacer" />
        </header>

        <div className="page-grid feedback-grid">
          <header className="app-page-header feedback-page-header grid-full">
            <div className="app-page-title">
              <div className="app-page-title-row">
                <span className="app-page-title-icon">
                  <span className="material-symbols-outlined">rate_review</span>
                </span>
                <h1>{t("feedback.title")}</h1>
              </div>
              <p>{t("feedback.subtitle")}</p>
            </div>
          </header>

          <section className="feedback-summary-card grid-full">
            <div className="feedback-summary-copy">
              <span className="feedback-kicker">{t("feedback.summary.kicker")}</span>
              <h2>{t("feedback.summary.title")}</h2>
              <p>{t("feedback.summary.description")}</p>
            </div>

            <div className="feedback-summary-stats" aria-label={t("feedback.summary.aria")}>
              <div>
                <strong>{feedbacks.length}</strong>
                <span>{t("feedback.summary.sent")}</span>
              </div>
              <div>
                <strong>{statusCounts.REVIEWING}</strong>
                <span>{t("feedback.summary.reviewing")}</span>
              </div>
              <div>
                <strong>{statusCounts.RESOLVED}</strong>
                <span>{t("feedback.summary.resolved")}</span>
              </div>
            </div>
          </section>

          <section className="feedback-panel feedback-compose-panel feedback-grid-left">
            <div className="feedback-section-heading">
              <span className="feedback-section-icon">
                <span className="material-symbols-outlined">edit_square</span>
              </span>
              <div>
                <h2>{t("feedback.compose.title")}</h2>
                <p>{t("feedback.compose.description")}</p>
              </div>
            </div>

            <div className="feedback-selected-type">
              <span className="material-symbols-outlined">
                {selectedType?.icon ?? "chat_bubble"}
              </span>
              <div>
                <strong>{getTypeLabel(form.type)}</strong>
                <p>{selectedType ? t(selectedType.descriptionKey) : ""}</p>
              </div>
            </div>

            <form className="feedback-form" onSubmit={handleSubmit}>
              <div className="feedback-type-grid">
                {FEEDBACK_TYPES.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className={`feedback-type-option ${
                      form.type === item.type ? "feedback-type-option-active" : ""
                    }`}
                    onClick={() => setType(item.type)}
                  >
                    <span className="feedback-type-icon material-symbols-outlined">
                      {item.icon}
                    </span>
                    <span>
                      <strong>{getTypeLabel(item.type)}</strong>
                      <small>{t(item.descriptionKey)}</small>
                    </span>
                  </button>
                ))}
              </div>

              <label className="feedback-field">
                <span>{t("feedback.form.title_label")}</span>
                <input
                  type="text"
                  maxLength={titleMaxLength}
                  placeholder={t("feedback.form.title_placeholder")}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="feedback-field">
                <span>{t("feedback.form.content_label")}</span>
                <textarea
                  maxLength={contentMaxLength}
                  rows={9}
                  placeholder={t("feedback.form.content_placeholder")}
                  value={form.content}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="feedback-rating-row">
                <div>
                  <strong>{t("feedback.form.rating_label")}</strong>
                  <small>
                    {displayRating
                      ? t("feedback.form.rating_value", {
                          rating: displayRating.toLocaleString(
                            i18n.language?.startsWith("en") ? "en-US" : "vi-VN",
                          ),
                        })
                      : t("feedback.form.rating_hint")}
                  </small>
                </div>
                <div className="feedback-rating-control" style={ratingStyle}>
                  <div
                    className="feedback-rating-stars"
                    role="radiogroup"
                    aria-label={t("feedback.form.rating_label")}
                    onPointerMove={handleRatingMove}
                    onPointerLeave={() => setHoverRating(null)}
                    onPointerDown={handleRatingClick}
                  >
                    <div className="feedback-rating-stars-base">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className="material-symbols-outlined icon-fill"
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <div className="feedback-rating-stars-fill">
                      <div className="feedback-rating-stars-fill-inner">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className="material-symbols-outlined icon-fill"
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="feedback-rating-hitboxes" aria-hidden="true">
                      {Array.from({ length: 10 }, (_, index) => (
                        <span key={index} />
                      ))}
                    </div>
                  </div>
                  {form.rating && (
                    <button
                      type="button"
                      className="feedback-rating-clear"
                      onClick={() => setRating(null)}
                    >
                      {t("feedback.form.clear_rating")}
                    </button>
                  )}
                </div>
              </div>

              <div className="feedback-form-actions">
                <div className="feedback-counter">
                  <span>
                    {t("feedback.form.title_counter", {
                      count: form.title.trim().length,
                      max: titleMaxLength,
                    })}
                  </span>
                  <span>
                    {t("feedback.form.content_counter", {
                      count: form.content.trim().length,
                      max: contentMaxLength,
                    })}
                  </span>
                </div>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? t("feedback.form.submitting") : t("feedback.form.submit")}
                </button>
              </div>
            </form>
          </section>

          <aside className="feedback-panel feedback-history-panel feedback-grid-right">
            <div className="feedback-section-heading feedback-history-heading">
              <span className="feedback-section-icon">
                <span className="material-symbols-outlined">history</span>
              </span>
              <div>
                <h2>{t("feedback.history.title")}</h2>
                <p>{t("feedback.history.description")}</p>
              </div>
              <button
                className="icon-button feedback-refresh-button"
                type="button"
                title={t("feedback.history.refresh")}
                onClick={() => void loadFeedbacks()}
                disabled={isLoading}
              >
                <span className="material-symbols-outlined">
                  {isLoading ? "sync" : "refresh"}
                </span>
              </button>
            </div>

            <div className="feedback-status-summary">
              {(["NEW", "REVIEWING", "RESOLVED", "REJECTED"] as const).map(
                (status) => (
                  <div
                    key={status}
                    className={`feedback-status-tile status-${status.toLowerCase()}`}
                  >
                    <strong>{statusCounts[status]}</strong>
                    <span>{getStatusLabel(status)}</span>
                  </div>
                ),
              )}
            </div>

            <div className="feedback-list">
              {isLoading && feedbacks.length === 0 ? (
                <div className="feedback-empty">
                  <span className="material-symbols-outlined">sync</span>
                  <p>{t("feedback.history.loading")}</p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="feedback-empty">
                  <span className="material-symbols-outlined">rate_review</span>
                  <p>{t("feedback.history.empty")}</p>
                </div>
              ) : (
                feedbacks.map((item) => (
                  <article className="feedback-item" key={item.id}>
                    <div className="feedback-item-header">
                      <span className={`feedback-status status-${item.status.toLowerCase()}`}>
                        {getStatusLabel(item.status)}
                      </span>
                      <small>{formatDate(item.createdAt, i18n.language)}</small>
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.content}</p>
                    <div className="feedback-item-meta">
                      <span>
                        <span className="material-symbols-outlined">
                          {FEEDBACK_TYPES.find((type) => type.type === item.type)?.icon}
                        </span>
                        {getTypeLabel(item.type)}
                      </span>
                      {item.rating && (
                        <span>
                          <span className="material-symbols-outlined icon-fill">star</span>
                          {t("feedback.form.rating_value", { rating: item.rating })}
                        </span>
                      )}
                    </div>
                    {item.adminReply && (
                      <div className="feedback-admin-reply">
                        <strong>{t("feedback.history.admin_reply")}</strong>
                        <p>{item.adminReply}</p>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

