import type { KeyboardEvent, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import "./SettingsPage.css";
import { useSettings } from "../hooks/useSettings";
import type {
  BooleanNotificationPreferenceKey,
} from "@/features/notifications/utils/notificationPreferences";

const PERSONALITY_ICON_MAP: Record<string, { icon: string; className: string }> = {
  INSPIRING: { icon: "emoji_objects", className: "ai-primary" },
  SWEET: { icon: "volunteer_activism", className: "ai-primary" },
  STRICT: { icon: "gavel", className: "ai-red" },
  MEAN: { icon: "local_fire_department", className: "ai-red" },
  CALM: { icon: "spa", className: "ai-green" },
  FRIEND: { icon: "diversity_1", className: "ai-purple" },
};

const DEFAULT_PERSONALITY_ICON = { icon: "smart_toy", className: "ai-primary" };

type ToggleSwitchProps = {
  enabled: boolean;
  onClick: () => void;
  disabled?: boolean;
};

const NOTIFICATION_GROUPS: Array<{
  titleKey: string;
  descriptionKey: string;
  keys: BooleanNotificationPreferenceKey[];
  items: Array<{ key: BooleanNotificationPreferenceKey; labelKey: string }>;
}> = [
  {
    titleKey: "settings.notifications.groups.focus.title",
    descriptionKey: "settings.notifications.groups.focus.description",
    keys: ["sessionCompleted", "sessionAborted"],
    items: [
      { key: "sessionCompleted", labelKey: "settings.notifications.items.session_completed" },
      { key: "sessionAborted", labelKey: "settings.notifications.items.session_aborted" },
    ],
  },
  {
    titleKey: "settings.notifications.groups.achievements.title",
    descriptionKey: "settings.notifications.groups.achievements.description",
    keys: ["achievementUnlocked", "streakMilestone"],
    items: [
      { key: "achievementUnlocked", labelKey: "settings.notifications.items.achievement_unlocked" },
      { key: "streakMilestone", labelKey: "settings.notifications.items.streak_milestone" },
    ],
  },
  {
    titleKey: "settings.notifications.groups.account.title",
    descriptionKey: "settings.notifications.groups.account.description",
    keys: ["dailyLimitReached", "payments"],
    items: [
      { key: "dailyLimitReached", labelKey: "settings.notifications.items.daily_limit" },
      { key: "payments", labelKey: "settings.notifications.items.payments" },
    ],
  },
];

function ToggleSwitch({ disabled = false, enabled, onClick }: ToggleSwitchProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  };

  return (
    <button
      type="button"
      className={`toggle-switch ${enabled ? "toggle-switch-on" : ""}`}
      onClick={handleClick}
      aria-pressed={enabled}
      disabled={disabled}
    >
      <span className="toggle-knob" />
    </button>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation("common");
  const {
    i18n,
    personalities,
    activePersonalityId,
    selfAddress,
    setSelfAddress,
    userAddress,
    setUserAddress,
    isSavingAiAddress,
    handleSaveAiAddress,
    handleSelectPersonality,
    handleChangeLanguage,
    appListTab,
    setAppListTab,
    appRules,
    newKeyword,
    setNewKeyword,
    isAddingRule,
    currentList,
    handleAddKeyword,
    handleRemoveKeyword,
    warningWindowEnabled,
    setWarningWindowEnabled,
    soundReminderEnabled,
    setSoundReminderEnabled,
    notificationPreferences,
    handleNotificationPreferenceChange,
    handleNotificationPreferenceValueChange,
    handleNotificationGroupChange,
    isPasswordModalOpen,
    setIsPasswordModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeviceModalOpen,
    setIsDeviceModalOpen,
    isChangingPassword,
    isDeletingAccount,
    passwordForm,
    setPasswordForm,
    devices,
    handlePasswordSubmit,
    handleLogout,
    handleDeleteAccount,
  } = useSettings();

  return (
    <div>
      <main className="main-content">
        <header className="mobile-header">
          <span className="material-symbols-outlined mobile-menu-icon">menu</span>
          <h1>{t("settings.title")}</h1>
          <div className="mobile-header-spacer" />
        </header>

        <div className="page-grid">
          <header className="app-page-header grid-full">
            <div className="app-page-title">
              <div className="app-page-title-row">
                <span className="app-page-title-icon">
                  <span className="material-symbols-outlined">settings</span>
                </span>
                <h1>{t("settings.title")}</h1>
              </div>
              <p>{t("settings.subtitle")}</p>
            </div>
          </header>

          {/* ── Cấu hình AI đồng hành ── */}
          <section className="card grid-full">
            <div className="card-intro">
              <h3>{t("settings.ai.title")}</h3>
              <p>{t("settings.ai.description")}</p>
            </div>

            <div className="ai-grid">
              {personalities.map((option) => {
                const isActive = option.id === activePersonalityId;
                const iconInfo =
                  PERSONALITY_ICON_MAP[option.code] ?? DEFAULT_PERSONALITY_ICON;

                return (
                  <article
                    key={option.id}
                    className={`ai-option ${isActive ? "ai-option-active" : ""}`}
                    onClick={() => handleSelectPersonality(option.id)}
                  >
                    {isActive && <span className="active-tag">{t("settings.ai.active")}</span>}
                    {option.isPremium && !isActive && (
                      <span className="premium-tag">{t("settings.ai.premium")}</span>
                    )}
                    <span
                      className={`material-symbols-outlined icon-fill ai-icon ${iconInfo.className}`}
                    >
                      {iconInfo.icon}
                    </span>
                    <h4>{option.name}</h4>
                    <p>{option.description}</p>
                  </article>
                );
              })}
            </div>

            <div className="ai-address-form">
              <label>
                {t("settings.ai.self_label")}
                <input
                  type="text"
                  placeholder={t("settings.ai.self_placeholder")}
                  maxLength={30}
                  value={selfAddress}
                  onChange={(e) => setSelfAddress(e.target.value)}
                />
              </label>
              <label>
                {t("settings.ai.user_label")}
                <input
                  type="text"
                  placeholder={t("settings.ai.user_placeholder")}
                  maxLength={30}
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                />
              </label>
              <button
                className="primary-button ai-address-save"
                type="button"
                onClick={handleSaveAiAddress}
                disabled={isSavingAiAddress}
              >
                {isSavingAiAddress ? t("settings.actions.saving") : t("settings.actions.save_changes")}
              </button>
            </div>
          </section>

          {/* ── Ngôn ngữ ── */}
          <section className="card grid-left">
            <div className="card-intro">
              <h3>{t("settings.language.title")}</h3>
              <p>{t("settings.language.description")}</p>
            </div>

            <div className="language-options">
              <button
                type="button"
                className={`language-option ${i18n.language === "vi" ? "language-option-active" : ""}`}
                onClick={() => handleChangeLanguage("vi")}
              >
                <span className="language-flag">🇻🇳</span>
                <span>{t("settings.language.vi")}</span>
                {i18n.language === "vi" && (
                  <span className="material-symbols-outlined check-icon">check_circle</span>
                )}
              </button>
              <button
                type="button"
                className={`language-option ${i18n.language === "en" ? "language-option-active" : ""}`}
                onClick={() => handleChangeLanguage("en")}
              >
                <span className="language-flag">🇬🇧</span>
                <span>English</span>
                {i18n.language === "en" && (
                  <span className="material-symbols-outlined check-icon">check_circle</span>
                )}
              </button>
            </div>
          </section>

          {/* ── Phiên tập trung ── */}
          <section className="card grid-right">
            <div className="card-intro">
              <h3>{t("settings.focus.title")}</h3>
              <p>{t("settings.focus.description")}</p>
            </div>

            <div className="toggle-list">
              <div className="toggle-row">
                <div>
                  <p>{t("settings.focus.warning_window")}</p>
                  <small>{t("settings.focus.warning_window_desc")}</small>
                </div>
                <ToggleSwitch
                  enabled={warningWindowEnabled}
                  onClick={() => setWarningWindowEnabled((v) => !v)}
                />
              </div>

              <div className="toggle-row">
                <div>
                  <p>{t("settings.focus.sound_reminder")}</p>
                  <small>{t("settings.focus.sound_reminder_desc")}</small>
                </div>
                <ToggleSwitch
                  enabled={soundReminderEnabled}
                  onClick={() => setSoundReminderEnabled((v) => !v)}
                />
              </div>
            </div>
          </section>

          {/* ── Thông báo ── */}
          <section className="card grid-full">
            <div className="card-intro">
              <h3>{t("settings.notifications.title")}</h3>
              <p>{t("settings.notifications.description")}</p>
            </div>

            <div className="notification-settings-layout">
              <div className="notification-settings-main">
                <div className="toggle-row notification-compact-row">
                  <div>
                    <p>{t("settings.notifications.unread_badge")}</p>
                    <small>{t("settings.notifications.unread_badge_desc")}</small>
                  </div>
                  <ToggleSwitch
                    enabled={notificationPreferences.showUnreadBadge}
                    onClick={() => handleNotificationPreferenceChange("showUnreadBadge")}
                  />
                </div>

                {NOTIFICATION_GROUPS.map((group) => {
                  const groupEnabled = group.keys.every(
                    (key) => notificationPreferences[key] === true,
                  );

                  return (
                    <details className="notification-group" key={group.titleKey} open>
                      <summary className="notification-group-summary">
                        <span className="material-symbols-outlined notification-group-chevron">
                          expand_more
                        </span>
                        <span className="notification-group-copy">
                          <strong>{t(group.titleKey)}</strong>
                          <small>{t(group.descriptionKey)}</small>
                        </span>
                        <ToggleSwitch
                          enabled={groupEnabled}
                          onClick={() =>
                            handleNotificationGroupChange(group.keys, !groupEnabled)
                          }
                        />
                      </summary>

                      <div className="notification-group-items">
                        {group.items.map((item) => (
                          <div className="notification-sub-row" key={item.key}>
                            <span>{t(item.labelKey)}</span>
                            <ToggleSwitch
                              enabled={notificationPreferences[item.key] === true}
                              onClick={() =>
                                handleNotificationPreferenceChange(item.key)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>

              <aside className="notification-quiet-panel">
                <p className="notification-settings-label">{t("settings.notifications.quiet_mode")}</p>

                <div className="toggle-row notification-compact-row">
                  <div>
                    <p>{t("settings.notifications.pause_during_focus")}</p>
                    <small>{t("settings.notifications.pause_during_focus_desc")}</small>
                  </div>
                  <ToggleSwitch
                    enabled={notificationPreferences.pauseDuringFocus}
                    onClick={() =>
                      handleNotificationPreferenceChange("pauseDuringFocus")
                    }
                  />
                </div>

                <div className="toggle-row notification-compact-row">
                  <div>
                    <p>{t("settings.notifications.quiet_hours")}</p>
                    <small>{t("settings.notifications.quiet_hours_desc")}</small>
                  </div>
                  <ToggleSwitch
                    enabled={notificationPreferences.quietHoursEnabled}
                    onClick={() =>
                      handleNotificationPreferenceChange("quietHoursEnabled")
                    }
                  />
                </div>

                <div className="quiet-time-row">
                  <label>
                    {t("settings.notifications.from")}
                    <input
                      type="time"
                      value={notificationPreferences.quietHoursStart}
                      disabled={!notificationPreferences.quietHoursEnabled}
                      onChange={(event) =>
                        handleNotificationPreferenceValueChange(
                          "quietHoursStart",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                  <label>
                    {t("settings.notifications.to")}
                    <input
                      type="time"
                      value={notificationPreferences.quietHoursEnd}
                      disabled={!notificationPreferences.quietHoursEnabled}
                      onChange={(event) =>
                        handleNotificationPreferenceValueChange(
                          "quietHoursEnd",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                </div>

                <div className="toggle-row notification-compact-row">
                  <div>
                    <p>{t("settings.notifications.session_digest")}</p>
                    <small>{t("settings.notifications.session_digest_desc")}</small>
                  </div>
                  <ToggleSwitch
                    enabled={notificationPreferences.sessionDigest}
                    onClick={() => handleNotificationPreferenceChange("sessionDigest")}
                  />
                </div>
              </aside>
            </div>
          </section>

          {/* ── Danh sách ứng dụng ── */}
          <section className="card grid-full">
            <div className="card-intro">
              <h3>{t("settings.app_list.title")}</h3>
              <p>{t("settings.app_list.description")}</p>
            </div>

            <div className="app-list-tabs">
              <button
                type="button"
                className={`app-list-tab ${appListTab === "whitelist" ? "app-list-tab-active" : ""}`}
                onClick={() => setAppListTab("whitelist")}
              >
                {t("settings.app_list.whitelist")} ({appRules.filter((r) => r.ruleType === "WHITELIST").length})
              </button>
              <button
                type="button"
                className={`app-list-tab ${appListTab === "blacklist" ? "app-list-tab-active" : ""}`}
                onClick={() => setAppListTab("blacklist")}
              >
                {t("settings.app_list.blacklist")} ({appRules.filter((r) => r.ruleType === "BLACKLIST").length})
              </button>
            </div>

            <div className="app-list-input-row">
              <input
                type="text"
                placeholder={
                  appListTab === "whitelist"
                    ? t("settings.app_list.whitelist_placeholder")
                    : t("settings.app_list.blacklist_placeholder")
                }
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                  e.key === "Enter" && handleAddKeyword()
                }
                disabled={isAddingRule}
              />
              <button
                type="button"
                className="primary-button"
                onClick={handleAddKeyword}
                disabled={isAddingRule}
              >
                {isAddingRule ? t("settings.actions.adding") : t("settings.actions.add")}
              </button>
            </div>

            <div className="tag-list">
              {currentList.length === 0 ? (
                <p className="tag-list-empty">{t("settings.app_list.empty")}</p>
              ) : (
                currentList.map((rule) => (
                  <span
                    key={rule.id}
                    className={`tag-chip ${appListTab === "blacklist" ? "tag-chip-danger" : ""}`}
                  >
                    {rule.keyword}
                    <button type="button" onClick={() => handleRemoveKeyword(rule.id)}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </span>
                ))
              )}
            </div>
          </section>

          {/* ── Bảo mật & Tài khoản ── */}
          <section className="card security-card grid-full">
            <h3>{t("settings.security.title")}</h3>

            <div className="security-list">
              <div className="security-row">
                <div className="security-info">
                  <span className="material-symbols-outlined security-icon">
                    password
                  </span>
                  <div>
                    <p>{t("settings.security.password")}</p>
                    <small>{t("settings.security.password_updated_unknown")}</small>
                  </div>
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  {t("settings.actions.change")}
                </button>
              </div>
            </div>

            <button className="logout-button" type="button" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              {t("settings.actions.logout")}
            </button>
            <button
              className="delete-account-button"
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <span className="material-symbols-outlined">delete_forever</span>
              {t("settings.actions.delete_account")}
            </button>
          </section>
        </div>
      </main>

      {/* ── Modal Đổi mật khẩu ── */}
      <div
        className={`modal-overlay ${isPasswordModalOpen ? "" : "hidden"}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsPasswordModalOpen(false);
        }}
      >
        <div className={`modal-card ${isPasswordModalOpen ? "modal-card-open" : ""}`}>
          <div className="modal-header">
            <h3>{t("settings.password_modal.title")}</h3>
            <button
              className="icon-button"
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form className="password-form" onSubmit={handlePasswordSubmit}>
            <label>
              {t("settings.password_modal.current_password")}
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    oldPassword: e.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              {t("settings.password_modal.new_password")}
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              {t("settings.password_modal.confirm_password")}
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                required
              />
            </label>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                {t("settings.actions.cancel")}
              </button>
              <button
                className="primary-button"
                type="submit"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? t("settings.actions.saving") : t("settings.actions.save_changes")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Modal Quản lý thiết bị ── */}
      <div
        className={`modal-overlay ${isDeviceModalOpen ? "" : "hidden"}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsDeviceModalOpen(false);
        }}
      >
        <div className={`modal-card ${isDeviceModalOpen ? "modal-card-open" : ""}`}>
          <div className="modal-header">
            <h3>{t("settings.devices.title")}</h3>
            <button
              className="icon-button"
              type="button"
              onClick={() => setIsDeviceModalOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="device-list">
            {devices.length === 0 ? (
              <p className="tag-list-empty">
                {t("settings.devices.empty")}
              </p>
            ) : (
              devices.map((device) => (
                <div key={device.id} className="device-row">
                  <div className="security-info">
                    <span className="material-symbols-outlined security-icon">
                      devices
                    </span>
                    <div>
                      <p>{device.name}</p>
                      <small>{device.lastActive}</small>
                    </div>
                  </div>
                  <button
                    className="text-button device-revoke"
                    type="button"
                    onClick={() => {
                      // TODO: nối API thu hồi device
                    }}
                  >
                    {t("settings.actions.revoke")}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Xóa tài khoản ── */}
      <div
        className={`modal-overlay ${isDeleteModalOpen ? "" : "hidden"}`}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDeletingAccount)
            setIsDeleteModalOpen(false);
        }}
      >
        <div className={`modal-card ${isDeleteModalOpen ? "modal-card-open" : ""}`}>
          <div className="modal-header">
            <h3>{t("settings.delete_modal.title")}</h3>
            <button
              className="icon-button"
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeletingAccount}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="delete-confirm">
            <p>
              {t("settings.delete_modal.description")}
            </p>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingAccount}
              >
                {t("settings.actions.cancel")}
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? t("settings.actions.deleting") : t("settings.actions.delete_account")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
