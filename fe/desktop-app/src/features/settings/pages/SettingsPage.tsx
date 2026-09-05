import { useState } from "react";
import "./SettingsPage.css";

type PersonalityCode = "INSPIRING" | "STRICT" | "CALM" | "FRIEND";
type Language = "vi" | "en";
type AppListTab = "whitelist" | "blacklist";

const aiOptions: {
  code: PersonalityCode;
  icon: string;
  className: string;
  title: string;
  description: string;
}[] = [
    {
      code: "INSPIRING",
      icon: "psychology",
      className: "ai-primary",
      title: "Người truyền cảm hứng",
      description: "Khích lệ nhẹ nhàng, tập trung vào tư duy tích cực.",
    },
    {
      code: "STRICT",
      icon: "sports",
      className: "ai-red",
      title: "Huấn luyện viên nghiêm khắc",
      description: "Đẩy bạn đến giới hạn, không khoan nhượng với sự xao nhãng.",
    },
    {
      code: "CALM",
      icon: "nature_people",
      className: "ai-green",
      title: "Bình yên & Thư thái",
      description: "Hướng dẫn thiền định, tập trung vào sự tĩnh lặng nội tâm.",
    },
    {
      code: "FRIEND",
      icon: "emoji_people",
      className: "ai-purple",
      title: "Người bạn đồng hành",
      description: "Trò chuyện vui vẻ, thoải mái như một người bạn thân.",
    },
  ];

const mockDevices = [
  { id: "1", name: "Windows PC - Chrome", lastActive: "Đang hoạt động" },
  { id: "2", name: "MacBook - Safari", lastActive: "3 ngày trước" },
];

export default function SettingsPage() {
  // ── Cấu hình AI ──
  const [activePersonality, setActivePersonality] =
    useState<PersonalityCode>("INSPIRING");
  const [selfAddress, setSelfAddress] = useState("");
  const [userAddress, setUserAddress] = useState("");

  // ── Ngôn ngữ ──
  const [language, setLanguage] = useState<Language>("vi");

  // ── Danh sách ứng dụng ──
  const [appListTab, setAppListTab] = useState<AppListTab>("whitelist");
  const [whitelist, setWhitelist] = useState<string[]>(["youtube", "notion"]);
  const [blacklist, setBlacklist] = useState<string[]>(["facebook", "tiktok"]);
  const [newKeyword, setNewKeyword] = useState("");

  // ── Thông báo ──
  const [warningWindowEnabled, setWarningWindowEnabled] = useState(true);
  const [soundReminderEnabled, setSoundReminderEnabled] = useState(false);

  // ── Bảo mật & Tài khoản ──
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const currentList = appListTab === "whitelist" ? whitelist : blacklist;
  const setCurrentList =
    appListTab === "whitelist" ? setWhitelist : setBlacklist;

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed || currentList.includes(trimmed)) return;
    setCurrentList((prev) => [...prev, trimmed]);
    setNewKeyword("");
    // TODO: nối API lưu app-rules
  };

  const handleRemoveKeyword = (keyword: string) => {
    setCurrentList((prev) => prev.filter((k) => k !== keyword));
    // TODO: nối API lưu app-rules
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
              {aiOptions.map((option) => {
                const isActive = option.code === activePersonality;
                return (
                  <article
                    key={option.code}
                    className={`ai-option ${isActive ? "ai-option-active" : ""}`}
                    onClick={() => {
                      setActivePersonality(option.code);
                      // TODO: nối API đổi personality
                    }}
                  >
                    {isActive && <span className="active-tag">ĐANG CHỌN</span>}
                    <span
                      className={`material-symbols-outlined icon-fill ai-icon ${option.className}`}
                    >
                      {option.icon}
                    </span>
                    <h4>{option.title}</h4>
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
                  value={selfAddress}
                  onChange={(e) => setSelfAddress(e.target.value)}
                />
              </label>
              <label>
                AI gọi bạn là
                <input
                  type="text"
                  placeholder="bạn"
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                />
              </label>
              <button
                className="primary-button ai-address-save"
                type="button"
                onClick={() => {
                  // TODO: nối API PUT /users/me/ai-address
                }}
              >
                Lưu thay đổi
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
                Whitelist ({whitelist.length})
              </button>
              <button
                type="button"
                className={`app-list-tab ${appListTab === "blacklist" ? "app-list-tab-active" : ""}`}
                onClick={() => setAppListTab("blacklist")}
              >
                Blacklist ({blacklist.length})
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
                onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
              />
              <button
                type="button"
                className="primary-button"
                onClick={handleAddKeyword}
              >
                + Thêm
              </button>
            </div>

            <div className="tag-list">
              {currentList.length === 0 ? (
                <p className="tag-list-empty">Chưa có từ khóa nào.</p>
              ) : (
                currentList.map((keyword) => (
                  <span
                    key={keyword}
                    className={`tag-chip ${appListTab === "blacklist" ? "tag-chip-danger" : ""}`}
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
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
                    <small>Cập nhật lần cuối: 3 tháng trước</small>
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

              <div className="security-row">
                <div className="security-info">
                  <span className="security-icon google-icon">G</span>
                  <div>
                    <p>Tài khoản Google</p>
                    <small>Đã liên kết</small>
                  </div>
                </div>
                <span className="material-symbols-outlined check-icon">
                  check_circle
                </span>
              </div>

              <div className="security-row">
                <div className="security-info">
                  <span className="material-symbols-outlined security-icon">
                    devices
                  </span>
                  <div>
                    <p>Thiết bị đăng nhập</p>
                    <small>{mockDevices.length} thiết bị đang hoạt động</small>
                  </div>
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => setIsDeviceModalOpen(true)}
                >
                  Quản lý
                </button>
              </div>
            </div>

            <button
              className="logout-button"
              type="button"
              onClick={() => {
                // TODO: nối logic đăng xuất
              }}
            >
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

          <form
            className="password-form"
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: nối API đổi mật khẩu
              setIsPasswordModalOpen(false);
            }}
          >
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
              <button className="primary-button" type="submit">
                Lưu thay đổi
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
            {mockDevices.map((device) => (
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
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal Xóa tài khoản ── */}
      <div
        className={`modal-overlay ${isDeleteModalOpen ? "" : "hidden"}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsDeleteModalOpen(false);
        }}
      >
        <div className={`modal-card ${isDeleteModalOpen ? "modal-card-open" : ""}`}>
          <div className="modal-header">
            <h3>Xóa tài khoản</h3>
            <button
              className="icon-button"
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
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
              >
                Hủy
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={() => {
                  // TODO: nối API xóa tài khoản
                  setIsDeleteModalOpen(false);
                }}
              >
                Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}