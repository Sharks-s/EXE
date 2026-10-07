import { useEffect, useMemo } from "react";
import { useCurrentPlan } from "@/features/upgrade/hooks/useCurrentPlan";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { BestHoursCard } from "../components/BestHoursCard";
import { FocusTimeChart } from "../components/FocusTimeChart";
import { GoalsCard } from "../components/GoalsCard";
import { HeatmapCard } from "../components/HeatmapCard";
import { SessionHistoryLaunchCard } from "../components/SessionHistoryLaunchCard";
import { SessionHistoryModal } from "../components/SessionHistoryModal";
import { SessionReviewCard } from "../components/SessionReviewCard";
import { StatCards } from "../components/StatCards";
import { ViolationsCard } from "../components/ViolationsCard";
import { useAnalyticsPageModel } from "../hooks/useAnalyticsPageModel";
import { getSessionMinutes } from "../utils/sessionReview.utils";
import "./AnalyticsPage.css";

type ProLockedCardProps = {
  title: string;
  description: string;
};

function ProLockedCard({ title, description }: ProLockedCardProps) {
  return (
    <article className="info-card pro-locked-card">
      <div className="pro-locked-icon">
        <span className="material-symbols-outlined">lock</span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <span className="pro-locked-badge">Pro</span>
    </article>
  );
}

export default function AnalyticsPage() {
  const {
    t,
    analytics,
    rangeLabels,
    stats,
    chartItems,
    chartPath,
    bestFocusItem,
    heatmapLevels,
    calendarMonthLabel,
    weekdayLabels,
    topHourlyItems,
    goalItems,
    violationItems,
    violationLabels,
    topApps,
    reviewedSessions,
    averageReviewScore,
    selectedHistorySession,
    selectedReview,
    isSessionHistoryLoading,
    isHistoryPopupOpen,
    setSelectedHistorySession,
    setIsHistoryPopupOpen,
    openHistoryPopup,
    formatMinutes,
    formatHourRange,
    formatChartLabel,
  } = useAnalyticsPageModel();
  const { isProActive } = useCurrentPlan();

  const freeRangeLabels = useMemo(
    () => rangeLabels.filter((item) => item.range === "DAY" || item.range === "WEEK"),
    [rangeLabels],
  );
  const displayedRangeLabels = isProActive ? rangeLabels : freeRangeLabels;
  const displayedStats = useMemo(
    () =>
      isProActive
        ? stats
        : stats.filter((stat) => stat.icon !== "warning").map((stat) => ({
            ...stat,
            change: stat.icon === "local_fire_department" ? stat.change : "",
            trendIcon: undefined,
            trend: "neutral" as const,
          })),
    [isProActive, stats],
  );

  useEffect(() => {
    if (!isProActive && analytics.range !== "DAY" && analytics.range !== "WEEK") {
      analytics.setRange("WEEK");
    }
  }, [analytics, isProActive]);

  const sessionCompletionLabel = (percent: number) =>
    t("analytics.session_completion", {
      defaultValue: "{{percent}}% hoan thanh",
      percent,
    });

  return (
    <div className={`statistics-page ${isProActive ? "analytics-pro" : "analytics-free"}`}>
      <main className="statistics-main">
        <AnalyticsHeader
          title={t("analytics.page_title", { defaultValue: "Phan tich hieu suat" })}
          subtitle={t("analytics.page_subtitle", {
            defaultValue: "Theo doi tien do va toi uu hoa thoi gian tap trung",
          })}
          timeFilterLabel={t("analytics.time_filter_label", { defaultValue: "Bo loc thoi gian" })}
          range={analytics.range}
          rangeLabels={displayedRangeLabels}
          onRangeChange={analytics.setRange}
        />

        <section
          className="bento-grid"
          aria-label={t("analytics.overview_label", { defaultValue: "Thong ke tong quan" })}
        >
          <StatCards stats={displayedStats} isLoading={analytics.isLoading} />

          <FocusTimeChart
            title={t("analytics.focus_time_title", { defaultValue: "Thoi gian tap trung" })}
            bestDayPrefix={t("analytics.best_day_prefix", { defaultValue: "Cao nhat:" })}
            noDataLabel={t("analytics.no_data", { defaultValue: "Chua co du lieu" })}
            noFocusDataLabel={t("analytics.no_focus_data", {
              defaultValue: "Chua co du lieu tap trung.",
            })}
            chartItems={chartItems}
            chartPath={chartPath}
            bestFocusItem={bestFocusItem}
            formatChartLabel={formatChartLabel}
            formatMinutes={formatMinutes}
          />

          {isProActive ? (
            <HeatmapCard
              title={t("analytics.heatmap_title", { defaultValue: "Tan suat tap trung" })}
              monthSelectLabel={t("analytics.heatmap_month_select", {
                defaultValue: "Chon thang tan suat tap trung",
              })}
              prevMonthLabel={t("analytics.prev_month", { defaultValue: "Thang truoc" })}
              nextMonthLabel={t("analytics.next_month", { defaultValue: "Thang sau" })}
              gridLabel={t("analytics.heatmap_grid_label", { defaultValue: "Tan suat tap trung" })}
              lowLabel={t("analytics.legend_low", { defaultValue: "It" })}
              highLabel={t("analytics.legend_high", { defaultValue: "Nhieu" })}
              footer={t("analytics.heatmap_footer", {
                defaultValue:
                  "Dua tren lich tap trung cua {{month}}. Mau cang dam nghia la thoi gian tap trung cang cao.",
                month: calendarMonthLabel,
              })}
              calendarMonthLabel={calendarMonthLabel}
              weekdayLabels={weekdayLabels}
              heatmapLevels={heatmapLevels}
              canGoNextCalendarMonth={analytics.canGoNextCalendarMonth}
              onChangeCalendarMonth={analytics.changeCalendarMonth}
            />
          ) : (
            <ProLockedCard
              title={t("analytics.heatmap_title", { defaultValue: "Tan suat tap trung" })}
              description="Nâng cấp Pro để xem heatmap theo tháng và nhận diện nhịp tập trung dài hạn."
            />
          )}
        </section>

        <section
          className="bottom-grid"
          aria-label={t("analytics.additional_info_label", { defaultValue: "Thong tin bo sung" })}
        >
          <SessionReviewCard
            title={t("analytics.session_review_title", {
              defaultValue: "Danh gia phien gan day",
            })}
            subtitle={t("analytics.session_review_subtitle", {
              defaultValue: "Tong hop chat luong cac phien moi nhat",
            })}
            averageScoreLabel={t("analytics.average_score", { defaultValue: "diem TB" })}
            loadingLabel={t("focusSession.setup.history_loading", {
              defaultValue: "Dang tai lich su phien...",
            })}
            emptyLabel={t("analytics.no_session_review_data", {
              defaultValue: "Chua co phien nao de danh gia.",
            })}
            noGoalLabel={t("focusSession.summary.no_goal")}
            sessionCompletionLabel={sessionCompletionLabel}
            reviewedSessions={reviewedSessions}
            averageReviewScore={averageReviewScore}
            isLoading={isSessionHistoryLoading}
            formatMinutes={formatMinutes}
          />

          {isProActive ? (
            <>
              <BestHoursCard
                title={t("analytics.best_hours_title", { defaultValue: "Gio hieu qua nhat" })}
                optimalLabel={t("analytics.rank_optimal", { defaultValue: "Toi uu" })}
                goodLabel={t("analytics.rank_good", { defaultValue: "Kha" })}
                items={topHourlyItems}
                fallbackBestHour={analytics.hourly?.bestHour ?? null}
                formatHourRange={formatHourRange}
              />

              <GoalsCard
                title={t("analytics.current_goals_title", { defaultValue: "Muc tieu hien tai" })}
                emptyLabel={t("analytics.no_goal_data", { defaultValue: "Chua co du lieu muc tieu." })}
                items={goalItems}
                sessionsCountLabel={(count) =>
                  t("analytics.sessions_count", {
                    defaultValue: "{{count}} phien",
                    count,
                  })
                }
                formatMinutes={formatMinutes}
              />

              <SessionHistoryLaunchCard
                title={t("analytics.session_history_title", { defaultValue: "Lich su phien" })}
                subtitle={t("analytics.session_history_subtitle", {
                  defaultValue: "Xem lai diem va danh gia tung phien",
                })}
                averageScoreLabel={t("analytics.average_score", { defaultValue: "diem TB" })}
                loadingLabel={t("focusSession.setup.history_loading", {
                  defaultValue: "Dang tai lich su phien...",
                })}
                emptyLabel={t("analytics.no_session_review_data", {
                  defaultValue: "Chua co phien nao de danh gia.",
                })}
                noGoalLabel={t("focusSession.summary.no_goal")}
                openLabel={t("analytics.open_session_history", { defaultValue: "Mo lich su" })}
                reviewedSessions={reviewedSessions}
                averageReviewScore={averageReviewScore}
                isLoading={isSessionHistoryLoading}
                onOpen={openHistoryPopup}
              />

              <ViolationsCard
                title={t("analytics.violation_detail_title", {
                  defaultValue: "Chi tiet so lan mat tap trung",
                })}
                penaltyLabel={t("analytics.penalty_minutes", {
                  defaultValue: "{{minutes}} bi phat",
                  minutes: formatMinutes(analytics.violations?.penaltyMinutes),
                })}
                emptyViolationLabel={t("analytics.no_violation_data", {
                  defaultValue: "Chua co vi pham nao.",
                })}
                topAppsTitle={t("analytics.top_apps_title", { defaultValue: "Ung dung gay xao nhang" })}
                emptyAppLabel={t("analytics.no_app_data", { defaultValue: "Chua co du lieu ung dung." })}
                violationLabels={violationLabels}
                items={violationItems}
                topApps={topApps}
                minutesDeductedLabel={(minutes) =>
                  t("analytics.minutes_deducted", {
                    defaultValue: "{{minutes}} phut bi tru",
                    minutes,
                  })
                }
              />
            </>
          ) : (
            <>
              <article className="info-card basic-history-card">
                <h2>{t("analytics.session_history_title", { defaultValue: "Lich su phien" })}</h2>
                <div className="basic-history-list">
                  {isSessionHistoryLoading ? (
                    <p className="empty-copy">
                      {t("focusSession.setup.history_loading", {
                        defaultValue: "Dang tai lich su phien...",
                      })}
                    </p>
                  ) : reviewedSessions.length ? (
                    reviewedSessions.slice(0, 3).map(({ session }) => (
                      <div className="basic-history-row" key={session.id}>
                        <div>
                          <strong>{session.goal || t("focusSession.summary.no_goal")}</strong>
                          <span>{formatMinutes(getSessionMinutes(session))}</span>
                        </div>
                        <span className={`basic-status status-${session.status.toLowerCase()}`}>
                          {session.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="empty-copy">
                      {t("analytics.no_session_review_data", {
                        defaultValue: "Chua co phien nao de danh gia.",
                      })}
                    </p>
                  )}
                </div>
              </article>

              <ProLockedCard
                title={t("analytics.best_hours_title", { defaultValue: "Gio hieu qua nhat" })}
                description="Pro phân tích khung giờ học hiệu quả nhất để gợi ý chiến lược tập trung cá nhân hóa."
              />
              <ProLockedCard
                title={t("analytics.violation_detail_title", {
                  defaultValue: "Chi tiet so lan mat tap trung",
                })}
                description="Pro mở khóa chi tiết hành vi, ứng dụng gây xao nhãng và điểm đánh giá từng phiên."
              />
            </>
          )}
        </section>

        {isProActive && isHistoryPopupOpen && (
          <SessionHistoryModal
            closeLabel={t("focusSession.review.close")}
            title={t("analytics.session_history_title", { defaultValue: "Lich su phien" })}
            popupTitle={t("analytics.session_history_popup_title", { defaultValue: "Chon mot phien" })}
            kicker={t("focusSession.review.kicker")}
            noGoalLabel={t("focusSession.summary.no_goal")}
            loadingLabel={t("focusSession.setup.history_loading", {
              defaultValue: "Dang tai lich su phien...",
            })}
            emptyLabel={t("analytics.no_session_review_data", {
              defaultValue: "Chua co phien nao de danh gia.",
            })}
            selectHint={t("analytics.session_history_select_hint", {
              defaultValue: "Chon mot phien trong danh sach de xem danh gia chi tiet.",
            })}
            completionLabel={t("focusSession.review.completion")}
            actualTimeLabel={t("focusSession.review.actual_time")}
            penaltiesLabel={t("focusSession.review.penalties")}
            xpLabel={t("focusSession.review.xp")}
            strengthTitle={t("focusSession.review.strength_title")}
            strengthCleanLabel={t("focusSession.review.strength_clean")}
            improveTitle={t("focusSession.review.improve_title")}
            violationTitle={t("focusSession.review.violation_title")}
            reviewedSessions={reviewedSessions}
            selectedSession={selectedHistorySession}
            selectedReview={selectedReview}
            isLoading={isSessionHistoryLoading}
            onSelectSession={setSelectedHistorySession}
            onClose={() => setIsHistoryPopupOpen(false)}
            formatMinutes={formatMinutes}
            sessionCompletionLabel={sessionCompletionLabel}
            gradeLabel={(grade) => t("focusSession.review.grade_label", { grade })}
            gradeMessage={(grade) => t(`focusSession.review.grade_message.${grade}`)}
            strengthProgressLabel={(count) => t("focusSession.review.strength_progress", { count })}
            improveKeepLabel={t("focusSession.review.improve_keep")}
            improveCompletionLabel={(percent) =>
              t("focusSession.review.improve_completion", {
                percent,
              })
            }
            violationLabel={(type) =>
              t(`focusSession.activeView.violation_${type.toLowerCase()}`, {
                defaultValue: type.replace(/_/g, " "),
              })
            }
          />
        )}
      </main>
    </div>
  );
}
