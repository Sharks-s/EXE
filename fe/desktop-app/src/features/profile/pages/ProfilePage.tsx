import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Achievement } from "@/features/achievements";
import type { Gender } from "../types/profile.types";
import { formatMinutes, mockProfileExtras, useProfilePage } from "../hooks/useProfilePage";
import "./ProfilePage.css";

const getAchievementProgressPercent = (progress: number, targetValue: number) => {
  if (targetValue <= 0) return 0;
  return Math.min(Math.round((progress / targetValue) * 100), 100);
};

export default function ProfilePage() {
  const {
    avatarInputRef,
    yearSummary,
    achievements,
    provinces,
    wards,
    isLoading,
    isLoadingWards,
    isSavingProfile,
    isUploadingAvatar,
    isProfileModalOpen,
    profileForm,
    setProfileForm,
    display,
    openProfileModal,
    closeProfileModal,
    handleProfileOverlayClick,
    handleAvatarClick,
    handleAvatarChange,
    handleProfileSubmit,
  } = useProfilePage();
  const { t } = useTranslation("common");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const completedAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.status === "UNLOCKED"),
    [achievements],
  );

  const incompleteAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.status !== "UNLOCKED"),
    [achievements],
  );

  const selectedProgressPercent = selectedAchievement
    ? getAchievementProgressPercent(
      selectedAchievement.progress,
      selectedAchievement.targetValue,
    )
    : 0;

  return (
    <div className="profile-page">
      <main className="main-content">
        <header className="mobile-header">
          <span className="material-symbols-outlined mobile-menu-icon">menu</span>
          <h1>{t("profile.header_title")}</h1>
          <div className="mobile-header-spacer" />
        </header>

        <div className="page-grid">
          <header className="app-page-header profile-page-header grid-full">
            <div className="app-page-title">
              <div className="app-page-title-row">
                <span className="app-page-title-icon">
                  <span className="material-symbols-outlined">manage_accounts</span>
                </span>
                <h1>{t("profile.header_title")}</h1>
              </div>
              <p>{t("profile.header_subtitle")}</p>
            </div>
          </header>

          <section className="hero-card grid-full">
            <div className="hero-blob" />

            <button
              className="avatar-wrapper"
              type="button"
              onClick={handleAvatarClick}
              title={t("profile.update_avatar")}
            >
              <div className="avatar-frame">
                <img src={display.avatarUrl} alt={t("profile.avatar_alt")} />
              </div>
              <div className="avatar-overlay">
                <span className="material-symbols-outlined">
                  {isUploadingAvatar ? "sync" : "photo_camera"}
                </span>
              </div>
              <span className="online-dot" />
            </button>
            <input
              ref={avatarInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />

            <div className="hero-info">
              <div className="profile-heading">
                <h2>{isLoading ? t("profile.loading") : display.name}</h2>
                <div className="badge-group">
                  <span className={`badge ${display.isPremium ? "badge-premium" : "badge-expert"}`}>
                    {display.planLabel}
                  </span>
                </div>
              </div>

              <p className="profile-meta">{display.meta}</p>
            </div>

            <div className="mini-stats">
              <article className="mini-stat-card">
                <span className="material-symbols-outlined icon-fill stat-fire">
                  local_fire_department
                </span>
                <strong>
                  {yearSummary?.currentStreakDays ?? mockProfileExtras.currentStreakDays}
                </strong>
                <span>{t("profile.stat_streak_days")}</span>
              </article>
              <article className="mini-stat-card">
                <span className="material-symbols-outlined icon-fill stat-blue">
                  check_circle
                </span>
                <strong>{yearSummary?.totalSessions ?? 0}</strong>
                <span>{t("profile.stat_sessions")}</span>
              </article>
              <article className="mini-stat-card">
                <span className="material-symbols-outlined icon-fill stat-green">
                  timer
                </span>
                <strong>{formatMinutes(yearSummary?.totalFocusMinutes)}</strong>
                <span>{t("profile.stat_total_time")}</span>
              </article>
            </div>
          </section>

          <section className="card profile-card grid-left">
            <div className="card-header">
              <h3>{t("profile.personal_info_title")}</h3>
              <button
                className="icon-button"
                type="button"
                title={t("profile.edit_profile")}
                onClick={openProfileModal}
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>

            <div className="info-list">
              <div className="info-row">
                <span className="material-symbols-outlined info-icon">person</span>
                <div>
                  <small>{t("profile.display_name")}</small>
                  <p>{display.name}</p>
                </div>
              </div>
              <div className="info-row">
                <span className="material-symbols-outlined info-icon">mail</span>
                <div>
                  <small>Email</small>
                  <p>{display.email}</p>
                </div>
              </div>
              <div className="info-row">
                <span className="material-symbols-outlined info-icon">smartphone</span>
                <div>
                  <small>{t("profile.phone")}</small>
                  <p>{display.phone}</p>
                </div>
              </div>
              <div className="info-row">
                <span className="material-symbols-outlined info-icon">cake</span>
                <div>
                  <small>{t("profile.dob")}</small>
                  <p>{display.dob}</p>
                </div>
              </div>
              <div className="info-row">
                <span className="material-symbols-outlined info-icon">location_on</span>
                <div>
                  <small>{t("profile.address")}</small>
                  <p>{display.address}</p>
                </div>
              </div>
            </div>

            <button className="secondary-button" type="button" onClick={openProfileModal}>
              <span className="material-symbols-outlined">edit</span>
              {t("profile.update_profile_btn")}
            </button>
          </section>

          <section className="card achievement-progress-card grid-right">
            <div className="card-header">
              <h3>{t("profile.achievements_title")}</h3>
            </div>

            {achievements.length > 0 ? (
              <div className="achievement-board">
                <section className="achievement-frame">
                  <div className="achievement-frame-header">
                    <h4>{t("profile.achievements_completed")}</h4>
                    <span>{completedAchievements.length}</span>
                  </div>
                  <div className="achievement-icon-grid">
                    {completedAchievements.length > 0 ? (
                      completedAchievements.map((achievement) => (
                        <button
                          className={`achievement-icon-button rarity-${achievement.rarity.toLowerCase()} status-${achievement.status.toLowerCase()} ${selectedAchievement?.code === achievement.code ? "selected" : ""}`}
                          key={achievement.code}
                          type="button"
                          aria-label={achievement.name}
                          title={achievement.name}
                          onClick={() => setSelectedAchievement(achievement)}
                        >
                          <span className="material-symbols-outlined icon-fill">
                            {achievement.icon || "emoji_events"}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="achievement-frame-empty">{t("profile.achievements_empty")}</div>
                    )}
                  </div>
                </section>

                <section className="achievement-frame">
                  <div className="achievement-frame-header">
                    <h4>{t("profile.achievements_incomplete")}</h4>
                    <span>{incompleteAchievements.length}</span>
                  </div>
                  <div className="achievement-icon-grid">
                    {incompleteAchievements.length > 0 ? (
                      incompleteAchievements.map((achievement) => (
                        <button
                          className={`achievement-icon-button rarity-${achievement.rarity.toLowerCase()} status-${achievement.status.toLowerCase()} ${selectedAchievement?.code === achievement.code ? "selected" : ""}`}
                          key={achievement.code}
                          type="button"
                          aria-label={achievement.name}
                          title={achievement.name}
                          onClick={() => setSelectedAchievement(achievement)}
                        >
                          <span className="material-symbols-outlined icon-fill">
                            {achievement.icon || "emoji_events"}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="achievement-frame-empty">{t("profile.achievements_no_pending")}</div>
                    )}
                  </div>
                </section>

                {selectedAchievement && (
                  <article
                    className={`achievement-detail-panel rarity-${selectedAchievement.rarity.toLowerCase()} status-${selectedAchievement.status.toLowerCase()}`}
                  >
                    <div className="achievement-detail-icon">
                      <span className="material-symbols-outlined icon-fill">
                        {selectedAchievement.icon || "emoji_events"}
                      </span>
                    </div>
                    <div className="achievement-detail-body">
                      <div className="achievement-detail-heading">
                        <h4>{selectedAchievement.name}</h4>
                        <span>{selectedAchievement.rarity}</span>
                      </div>
                      <p>
                        {selectedAchievement.description || t("profile.achievement_no_desc")}
                      </p>
                      <small className="achievement-detail-status">
                        {selectedAchievement.status === "UNLOCKED"
                          ? t("profile.achievements_completed")
                          : selectedAchievement.status === "IN_PROGRESS"
                            ? t("profile.achievement_in_progress")
                            : t("profile.achievement_locked")}
                      </small>
                      {selectedAchievement.status !== "LOCKED" && (
                        <>
                          <div className="achievement-progress-meta">
                            <span>
                              {selectedAchievement.progress}/{selectedAchievement.targetValue}
                            </span>
                            <strong>+{selectedAchievement.rewardPoints}</strong>
                          </div>
                          <div className="achievement-progress-track">
                            <div style={{ width: `${selectedProgressPercent}%` }} />
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                )}
              </div>
            ) : (
              <div className="achievement-empty">{t("profile.achievements_no_data")}</div>
            )}
          </section>
        </div>
      </main>

      <div
        className={`modal-overlay ${isProfileModalOpen ? "" : "hidden"}`}
        onClick={handleProfileOverlayClick}
      >
        <div className={`modal-card ${isProfileModalOpen ? "modal-card-open" : ""}`}>
          <div className="modal-header">
            <h3>{t("profile.update_profile_btn")}</h3>
            <button className="icon-button" type="button" onClick={closeProfileModal}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="modal-body">
            <form className="password-form profile-form" onSubmit={handleProfileSubmit}>
              <label>
                {t("profile.display_name")}
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      fullName: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                {t("profile.phone")}
                <input
                  type="tel"
                  value={profileForm.phoneNumber}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      phoneNumber: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                {t("profile.gender")}
                <select
                  value={profileForm.gender}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      gender: event.target.value as Gender,
                    }))
                  }
                >
                  <option value="MALE">{t("profile.gender_male")}</option>
                  <option value="FEMALE">{t("profile.gender_female")}</option>
                  <option value="OTHER">{t("profile.gender_other")}</option>
                </select>
              </label>
              <label>
                {t("profile.dob")}
                <input
                  type="date"
                  value={profileForm.dateOfBirth}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      dateOfBirth: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                {t("profile.address")}
                <input
                  type="text"
                  value={profileForm.addressLine}
                  maxLength={255}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      addressLine: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                {t("profile.province")}
                <select
                  value={profileForm.provinceCode}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      provinceCode: event.target.value,
                      wardCode: "",
                    }))
                  }
                  required
                >
                  <option value="">{t("profile.province_placeholder")}</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("profile.ward")}
                <select
                  value={profileForm.wardCode}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      wardCode: event.target.value,
                    }))
                  }
                  disabled={!profileForm.provinceCode || isLoadingWards}
                  required
                >
                  <option value="">
                    {isLoadingWards ? t("profile.loading") : t("profile.ward_placeholder")}
                  </option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button className="ghost-button" type="button" onClick={closeProfileModal}>
                  {t("profile.btn_cancel")}
                </button>
                <button className="primary-button" type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? t("profile.btn_saving") : t("profile.btn_save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
