import { useState, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  authSession,
  logoutService,
  authStorage,
  useAuthStore,
} from "@/features/auth";
import { settingsApi } from "../api/settings.api";
import type { PersonalityResponse } from "../types/settings.types";
import { profileApi } from "@/features/profile";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/shared/store/toastStore";
import "./SettingsPage.css";
import type { AppRuleResponse } from "../types/settings.types";

type Language = "vi" | "en";
type AppListTab = "whitelist" | "blacklist";

interface DeviceInfo {
  id: string;
  name: string;
  lastActive: string;
}

const PERSONALITY_ICON_MAP: Record<string, { icon: string; className: string }> = {
  INSPIRING: { icon: "psychology", className: "ai-primary" },
  STRICT: { icon: "sports", className: "ai-red" },
  CALM: { icon: "nature_people", className: "ai-green" },
  FRIEND: { icon: "emoji_people", className: "ai-purple" },
};

const DEFAULT_PERSONALITY_ICON = { icon: "psychology", className: "ai-primary" };

export default function SettingsPage() {
  // ── Cấu hình AI ──
  const [personalities, setPersonalities] = useState<PersonalityResponse[]>([]);
  const [activePersonalityId, setActivePersonalityId] = useState<number | null>(null);
  const [isSavingPersonality, setIsSavingPersonality] = useState(false);
  const [selfAddress, setSelfAddress] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [isSavingAiAddress, setIsSavingAiAddress] = useState(false);

  // ── Ngôn ngữ ── (TODO: nối i18n thật)
  const [language, setLanguage] = useState<Language>("vi");

  // ── Danh sách ứng dụng ── (TODO: nối API app-rules ở Việc 4)
  const [appListTab, setAppListTab] = useState<AppListTab>("whitelist");
  const [appRules, setAppRules] = useState<AppRuleResponse[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [isAddingRule, setIsAddingRule] = useState(false);

  // ── Thông báo ── (TODO: nối API cấu hình thông báo ở Việc 6)
  const [warningWindowEnabled, setWarningWindowEnabled] = useState(true);
  const [soundReminderEnabled, setSoundReminderEnabled] = useState(false);

  // ── Bảo mật & Tài khoản ──
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Danh sách thiết bị — TODO: nối API liệt kê thiết bị thật ở Việc 3, hiện để rỗng
  const [devices] = useState<DeviceInfo[]>([]);

  useEffect(() => {
    Promise.all([
      profileApi.getMyProfile(),
      settingsApi.getPersonalities(),
      settingsApi.getMyAppRules(),
    ])
      .then(([profile, personalityList, ruleList]) => {
        setSelfAddress(profile.aiSelfAddress ?? "");
        setUserAddress(profile.aiUserAddress ?? "");
        setActivePersonalityId(
          profile.personalityId != null ? Number(profile.personalityId) : null
        );
        setPersonalities(personalityList);
        setAppRules(ruleList);
      })
      .catch(() => {
        toast.error("Không thể tải cấu hình.");
      });
  }, []);

  const currentRuleType = appListTab === "whitelist" ? "WHITELIST" : "BLACKLIST";
  const currentList = appRules.filter((r) => r.ruleType === currentRuleType);

  const handleAddKeyword = async () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed || isAddingRule) return;

    if (currentList.some((r) => r.keyword === trimmed)) {
      toast.error("Từ khóa này đã tồn tại.");
      return;
    }

    try {
      setIsAddingRule(true);
      const created = await settingsApi.createAppRule({
        keyword: trimmed,
        ruleType: currentRuleType,
      });
      setAppRules((prev) => [...prev, created]);
      setNewKeyword("");
    } catch {
      toast.error("Không thể thêm từ khóa.");
    } finally {
      setIsAddingRule(false);
    }
  };

  const handleRemoveKeyword = async (ruleId: number) => {
    const previousRules = appRules;
    setAppRules((prev) => prev.filter((r) => r.id !== ruleId)); // optimistic update

    try {
      await settingsApi.deleteAppRule(ruleId);
    } catch {
      setAppRules(previousRules); // rollback nếu lỗi
      toast.error("Không thể xóa từ khóa.");
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await profileApi.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setIsPasswordModalOpen(false);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Đã đổi mật khẩu.");
    } catch {
      toast.error("Không thể đổi mật khẩu.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutService();
      useAuthStore.setState({ user: null });
    } catch {
      toast.error("Không thể đăng xuất.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await profileApi.deleteMyAccount();
      authStorage.clear();
      await authSession.markLoggedOut();
      queryClient.clear();
      useAuthStore.setState({ user: null });
      toast.success("Tài khoản đã được xóa.");
    } catch {
      toast.error("Không thể xóa tài khoản.");
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleSaveAiAddress = async () => {
    try {
      setIsSavingAiAddress(true);
      await settingsApi.updateAiAddress({
        aiSelfAddress: selfAddress.trim(),
        aiUserAddress: userAddress.trim(),
      });
      toast.success("Đã lưu xưng hô AI.");
    } catch {
      toast.error("Không thể lưu xưng hô AI.");
    } finally {
      setIsSavingAiAddress(false);
    }
  };

  const handleSelectPersonality = async (personalityId: number) => {
    if (personalityId === activePersonalityId || isSavingPersonality) return;

    const previousId = activePersonalityId;
    setActivePersonalityId(personalityId); // optimistic update

    try {
      setIsSavingPersonality(true);
      await settingsApi.updateUserPersonality({ personalityId });
      toast.success("Đã đổi cá tính AI.");
    } catch {
      setActivePersonalityId(previousId); // rollback nếu lỗi
      toast.error("Không thể đổi cá tính AI.");
    } finally {
      setIsSavingPersonality(false);
    }
  };

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
                className={`language-option ${language === "vi" ? "language-option-active" : ""}`}
                onClick={() => setLanguage("vi")}
              >
                <span className="language-flag">🇻🇳</span>
                <span>Tiếng Việt</span>
                {language === "vi" && (
                  <span className="material-symbols-outlined check-icon">
                    check_circle
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`language-option ${language === "en" ? "language-option-active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                <span className="language-flag">🇬🇧</span>
                <span>English</span>
                {language === "en" && (
                  <span className="material-symbols-outlined check-icon">
                    check_circle
                  </span>
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

              {/* <div className="security-row">
                <div className="security-info">
                  <span className="material-symbols-outlined security-icon">
                    devices
                  </span>
                  <div>
                    <p>Thiết bị đăng nhập</p>
                    <small>{devices.length} thiết bị đang hoạt động</small>
                  </div>
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setIsDeviceModalOpen(true)}
                >
                  Quản lý
                </button>
              </div> */}
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