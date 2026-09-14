import type { KeyboardEvent } from "react";
import "./SettingsPage.css";
import { useSettings } from "../hooks/useSettings";

const PERSONALITY_ICON_MAP: Record<string, { icon: string; className: string }> = {
  INSPIRING: { icon: "emoji_objects", className: "ai-primary" },
  SWEET: { icon: "volunteer_activism", className: "ai-primary" },
  STRICT: { icon: "gavel", className: "ai-red" },
  MEAN: { icon: "local_fire_department", className: "ai-red" },
  CALM: { icon: "spa", className: "ai-green" },
  FRIEND: { icon: "diversity_1", className: "ai-purple" },
};

const DEFAULT_PERSONALITY_ICON = { icon: "smart_toy", className: "ai-primary" };

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

          {/* ── Thông báo ── */}
          <section className="card grid-right">
            <div className="card-intro">
              <h3>Thông báo</h3>
              <p>Tùy chỉnh cách ứng dụng nhắc nhở bạn.</p>
            </div>

            <div className="toggle-list">
              <div className="toggle-row">
                <div>
                  <p>Hiện cửa sổ cảnh báo khi xao nhãng</p>
                  <small>Bật cửa sổ Warning nổi lên khi phát hiện vi phạm.</small>
                </div>
                <button
                  type="button"
                  className={`toggle-switch ${warningWindowEnabled ? "toggle-switch-on" : ""}`}
                  onClick={() => setWarningWindowEnabled((v) => !v)}
                >
                  <span className="toggle-knob" />
                </button>
              </div>

              <div className="toggle-row">
                <div>
                  <p>Âm thanh nhắc nhở</p>
                  <small>Phát âm thanh khi AI gửi cảnh báo.</small>
                </div>
                <button
                  type="button"
                  className={`toggle-switch ${soundReminderEnabled ? "toggle-switch-on" : ""}`}
                  onClick={() => setSoundReminderEnabled((v) => !v)}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
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