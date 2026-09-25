import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
} from "react";
import { useFeedback } from "../hooks/useFeedback";
import {
  feedbackStatusLabel,
  feedbackTypeLabel,
  type UserFeedbackType,
} from "../types/feedback.types";
import "./FeedbackPage.css";

const FEEDBACK_TYPES: Array<{
  type: UserFeedbackType;
  icon: string;
  description: string;
}> = [
  {
    type: "GENERAL",
    icon: "chat_bubble",
    description: "Chia sẻ cảm nhận hoặc góp ý chung.",
  },
  {
    type: "BUG",
    icon: "bug_report",
    description: "Báo lỗi khi app hoạt động sai.",
  },
  {
    type: "FEATURE_REQUEST",
    icon: "add_circle",
    description: "Đề xuất thứ bạn muốn có thêm.",
  },
  {
    type: "UI_UX",
    icon: "palette",
    description: "Góp ý giao diện và trải nghiệm.",
  },
  {
    type: "PAYMENT",
    icon: "payments",
    description: "Vấn đề gói Pro hoặc thanh toán.",
  },
];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function FeedbackPage() {
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
          <h1>User Feedback</h1>
          <div className="mobile-header-spacer" />
        </header>

        <div className="page-grid feedback-grid">
          <header className="app-page-header feedback-page-header grid-full">
            <div className="app-page-title">
              <div className="app-page-title-row">
                <span className="app-page-title-icon">
                  <span className="material-symbols-outlined">rate_review</span>
                </span>
                <h1>User Feedback</h1>
              </div>
              <p>
                Gửi góp ý, báo lỗi hoặc đề xuất tính năng để cải thiện
                FocusBuddy.
              </p>
            </div>
          </header>

          <section className="feedback-summary-card grid-full">
            <div className="feedback-summary-copy">
              <span className="feedback-kicker">Trung tâm phản hồi</span>
              <h2>Giúp FocusBuddy tốt hơn sau mỗi phiên học</h2>
              <p>
                Mỗi phản hồi đều được lưu lại để đội ngũ theo dõi, phân loại và
                xử lý đúng vấn đề bạn gặp phải.
              </p>
            </div>

            <div className="feedback-summary-stats" aria-label="Tổng quan feedback">
              <div>
                <strong>{feedbacks.length}</strong>
                <span>Đã gửi</span>
              </div>
              <div>
                <strong>{statusCounts.REVIEWING}</strong>
                <span>Đang xem xét</span>
              </div>
              <div>
                <strong>{statusCounts.RESOLVED}</strong>
                <span>Đã xử lý</span>
              </div>
            </div>
          </section>

          <section className="feedback-panel feedback-compose-panel feedback-grid-left">
            <div className="feedback-section-heading">
              <span className="feedback-section-icon">
                <span className="material-symbols-outlined">edit_square</span>
              </span>
              <div>
                <h2>Gửi feedback mới</h2>
                <p>Mô tả rõ vấn đề để tụi mình xử lý nhanh hơn.</p>
              </div>
            </div>

            <div className="feedback-selected-type">
              <span className="material-symbols-outlined">
                {selectedType?.icon ?? "chat_bubble"}
              </span>
              <div>
                <strong>{feedbackTypeLabel[form.type]}</strong>
                <p>{selectedType?.description}</p>
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
                      <strong>{feedbackTypeLabel[item.type]}</strong>
                      <small>{item.description}</small>
                    </span>
                  </button>
                ))}
              </div>

              <label className="feedback-field">
                <span>Tiêu đề</span>
                <input
                  type="text"
                  maxLength={titleMaxLength}
                  placeholder="Ví dụ: Cần thêm thông báo khi kết thúc phiên"
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
                <span>Nội dung</span>
                <textarea
                  maxLength={contentMaxLength}
                  rows={9}
                  placeholder="Nhập chi tiết feedback của bạn..."
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
                  <strong>Mức hài lòng</strong>
                  <small>
                    {displayRating
                      ? `${displayRating.toLocaleString("vi-VN")}/5 điểm`
                      : "Không bắt buộc, nhưng rất hữu ích."}
                  </small>
                </div>
                <div className="feedback-rating-control" style={ratingStyle}>
                  <div
                    className="feedback-rating-stars"
                    role="radiogroup"
                    aria-label="Mức hài lòng"
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
                      Bỏ đánh giá
                    </button>
                  )}
                </div>
              </div>

              <div className="feedback-form-actions">
                <div className="feedback-counter">
                  <span>{form.title.trim().length}/{titleMaxLength} tiêu đề</span>
                  <span>
                    {form.content.trim().length}/{contentMaxLength} nội dung
                  </span>
                </div>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi feedback"}
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
                <h2>Lịch sử feedback</h2>
                <p>Theo dõi các góp ý bạn đã gửi.</p>
              </div>
              <button
                className="icon-button feedback-refresh-button"
                type="button"
                title="Tải lại"
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
                    <span>{feedbackStatusLabel[status]}</span>
                  </div>
                ),
              )}
            </div>

            <div className="feedback-list">
              {isLoading && feedbacks.length === 0 ? (
                <div className="feedback-empty">
                  <span className="material-symbols-outlined">sync</span>
                  <p>Đang tải feedback...</p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="feedback-empty">
                  <span className="material-symbols-outlined">rate_review</span>
                  <p>Bạn chưa gửi feedback nào.</p>
                </div>
              ) : (
                feedbacks.map((item) => (
                  <article className="feedback-item" key={item.id}>
                    <div className="feedback-item-header">
                      <span className={`feedback-status status-${item.status.toLowerCase()}`}>
                        {feedbackStatusLabel[item.status]}
                      </span>
                      <small>{formatDate(item.createdAt)}</small>
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.content}</p>
                    <div className="feedback-item-meta">
                      <span>
                        <span className="material-symbols-outlined">
                          {FEEDBACK_TYPES.find((type) => type.type === item.type)?.icon}
                        </span>
                        {feedbackTypeLabel[item.type]}
                      </span>
                      {item.rating && (
                        <span>
                          <span className="material-symbols-outlined icon-fill">star</span>
                          {item.rating}/5 điểm
                        </span>
                      )}
                    </div>
                    {item.adminReply && (
                      <div className="feedback-admin-reply">
                        <strong>Phản hồi từ admin</strong>
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
