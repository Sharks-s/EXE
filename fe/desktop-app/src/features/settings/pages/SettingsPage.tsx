import type { KeyboardEvent, MouseEvent } from "react";
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
  title: string;
  description: string;
  keys: BooleanNotificationPreferenceKey[];
  items: Array<{ key: BooleanNotificationPreferenceKey; label: string }>;
}> = [
  {
    title: "Phi\u00ean t\u1eadp trung",
    description: "C\u00e1c c\u1eadp nh\u1eadt khi phi\u00ean b\u1eaft \u0111\u1ea7u, k\u1ebft th\u00fac ho\u1eb7c d\u1eebng s\u1edbm.",
    keys: ["sessionCompleted", "sessionAborted"],
    items: [
      { key: "sessionCompleted", label: "Ho\u00e0n th\u00e0nh phi\u00ean" },
      { key: "sessionAborted", label: "Phi\u00ean b\u1ecb d\u1eebng s\u1edbm" },
    ],
  },
  {
    title: "Th\u00e0nh t\u00edch",
    description: "Th\u00e0nh t\u1ef1u m\u1edbi v\u00e0 c\u00e1c m\u1ed1c streak \u0111\u00e1ng ch\u00fa \u00fd.",
    keys: ["achievementUnlocked", "streakMilestone"],
    items: [
      { key: "achievementUnlocked", label: "M\u1edf kh\u00f3a th\u00e0nh t\u1ef1u" },
      { key: "streakMilestone", label: "M\u1ed1c streak" },
    ],
  },
  {
    title: "T\u00e0i kho\u1ea3n",
    description: "Gi\u1edbi h\u1ea1n g\u00f3i Free v\u00e0 tr\u1ea1ng th\u00e1i thanh to\u00e1n.",
    keys: ["dailyLimitReached", "payments"],
    items: [
      { key: "dailyLimitReached", label: "Gi\u1edbi h\u1ea1n ng\u00e0y" },
      { key: "payments", label: "Thanh to\u00e1n" },
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
          <h1>Cài đặt</h1>
          <div className="mobile-header-spacer" />
        </header>

        <div className="page-grid">
          <header className="app-page-header grid-full">
            <div className="app-page-title">
              <div className="app-page-title-row">
                <span className="app-page-title-icon">
                  <span className="material-symbols-outlined">settings</span>
                </span>
                <h1>Cài đặt</h1>
              </div>
              <p>Quản lý cấu hình AI, bảo mật và tùy chọn ứng dụng.</p>
            </div>
          </header>

          {/* ── Cấu hình AI đồng hành ── */}
          <section className="card grid-full">
            <div className="card-intro">
              <h3>Cấu hình AI đồng hành</h3>
              <p>Chọn phong cách tương tác và cách AI xưng hô với bạn.</p>
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
                    {isActive && <span className="active-tag">ĐANG CHỌN</span>}
                    {option.isPremium && !isActive && (
                      <span className="premium-tag">PREMIUM</span>
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
                AI xưng là
                <input
                  type="text"
                  placeholder="tôi"
                  maxLength={30}
                  value={selfAddress}
                  onChange={(e) => setSelfAddress(e.target.value)}
                />
              </label>
              <label>
                AI gọi bạn là
                <input
                  type="text"
                  placeholder="bạn"
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
                {isSavingAiAddress ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </section>

          {/* ── Ngôn ngữ ── */}
          <section className="card grid-left">
            <div className="card-intro">
              <h3>Ngôn ngữ</h3>
              <p>Chọn ngôn ngữ hiển thị cho ứng dụng.</p>
            </div>

            <div className="language-options">
              <button
                type="button"
                className={`language-option ${i18n.language === "vi" ? "language-option-active" : ""}`}
                onClick={() => handleChangeLanguage("vi")}
              >
                <span className="language-flag">🇻🇳</span>
                <span>Tiếng Việt</span>
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
              <h3>{"Phi\u00ean t\u1eadp trung"}</h3>
              <p>{"C\u00e0i \u0111\u1eb7t c\u1ea3nh b\u00e1o gi\u00e1m s\u00e1t AI trong l\u00fac b\u1ea1n \u0111ang h\u1ecdc."}</p>
            </div>

            <div className="toggle-list">
              <div className="toggle-row">
                <div>
                  <p>{"Hi\u1ec7n c\u1eeda s\u1ed5 c\u1ea3nh b\u00e1o"}</p>
                  <small>{"B\u1eadt popup Warning khi AI ph\u00e1t hi\u1ec7n b\u1ea1n xao nh\u00e3ng."}</small>
                </div>
                <ToggleSwitch
                  enabled={warningWindowEnabled}
                  onClick={() => setWarningWindowEnabled((v) => !v)}
                />
              </div>

              <div className="toggle-row">
                <div>
                  <p>{"\u00c2m thanh nh\u1eafc nh\u1edf"}</p>
                  <small>{"Ph\u00e1t \u00e2m thanh k\u00e8m theo c\u1ea3nh b\u00e1o AI."}</small>
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
              <h3>{"Th\u00f4ng b\u00e1o"}</h3>
              <p>{"Qu\u1ea3n l\u00fd c\u00e1c th\u00f4ng b\u00e1o hi\u1ec3n th\u1ecb trong h\u1ed9p th\u01b0 chu\u00f4ng."}</p>
            </div>

            <div className="notification-settings-layout">
              <div className="notification-settings-main">
                <div className="toggle-row notification-compact-row">
                  <div>
                    <p>{"Hi\u1ec3n th\u1ecb huy hi\u1ec7u ch\u01b0a \u0111\u1ecdc"}</p>
                    <small>{"Hi\u1ec7n s\u1ed1 m\u00e0u \u0111\u1ecf tr\u00ean bi\u1ec3u t\u01b0\u1ee3ng chu\u00f4ng."}</small>
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
                    <details className="notification-group" key={group.title} open>
                      <summary className="notification-group-summary">
                        <span className="material-symbols-outlined notification-group-chevron">
                          expand_more
                        </span>
                        <span className="notification-group-copy">
                          <strong>{group.title}</strong>
                          <small>{group.description}</small>
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
                            <span>{item.label}</span>
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
                <p className="notification-settings-label">{"Ch\u1ebf \u0111\u1ed9 y\u00ean l\u1eb7ng"}</p>

                <div className="toggle-row notification-compact-row">
                  <div>
                    <p>{"T\u1ea1m ho\u00e3n khi \u0111ang t\u1eadp trung"}</p>
                    <small>{"Gom th\u00e0nh t\u00edch v\u00e0 streak \u0111\u1ec3 xem sau phi\u00ean."}</small>
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
                    <p>{"Gi\u1edd y\u00ean l\u1eb7ng"}</p>
                    <small>{"T\u1ea1m \u1ea9n nh\u1eafc nh\u1edf kh\u00f4ng quan tr\u1ecdng trong khung gi\u1edd n\u00e0y."}</small>
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
                    {"T\u1eeb"}
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
                    {"\u0110\u1ebfn"}
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
                    <p>{"T\u00f3m t\u1eaft cu\u1ed1i phi\u00ean"}</p>
                    <small>{"G\u1ed9p c\u00e1c c\u1eadp nh\u1eadt nh\u1ecf th\u00e0nh m\u1ed9t b\u1ea3n t\u00f3m t\u1eaft."}</small>
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
              <h3>Danh sách ứng dụng</h3>
              <p>Quản lý các ứng dụng luôn được phép hoặc luôn bị chặn.</p>
            </div>

            <div className="app-list-tabs">
              <button
                type="button"
                className={`app-list-tab ${appListTab === "whitelist" ? "app-list-tab-active" : ""}`}
                onClick={() => setAppListTab("whitelist")}
              >
                Whitelist ({appRules.filter((r) => r.ruleType === "WHITELIST").length})
              </button>
              <button
                type="button"
                className={`app-list-tab ${appListTab === "blacklist" ? "app-list-tab-active" : ""}`}
                onClick={() => setAppListTab("blacklist")}
              >
                Blacklist ({appRules.filter((r) => r.ruleType === "BLACKLIST").length})
              </button>
            </div>

            <div className="app-list-input-row">
              <input
                type="text"
                placeholder={
                  appListTab === "whitelist"
                    ? "Thêm từ khóa app luôn cho phép..."
                    : "Thêm từ khóa app luôn chặn..."
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
                {isAddingRule ? "Đang thêm..." : "+ Thêm"}
              </button>
            </div>

            <div className="tag-list">
              {currentList.length === 0 ? (
                <p className="tag-list-empty">Chưa có từ khóa nào.</p>
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
            <h3>Bảo mật &amp; Tài khoản</h3>

            <div className="security-list">
              <div className="security-row">
                <div className="security-info">
                  <span className="material-symbols-outlined security-icon">
                    password
                  </span>
                  <div>
                    <p>Mật khẩu</p>
                    <small>Cập nhật lần cuối: chưa rõ</small>
                  </div>
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  Thay đổi
                </button>
              </div>
            </div>

            <button className="logout-button" type="button" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              Đăng xuất
            </button>
            <button
              className="delete-account-button"
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <span className="material-symbols-outlined">delete_forever</span>
              Xóa tài khoản
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
            <h3>Đổi mật khẩu</h3>
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
              Mật khẩu hiện tại
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
              Mật khẩu mới
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
              Xác nhận mật khẩu mới
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
                Hủy
              </button>
              <button
                className="primary-button"
                type="submit"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? "Đang lưu..." : "Lưu thay đổi"}
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
            <h3>Thiết bị đăng nhập</h3>
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
                Chưa có dữ liệu thiết bị (tính năng đang hoàn thiện).
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
                    Thu hồi
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
            <h3>Xóa tài khoản</h3>
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
              Tài khoản sẽ bị xóa vĩnh viễn. Bạn sẽ không thể đăng nhập lại
              bằng tài khoản này, nhưng email có thể được dùng để đăng ký lại.
            </p>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingAccount}
              >
                Hủy
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? "Đang xóa..." : "Xóa tài khoản"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
