import { useEffect, useMemo, useState } from "react";
import "./SetupView.css";
import { CameraSetupModal } from "../components/CameraSetupModal";
import { analyticsApi } from "../../analytics/api/analytics.api";
import type {
  AnalyticsSummary,
  FocusTimeAnalytics,
  HourlyAnalytics,
} from "../../analytics/types/analytics.types";
import { petApi } from "../../pet/api/petApi";
import type { UserPet } from "../../pet/types/pet.type";
import { profileApi } from "../../profile/api/profile.api";
import { toast } from "../../../shared/store/toastStore";
import type { Page } from "../../../shared/components/Sidebar";
import { useTranslation } from "react-i18next";

const goals = ["Coding", "Assignment", "Study", "Meeting", "Writing"];
const presets = [5, 25, 50, 90, 120];
const MAX_DURATION_MINUTES = 240;

const formatMinutes = (minutes?: number) => {
  return `${Math.max(Math.round(minutes ?? 0), 0)} phút`;
};

const formatHourRange = (hour?: number | null) => {
  if (hour === undefined || hour === null) return "Chưa có dữ liệu";
  const endHour = (hour + 1) % 24;
  return `${String(hour).padStart(2, "0")}:00 - ${String(endHour).padStart(
    2,
    "0",
  )}:00`;
};

const formatRecentDate = (dateValue?: string) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

function MaterialIcon({
  name,
  filled = false,
  className = "",
}: {
  name: string;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "icon-filled" : ""
        } ${className}`}
    >
      {name}
    </span>
  );
}

type SetupViewProps = {
  onNavigate?: (page: Page) => void;
};

export function SetupView({ onNavigate }: SetupViewProps) {
  const { t } = useTranslation("common");
  const [duration, setDuration] = useState(50);
  const [selectedPreset, setSelectedPreset] = useState(50);
  const [selectedGoal, setSelectedGoal] = useState("Coding");
  const [customGoal, setCustomGoal] = useState("");
  const [isCameraSetupOpen, setIsCameraSetupOpen] = useState(false);
  const [daySummary, setDaySummary] = useState<AnalyticsSummary | null>(null);
  const [weekSummary, setWeekSummary] = useState<AnalyticsSummary | null>(null);
  const [yearSummary, setYearSummary] = useState<AnalyticsSummary | null>(null);
  const [weeklyFocusTime, setWeeklyFocusTime] =
    useState<FocusTimeAnalytics | null>(null);
  const [hourly, setHourly] = useState<HourlyAnalytics | null>(null);
  const [equippedPet, setEquippedPet] = useState<UserPet | null>(null);
  const [isCheckingDailyLimit, setIsCheckingDailyLimit] = useState(false);

  const focusGoal = useMemo(
    () => customGoal.trim() || selectedGoal,
    [customGoal, selectedGoal],
  );

  const breakRewardMinutes = useMemo(() => Math.floor(duration / 5), [duration]);
  const breakRewardProgress = useMemo(
    () => Math.min((duration / MAX_DURATION_MINUTES) * 100, 100),
    [duration],
  );

  const recentFocusItem = useMemo(() => {
    const items = weeklyFocusTime?.items ?? [];
    return [...items].reverse().find((item) => item.focusMinutes > 0) ?? null;
  }, [weeklyFocusTime]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      const [
        dayResult,
        weekResult,
        yearResult,
        focusTimeResult,
        hourlyResult,
        petsResult,
      ] = await Promise.allSettled([
        analyticsApi.getSummary({ range: "DAY" }),
        analyticsApi.getSummary({ range: "WEEK" }),
        analyticsApi.getSummary({ range: "YEAR" }),
        analyticsApi.getFocusTime({ range: "WEEK" }),
        analyticsApi.getHourly({ range: "WEEK" }),
        petApi.getMyPets(),
      ]);

      if (cancelled) return;

      if (dayResult.status === "fulfilled") setDaySummary(dayResult.value);
      if (weekResult.status === "fulfilled") setWeekSummary(weekResult.value);
      if (yearResult.status === "fulfilled") setYearSummary(yearResult.value);
      if (focusTimeResult.status === "fulfilled") {
        setWeeklyFocusTime(focusTimeResult.value);
      }
      if (hourlyResult.status === "fulfilled") setHourly(hourlyResult.value);
      if (petsResult.status === "fulfilled") {
        setEquippedPet(
          petsResult.value.find((pet) => pet.equipped) ??
          petsResult.value[0] ??
          null,
        );
      }
    };

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDurationChange = (value: number) => {
    setDuration(value);
    setSelectedPreset(0);
  };

  const handlePresetClick = (value: number) => {
    setDuration(value);
    setSelectedPreset(value);
  };

  const handleStart = async () => {
    if (!focusGoal) return;

    setIsCheckingDailyLimit(true);
    try {
      const usage = await profileApi.getDailyUsage();
      if (usage.remainingMinute <= 0 || duration > usage.remainingMinute) {
        toast.error(t("focusSession.setup.daily_limit_message"));
        return;
      }

      setIsCameraSetupOpen(true);
    } catch {
      setIsCameraSetupOpen(true);
    } finally {
      setIsCheckingDailyLimit(false);
    }
  };

  const handleNavigate = (page: Page) => {
    onNavigate?.(page);
  };

  return (
    <div className="focus-dashboard">
      <main className="dashboard-main">
        <header className="top-header app-page-header">
          <div className="app-page-title">
            <div className="app-page-title-row">
              <span className="app-page-title-icon">
                <MaterialIcon name="dashboard" />
              </span>
              <h1>{t("focusSession.setup.greeting")}</h1>
            </div>
            <p>{t("focusSession.setup.subtitle")}</p>
          </div>

          <div className="header-actions app-page-actions">
            <div className="ready-status">
              <span className="status-dot" />
              <span>{t("focusSession.setup.ready_status")}</span>
            </div>

            <button
              className="notification-btn"
              type="button"
              aria-label={t("focusSession.setup.notification_aria")}
            >
              <MaterialIcon name="notifications" />
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          <div className="main-column">
            <section className="bento-card goal-card">
              <div className="section-title">
                <div className="title-icon">
                  <MaterialIcon name="track_changes" />
                </div>
                <h3>{t("focusSession.setup.goal_title")}</h3>
              </div>

              <div className="goal-controls">
                <div className="goal-list">
                  {[goals.slice(0, 3), goals.slice(3)].map((row, rowIndex) => (
                    <div className="goal-row" key={rowIndex}>
                      {row.map((goal) => (
                        <button
                          key={goal}
                          type="button"
                          className={`goal-chip ${selectedGoal === goal && !customGoal.trim()
                            ? "active"
                            : ""
                            }`}
                          onClick={() => {
                            setSelectedGoal(goal);
                            setCustomGoal("");
                          }}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="goal-input-wrap">
                  <MaterialIcon name="edit_note" />
                  <input
                    placeholder={t("focusSession.setup.goal_placeholder")}
                    type="text"
                    value={customGoal}
                    onChange={(event) => setCustomGoal(event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="bento-card duration-card">
              <div className="duration-header">
                <div className="section-title no-margin">
                  <div className="title-icon">
                    <MaterialIcon name="timer" />
                  </div>
                  <h3>{t("focusSession.setup.duration_title")}</h3>
                </div>

                <div className="duration-value">
                  <strong>{duration}</strong>
                  <span>{t("focusSession.setup.minutes_short")}</span>
                </div>
              </div>

              <div className="slider-wrap">
                <input
                  className="custom-slider"
                  max={240}
                  min={5}
                  step={5}
                  type="range"
                  value={duration}
                  onChange={(event) =>
                    handleDurationChange(Number(event.target.value))
                  }
                />
                <div className="slider-labels">
                  <span>{t("focusSession.setup.slider_min")}</span>
                  <span>{t("focusSession.setup.slider_max")}</span>
                </div>
              </div>

              <div className="preset-grid">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`preset-btn ${selectedPreset === preset ? "active" : ""
                      }`}
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset}p
                  </button>
                ))}
              </div>
            </section>

            <div className="reward-row">
              <div className="reward-card bento-card">
                <MaterialIcon name="stars" className="reward-watermark" />
                <div className="reward-icon">
                  <MaterialIcon name="savings" filled />
                </div>
                <div className="reward-content">
                  <div className="reward-title">
                    <h4>
                      {t("focusSession.setup.reward_title", {
                        minutes: breakRewardMinutes,
                      })}
                    </h4>
                  </div>
                  <p>{t("focusSession.setup.reward_desc")}</p>
                  <div className="reward-progress">
                    <span style={{ width: `${breakRewardProgress}%` }} />
                  </div>
                </div>
              </div>

              <button
                className="start-btn"
                type="button"
                onClick={handleStart}
                disabled={isCheckingDailyLimit}
              >
                <span className="start-shine" />
                <span>{t("focusSession.setup.start_button")}</span>
                <MaterialIcon name="arrow_forward" />
              </button>
            </div>
          </div>

          <div className="side-column">
            <section className="bento-card summary-card">
              <div className="summary-header">
                <h3>{t("focusSession.setup.stats_title")}</h3>
                <button
                  className="header-icon-button"
                  type="button"
                  aria-label={t("focusSession.setup.stats_aria")}
                  onClick={() => handleNavigate("analytics")}
                >
                  <MaterialIcon name="query_stats" />
                </button>
              </div>

              <div className="summary-grid">
                <div className="stat-box">
                  <p>{t("focusSession.setup.stat_time")}</p>
                  <strong className="primary-text">
                    {formatMinutes(daySummary?.totalFocusMinutes)}
                  </strong>
                </div>
                <div className="stat-box">
                  <p>{t("focusSession.setup.stat_sessions")}</p>
                  <div className="stat-inline">
                    <strong>{daySummary?.completedSessions ?? 0}</strong>
                    <span>/{daySummary?.totalSessions ?? 0}</span>
                  </div>
                </div>
                <div className="stat-box streak-box">
                  <p>{t("focusSession.setup.stat_streak")}</p>
                  <div className="fire-row">
                    <strong>{yearSummary?.currentStreakDays ?? 0}</strong>
                    <MaterialIcon name="local_fire_department" filled />
                  </div>
                </div>
                <div className="stat-box performance-box">
                  <p>{t("focusSession.setup.stat_performance")}</p>
                  <strong>
                    {Math.round(weekSummary?.completionRate ?? 0)}%
                  </strong>
                </div>
              </div>
            </section>

            <section
              className="bento-card mascot-card clickable-card"
              role="button"
              tabIndex={0}
              aria-label={t("focusSession.setup.pet_aria")}
              onClick={() => handleNavigate("pet")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleNavigate("pet");
                }
              }}
            >
              <div className="mascot-row">
                <div className="mascot-avatar">
                  <img
                    src={equippedPet?.imageUrl || "/pet/MONKI/khiworking/bot_0.png"}
                    alt={equippedPet?.customName || "Monki"}
                  />
                </div>
                <div className="mascot-info">
                  <div>
                    <h4>
                      {equippedPet?.customName ||
                        t("focusSession.setup.pet_not_equipped")}
                    </h4>
                    <span>LVL {equippedPet?.level ?? 0}</span>
                  </div>
                  <div className="level-bar">
                    <span />
                  </div>
                </div>
              </div>

              <div className="mascot-message">
                <p>
                  {equippedPet
                    ? t("focusSession.setup.pet_companion", {
                      name: equippedPet.customName,
                    })
                    : t("focusSession.setup.pet_no_pet")}
                </p>
              </div>
            </section>

            <section className="bento-card ai-card">
              <div>
                <span>{t("focusSession.setup.ai_insight_title")}</span>
                <MaterialIcon name="auto_awesome" />
              </div>
              <p>
                {t("focusSession.setup.ai_insight_prefix")}{" "}
                <strong>{formatHourRange(hourly?.bestHour)}</strong>
                {t("focusSession.setup.ai_insight_suffix")}
              </p>
            </section>

            <section className="bento-card recent-card">
              <div className="recent-header">
                <h3>{t("focusSession.setup.recent_title")}</h3>
                <button type="button">{t("focusSession.setup.recent_all")}</button>
              </div>

              <div className="session-item">
                <div className="session-icon">
                  <MaterialIcon name="terminal" />
                </div>
                <div className="session-content">
                  <h5>
                    {recentFocusItem
                      ? t("focusSession.setup.recent_item_title")
                      : t("focusSession.setup.recent_item_empty")}
                  </h5>
                  <p>
                    {recentFocusItem
                      ? `${formatRecentDate(recentFocusItem.date)} - ${formatMinutes(
                        recentFocusItem.focusMinutes,
                      )}`
                      : t("focusSession.setup.recent_item_hint")}
                  </p>
                </div>
                <div className="xp-badge">
                  {recentFocusItem
                    ? t("focusSession.setup.session_count", {
                      count: recentFocusItem.completedSessions,
                    })
                    : t("focusSession.setup.session_count", { count: 0 })}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {isCameraSetupOpen && (
        <CameraSetupModal
          goal={focusGoal}
          durationMinutes={duration}
          onClose={() => setIsCameraSetupOpen(false)}
        />
      )}
    </div>
  );
}