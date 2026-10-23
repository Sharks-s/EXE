import { useEffect, useMemo, useState } from "react";
import "./SetupView.css";
import { CameraSetupModal } from "../components/CameraSetupModal";
import {
  analyticsApi,
  type AnalyticsSummary,
  type HourlyAnalytics,
} from "@/features/analytics";
import { petApi, type UserPet } from "@/features/pet";
import { profileApi } from "@/features/profile";
import type { UserSummary } from "@/features/profile/types/profile.types";
import { toast } from "@/shared/store/toastStore";
import type { Page } from "@/shared/components/Sidebar";
import { useTranslation } from "react-i18next";
import { useFocusStore } from "../stores/focusStore";
import { getBuddyMessage } from "../utils/buddyMessage";
import { getPetExperienceProgress } from "@/features/pet/utils/petExperience";
import { settingsApi } from "@/features/settings";
import { startFocusSessionService } from "../services/focus.service";
import { isDailyLimitExceededError } from "@/utils/api-error-code";
import type { FocusMode } from "../types/focus.types";


const goals = [
  { value: "Coding", translationKey: "coding" },
  { value: "Assignment", translationKey: "assignment" },
  { value: "Study", translationKey: "study" },
  { value: "Meeting", translationKey: "meeting" },
  { value: "Writing", translationKey: "writing" },
] as const;
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
  const [duration, setDuration] = useState(25);
  const [selectedPreset, setSelectedPreset] = useState(25);
  const [focusMode, setFocusMode] = useState<FocusMode>("STANDARD");
  const [selectedGoal, setSelectedGoal] = useState("Coding");
  const [customGoal, setCustomGoal] = useState("");
  const [isCameraSetupOpen, setIsCameraSetupOpen] = useState(false);
  const [daySummary, setDaySummary] = useState<AnalyticsSummary | null>(null);
  const [yearSummary, setYearSummary] = useState<AnalyticsSummary | null>(null);
  const [hourly, setHourly] = useState<HourlyAnalytics | null>(null);
  const [equippedPet, setEquippedPet] = useState<UserPet | null>(null);
  const [userProfile, setUserProfile] = useState<UserSummary | null>(null);
  const [isCheckingDailyLimit, setIsCheckingDailyLimit] = useState(false);

  const focusGoal = useMemo(
    () => customGoal.trim() || selectedGoal,
    [customGoal, selectedGoal],
  );

  const breakRewardMinutes = useMemo(
    () => focusMode === "POMODORO" ? 30 : Math.floor(duration / 25) * 5,
    [duration, focusMode],
  );
  const breakRewardProgress = useMemo(
    () => Math.min((duration / MAX_DURATION_MINUTES) * 100, 100),
    [duration],
  );
  const petExperienceProgress = useMemo(
    () => (equippedPet ? getPetExperienceProgress(equippedPet) : 0),
    [equippedPet],
  );
  const buddyMessage = useMemo(
    () =>
      getBuddyMessage({
        petName: equippedPet?.customName,
        personalityCode: userProfile?.personalityCode,
        focusGoal,
        durationMinutes: duration,
        todayFocusMinutes: daySummary?.totalFocusMinutes,
      }, t),
    [
      daySummary?.totalFocusMinutes,
      duration,
      equippedPet?.customName,
      focusGoal,
      userProfile?.personalityCode,
      t
    ],
  );

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      const [
        dayResult,
        yearResult,
        hourlyResult,
        petsResult,
        profileResult,
      ] = await Promise.allSettled([
        analyticsApi.getSummary({ range: "DAY" }),
        analyticsApi.getSummary({ range: "YEAR" }),
        analyticsApi.getHourly({ range: "WEEK" }),
        petApi.getMyPets(),
        profileApi.getMyProfile(),
      ]);

      if (cancelled) return;

      if (dayResult.status === "fulfilled") setDaySummary(dayResult.value);
      if (yearResult.status === "fulfilled") setYearSummary(yearResult.value);
      if (hourlyResult.status === "fulfilled") setHourly(hourlyResult.value);
      if (profileResult.status === "fulfilled") setUserProfile(profileResult.value);
      if (petsResult.status === "fulfilled") {
        const selectedPet =
          petsResult.value.find((pet) => pet.equipped) ??
          petsResult.value[0] ??
          null;

        if (!selectedPet) {
          setEquippedPet(null);
          return;
        }

        try {
          const petDetails = await petApi.getPetDetails(selectedPet.userPetId);
          if (!cancelled) {
            setEquippedPet({
              ...selectedPet,
              ...petDetails,
              premium: selectedPet.premium,
              equipped: selectedPet.equipped,
            });
          }
        } catch {
          if (!cancelled) {
            setEquippedPet({
              ...selectedPet,
              experience: selectedPet.experience ?? 0,
            });
          }
        }
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
    setFocusMode("STANDARD");
  };

  const handlePresetClick = (value: number) => {
    setDuration(value);
    setSelectedPreset(value);
    setFocusMode("STANDARD");
  };

  const handlePomodoroClick = () => {
    setDuration(100);
    setSelectedPreset(0);
    setFocusMode("POMODORO");
  };

  const handleStart = async () => {
    if (!focusGoal) return;

    setIsCheckingDailyLimit(true);
    let cameraEnabled: boolean;
    try {
      const userSettings = await settingsApi.getUserSettings();
      cameraEnabled = userSettings.cameraEnabled;
    } catch {
      toast.error("Không thể tải cấu hình camera. Vui lòng thử lại.");
      setIsCheckingDailyLimit(false);
      return;
    }

    try {
      const usage = await profileApi.getDailyUsage();
      if (
        !usage.unlimited &&
        ((usage.remainingMinute ?? 0) <= 0 ||
          duration > (usage.remainingMinute ?? 0))
      ) {
        useFocusStore.getState().showUpgradeNudge();
        toast.error(t("focusSession.setup.daily_limit_message"));
        setIsCheckingDailyLimit(false);
        return;
      }
    } catch {}

    if (cameraEnabled) {
      setIsCameraSetupOpen(true);
      setIsCheckingDailyLimit(false);
      return;
    }

    try {
      await startFocusSessionService({
        goal: focusGoal,
        durationMinutes: duration,
        focusMode,
      });
    } catch (error) {
      if (isDailyLimitExceededError(error)) {
        useFocusStore.getState().showUpgradeNudge();
        toast.error(t("focusSession.setup.daily_limit_message"));
      } else {
        toast.error(t("focusSession.cameraSetup.start_error"));
      }
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
                          key={goal.value}
                          type="button"
                          className={`goal-chip ${selectedGoal === goal.value && !customGoal.trim()
                            ? "active"
                            : ""
                            }`}
                          onClick={() => {
                            setSelectedGoal(goal.value);
                            setCustomGoal("");
                          }}
                        >
                          {t(`dashboard.presets.${goal.translationKey}`)}
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
                    className={`preset-btn ${selectedPreset === preset && focusMode === "STANDARD" ? "active" : ""}`}
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset}p
                  </button>
                ))}
                <button
                  type="button"
                  className={`preset-btn pomodoro-preset ${focusMode === "POMODORO" ? "active" : ""}`}
                  onClick={handlePomodoroClick}
                >
                  <span>{t("focusSession.setup.pomodoro_label")}</span>
                  <small>{t("focusSession.setup.pomodoro_cycle")}</small>
                </button>
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
                <div className="stat-box streak-box">
                  <p>{t("focusSession.setup.stat_streak")}</p>
                  <div className="fire-row">
                    <strong>{yearSummary?.currentStreakDays ?? 0}</strong>
                    <MaterialIcon name="local_fire_department" filled />
                  </div>
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
                    <span
                      style={{ width: `${petExperienceProgress}%` }}
                      title={`${equippedPet?.experience ?? 0} XP`}
                    />
                  </div>
                </div>
              </div>

              <div className="mascot-message">
                <p>{buddyMessage}</p>
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
          </div>
        </div>
      </main>

      {isCameraSetupOpen && (
        <CameraSetupModal
          goal={focusGoal}
          durationMinutes={duration}
          focusMode={focusMode}
          onClose={() => setIsCameraSetupOpen(false)}
        />
      )}
    </div>
  );
}
