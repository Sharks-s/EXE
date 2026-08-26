import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import { analyticsApi } from "../../analytics/api/analytics.api";
import type { AnalyticsSummary } from "../../analytics/types/analytics.types";
import { authSession } from "../../auth/services/auth.session";
import { logoutService } from "../../auth/services/auth.service";
import { authStorage } from "../../auth/services/auth.storage";
import { useAuthStore } from "../../auth/stores/authStore";
import { petApi } from "../../pet/api/petApi";
import type { UserPet } from "../../pet/types/pet.type";
import { queryClient } from "../../../lib/queryClient";
import { toast } from "../../../shared/store/toastStore";
import { locationApi } from "../api/location.api";
import { profileApi } from "../api/profile.api";
import type {
  Gender,
  LocationOption,
  UserSummary,
} from "../types/profile.types";
import "./ProfilePage.css";

const fallbackAvatar =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBxwHxTE-WFE2W2qVXDxYWaMKEka0GAlMD4scsRy9VSrypOEaIiRsg-Ceu8RxsNEPFDhwOIAI0gUPJMmCn7QYmvURSCJNk4DX9NWHeTizUx0iWaI-cE1Kh76AYiGGOd7UMGGzUFOiX46-xSQzFWePmqRm3aj84lzuq9jVdmid7WFFmOSpRiaB9RQf1jDRzVo3IxtL7cVuoqbtaDA3Mj7LeY-QNlKN2KcxbsIET17F11KZ3AiCVIh35Fhsm7nuL3SJG7diXBUnsIbns";

const mockProfileExtras = {
  joinedLabel: "Tham gia từ tháng 3, 2023",
  location: "TP. Hồ Chí Minh",
  rank: "Expert",
  isPremium: true,
  currentStreakDays: 25,
  longestSessionMinutes: 120,
  passwordUpdatedLabel: "Cập nhật lần cuối: 3 tháng trước",
  googleLinked: true,
  activeDevices: 2,
  achievementsMore: 12,
};

const mockAiOptions = [
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

type ProfileFormState = {
  fullName: string;
  phoneNumber: string;
  gender: Gender;
  dateOfBirth: string;
  addressLine: string;
  provinceCode: string;
  wardCode: string;
};

type PasswordFormState = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyPasswordForm: PasswordFormState = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const formatMinutes = (minutes?: number) => {
  return `${Math.max(Math.round(minutes ?? 0), 0)} phút`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN").format(date);
};

const formatAddress = (profile: UserSummary | null) => {
  const parts = [
    profile?.addressLine,
    profile?.wardName,
    profile?.provinceName,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Chưa cập nhật";
};

const formatJoinedLabel = (value?: string | null) => {
  if (!value) return mockProfileExtras.joinedLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return mockProfileExtras.joinedLabel;

  const label = new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(date);

  return `Tham gia từ ${label}`;
};

const formatPasswordUpdatedLabel = (value?: string | null) => {
  if (!value) return mockProfileExtras.passwordUpdatedLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return mockProfileExtras.passwordUpdatedLabel;
  }

  return `Cập nhật lần cuối: ${new Intl.DateTimeFormat("vi-VN").format(date)}`;
};

const toProfileForm = (profile: UserSummary | null): ProfileFormState => ({
  fullName: profile?.fullName ?? "",
  phoneNumber: profile?.phoneNumber ?? "",
  gender: profile?.gender ?? "OTHER",
  dateOfBirth: (profile?.dateOfBirth ?? profile?.dob ?? "").slice(0, 10),
  addressLine: profile?.addressLine ?? "",
  provinceCode: profile?.provinceCode ? String(profile.provinceCode) : "",
  wardCode: profile?.wardCode ? String(profile.wardCode) : "",
});

export default function ProfilePage() {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<UserSummary | null>(null);
  const [yearSummary, setYearSummary] = useState<AnalyticsSummary | null>(null);
  const [daySummary, setDaySummary] = useState<AnalyticsSummary | null>(null);
  const [weekSummary, setWeekSummary] = useState<AnalyticsSummary | null>(null);
  const [equippedPet, setEquippedPet] = useState<UserPet | null>(null);
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [wards, setWards] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() =>
    toProfileForm(null),
  );
  const [passwordForm, setPasswordForm] =
    useState<PasswordFormState>(emptyPasswordForm);

  useEffect(() => {
    let cancelled = false;

    const loadProfileData = async () => {
      setIsLoading(true);

      const [profileResult, dayResult, weekResult, yearResult, petsResult] =
        await Promise.allSettled([
          profileApi.getMyProfile(),
          analyticsApi.getSummary({ range: "DAY" }),
          analyticsApi.getSummary({ range: "WEEK" }),
          analyticsApi.getSummary({ range: "YEAR" }),
          petApi.getMyPets(),
        ]);

      if (cancelled) return;

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value);
        setProfileForm(toProfileForm(profileResult.value));
      } else {
        toast.error("Không thể tải thông tin hồ sơ.");
      }

      if (dayResult.status === "fulfilled") setDaySummary(dayResult.value);
      if (weekResult.status === "fulfilled") setWeekSummary(weekResult.value);
      if (yearResult.status === "fulfilled") setYearSummary(yearResult.value);
      if (petsResult.status === "fulfilled") {
        setEquippedPet(
          petsResult.value.find((pet) => pet.equipped) ??
          petsResult.value[0] ??
          null,
        );
      }

      setIsLoading(false);
    };

    loadProfileData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProvinces = async () => {
      try {
        const data = await locationApi.getProvinces();
        if (!cancelled) setProvinces(data);
      } catch {
        if (!cancelled) toast.error("Không thể tải danh sách tỉnh/thành.");
      }
    };

    loadProvinces();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const provinceCode = Number(profileForm.provinceCode);

    if (!provinceCode) {
      setWards([]);
      return;
    }

    const loadWards = async () => {
      try {
        setIsLoadingWards(true);
        const data = await locationApi.getWards(provinceCode);
        if (!cancelled) setWards(data);
      } catch {
        if (!cancelled) {
          setWards([]);
          toast.error("Không thể tải danh sách phường/xã.");
        }
      } finally {
        if (!cancelled) setIsLoadingWards(false);
      }
    };

    loadWards();

    return () => {
      cancelled = true;
    };
  }, [profileForm.provinceCode]);

  const display = useMemo(() => {
    const roles = profile?.roles ?? [];
    const hasPremiumRole = roles.some((role) =>
      role.toLowerCase().includes("premium"),
    );
    const activeAiCode = profile?.personalityCode ?? mockAiOptions[0].code;

    return {
      name: profile?.fullName?.trim() || "Chưa cập nhật",
      email: profile?.email || "Chưa cập nhật",
      phone: profile?.phoneNumber || "Chưa cập nhật",
      dob: formatDate(profile?.dateOfBirth ?? profile?.dob),
      address: formatAddress(profile),
      passwordUpdatedLabel: formatPasswordUpdatedLabel(
        profile?.passwordUpdatedAt,
      ),
      avatarUrl: profile?.avatarUrl || fallbackAvatar,
      meta: `${formatJoinedLabel(profile?.createdAt)} • ${profile?.provinceName ?? mockProfileExtras.location
        }`,
      isPremium: hasPremiumRole || mockProfileExtras.isPremium,
      activeAiCode,
    };
  }, [profile]);

  const openPasswordModal = () => setIsPasswordModalOpen(true);

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordForm(emptyPasswordForm);
  };

  const openProfileModal = () => {
    setProfileForm(toProfileForm(profile));
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => setIsProfileModalOpen(false);

  const openDeleteModal = () => setIsDeleteModalOpen(true);

  const closeDeleteModal = () => {
    if (!isDeletingAccount) setIsDeleteModalOpen(false);
  };

  const handlePasswordOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) closePasswordModal();
  };

  const handleProfileOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) closeProfileModal();
  };

  const handleDeleteOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) closeDeleteModal();
  };

  const handleAvatarClick = () => {
    if (!isUploadingAvatar) avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const avatar = event.target.files?.[0];
    if (!avatar) return;

    try {
      setIsUploadingAvatar(true);
      const updatedProfile = await profileApi.updateAvatar({ avatar });
      setProfile(updatedProfile);
      toast.success("Đã cập nhật ảnh đại diện.");
    } catch {
      toast.error("Không thể cập nhật ảnh đại diện.");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profileForm.addressLine.trim()) {
      toast.error("Vui lòng nhập địa chỉ.");
      return;
    }

    if (profileForm.addressLine.trim().length > 255) {
      toast.error("Địa chỉ không được vượt quá 255 ký tự.");
      return;
    }

    if (!profileForm.provinceCode) {
      toast.error("Vui lòng chọn tỉnh/thành.");
      return;
    }

    if (!profileForm.wardCode) {
      toast.error("Vui lòng chọn phường/xã.");
      return;
    }

    try {
      setIsSavingProfile(true);
      const updatedProfile = await profileApi.saveProfile({
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber.trim() || undefined,
        gender: profileForm.gender,
        dateOfBirth: profileForm.dateOfBirth || undefined,
        addressLine: profileForm.addressLine.trim(),
        provinceCode: Number(profileForm.provinceCode),
        wardCode: Number(profileForm.wardCode),
      });
      setProfile(updatedProfile);
      setIsProfileModalOpen(false);
      toast.success("Đã cập nhật hồ sơ.");
    } catch {
      toast.error("Không thể cập nhật hồ sơ.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
      closePasswordModal();
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
      setProfile(null);
      useAuthStore.setState({ user: null });
      toast.success("Tài khoản đã được xóa.");
    } catch {
      toast.error("Không thể xóa tài khoản.");
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div>
      <main className="main-content">
        <header className="mobile-header">
          <span className="material-symbols-outlined mobile-menu-icon">menu</span>
          <h1>Hồ sơ người dùng</h1>
          <div className="mobile-header-spacer" />
        </header>

        <div className="page-grid">
          <header className="app-page-header profile-page-header grid-full">
            <div className="app-page-title">
              <div className="app-page-title-row">
                <span className="app-page-title-icon">
                  <span className="material-symbols-outlined">manage_accounts</span>
                </span>
                <h1>Hồ sơ người dùng</h1>
              </div>
              <p>Quản lý hồ sơ, hiệu suất và bảo mật tài khoản.</p>
            </div>
          </header>

          <section className="hero-card grid-full">
            <div className="hero-blob" />

            <button
              className="avatar-wrapper"
              type="button"
              onClick={handleAvatarClick}
              title="Cập nhật ảnh đại diện"
            >
              <div className="avatar-frame">
                <img src={display.avatarUrl} alt="Ảnh đại diện" />
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
                <h2>{isLoading ? "Đang tải..." : display.name}</h2>
                <div className="badge-group">
                  {display.isPremium && (
                    <span className="badge badge-premium">Beginner</span>
                  )}
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
                  {yearSummary?.currentStreakDays ??
                    mockProfileExtras.currentStreakDays}
                </strong>
                <span>Ngày liên tục</span>
              </article>
              <article className="mini-stat-card">
                <span className="material-symbols-outlined icon-fill stat-blue">
                  check_circle
                </span>
                <strong>{yearSummary?.totalSessions ?? 0}</strong>
                <span>Phiên tập trung</span>
              </article>
              <article className="mini-stat-card">
                <span className="material-symbols-outlined icon-fill stat-green">
                  timer
                </span>
                <strong>{formatMinutes(yearSummary?.totalFocusMinutes)}</strong>
                <span>Tổng thời gian</span>
              </article>
            </div>
          </section>

          <section className="card profile-card grid-left">
            <div className="card-header">
              <h3>Thông tin cá nhân</h3>
              <button
                className="icon-button"
                type="button"
                title="Chỉnh sửa hồ sơ"
                onClick={openProfileModal}
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>

            <div className="info-list">
              <div className="info-row">
                <span className="material-symbols-outlined info-icon">person</span>
                <div>
                  <small>Tên hiển thị</small>
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
                <span className="material-symbols-outlined info-icon">
                  smartphone
                </span>
                <div>
                  <small>Số điện thoại</small>
                  <p>{display.phone}</p>
                </div>
              </div>
              <div className="info-row">
                <span className="material-symbols-outlined info-icon">cake</span>
                <div>
                  <small>Ngày sinh</small>
                  <p>{display.dob}</p>
                </div>
              </div>
              <div className="info-row">
                <span className="material-symbols-outlined info-icon">
                  location_on
                </span>
                <div>
                  <small>Địa chỉ</small>
                  <p>{display.address}</p>
                </div>
              </div>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={openProfileModal}
            >
              Cập nhật hồ sơ
            </button>
          </section>

          <section className="card productivity-card grid-right">
            <div className="card-header">
              <h3>Tổng quan hiệu suất</h3>
              {/* <a href="#">Xem chi tiết</a> */}
            </div>

            <div className="productivity-grid">
              <article className="stat-box">
                <span>
                  <span className="material-symbols-outlined">today</span>
                  Hôm nay
                </span>
                <strong>{formatMinutes(daySummary?.totalFocusMinutes)}</strong>
              </article>
              <article className="stat-box">
                <span>
                  <span className="material-symbols-outlined">
                    calendar_view_week
                  </span>
                  Tuần này
                </span>
                <strong>{formatMinutes(weekSummary?.totalFocusMinutes)}</strong>
              </article>
              <article className="stat-box">
                <span>
                  <span className="material-symbols-outlined">linear_scale</span>
                  Phiên dài nhất
                </span>
                <strong>
                  {formatMinutes(mockProfileExtras.longestSessionMinutes)}
                </strong>
              </article>
              <article className="stat-box mascot-box">
                <div>
                  <span>
                    <span className="material-symbols-outlined">pets</span>
                    Mascot
                  </span>
                  <strong>{equippedPet?.code ?? "Chưa trang bị"}</strong>
                </div>
                <div className="mascot-icon">
                  <span className="material-symbols-outlined icon-fill">
                    <img src={equippedPet?.imageUrl} alt="" />
                  </span>
                </div>
              </article>
            </div>

            <div className="achievement-section">
              <h4>Thành tựu gần đây</h4>
              <div className="achievement-list">
                <span className="achievement achievement-yellow">
                  <span className="material-symbols-outlined icon-fill">
                    emoji_events
                  </span>
                </span>
                <span className="achievement achievement-blue">
                  <span className="material-symbols-outlined icon-fill">
                    dark_mode
                  </span>
                </span>
                <span className="achievement achievement-green">
                  <span className="material-symbols-outlined icon-fill">
                    sprint
                  </span>
                </span>
                <span className="achievement achievement-more">
                  +{mockProfileExtras.achievementsMore}
                </span>
              </div>
            </div>
          </section>

          <section className="card ai-card grid-bottom-left">
            <div className="card-intro">
              <h3>Tính cách Trợ lý AI</h3>
              <p>
                Chọn phong cách tương tác của trợ lý trong các phiên làm việc.
              </p>
            </div>

            <div className="ai-grid">
              {mockAiOptions.map((option) => {
                const isActive = option.code === display.activeAiCode;

                return (
                  <article
                    className={`ai-option ${isActive ? "ai-option-active" : ""}`}
                    key={option.code}
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
          </section>

          <section className="card security-card grid-bottom-right">
            <h3>Bảo mật &amp; Tài khoản</h3>

            <div className="security-list">
              <div className="security-row">
                <div className="security-info">
                  <span className="material-symbols-outlined security-icon">
                    password
                  </span>
                  <div>
                    <p>Mật khẩu</p>
                    <small>{display.passwordUpdatedLabel}</small>
                  </div>
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={openPasswordModal}
                >
                  Thay đổi
                </button>
              </div>

              <div className="security-row">
                <div className="security-info">
                  <span className="security-icon google-icon">G</span>
                  <div>
                    <p>Tài khoản Google</p>
                    <small>
                      {mockProfileExtras.googleLinked
                        ? "Đã liên kết"
                        : "Chưa liên kết"}
                    </small>
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
                    <small>
                      {mockProfileExtras.activeDevices} thiết bị đang hoạt động
                    </small>
                  </div>
                </div>
                <button className="text-button" type="button">
                  Quản lý
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
              onClick={openDeleteModal}
            >
              <span className="material-symbols-outlined">delete_forever</span>
              Xóa tài khoản
            </button>
          </section>
        </div>
      </main>

      <div
        className={`modal-overlay ${isProfileModalOpen ? "" : "hidden"}`}
        onClick={handleProfileOverlayClick}
      >
        <div className={`modal-card ${isProfileModalOpen ? "modal-card-open" : ""}`}>
          <div className="modal-header">
            <h3>Cập nhật hồ sơ</h3>
            <button className="icon-button" type="button" onClick={closeProfileModal}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form className="password-form profile-form" onSubmit={handleProfileSubmit}>
            <label>
              Tên hiển thị
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
              Số điện thoại
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
              Giới tính
              <select
                value={profileForm.gender}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    gender: event.target.value as Gender,
                  }))
                }
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </label>
            <label>
              Ngày sinh
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
              Địa chỉ
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
              Tỉnh/thành
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
                <option value="">Chọn tỉnh/thành</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Phường/xã
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
                  {isLoadingWards ? "Đang tải..." : "Chọn phường/xã"}
                </option>
                {wards.map((ward) => (
                  <option key={ward.code} value={ward.code}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={closeProfileModal}
              >
                Hủy
              </button>
              <button
                className="primary-button"
                type="submit"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className={`modal-overlay ${isPasswordModalOpen ? "" : "hidden"}`}
        onClick={handlePasswordOverlayClick}
      >
        <div className={`modal-card ${isPasswordModalOpen ? "modal-card-open" : ""}`}>
          <div className="modal-header">
            <h3>Đổi mật khẩu</h3>
            <button className="icon-button" type="button" onClick={closePasswordModal}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form className="password-form" onSubmit={handlePasswordSubmit}>
            <label>
              Mật khẩu hiện tại
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    oldPassword: event.target.value,
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
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: event.target.value,
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
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
                required
              />
            </label>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={closePasswordModal}
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

      <div
        className={`modal-overlay ${isDeleteModalOpen ? "" : "hidden"}`}
        onClick={handleDeleteOverlayClick}
      >
        <div className={`modal-card ${isDeleteModalOpen ? "modal-card-open" : ""}`}>
          <div className="modal-header">
            <h3>Xóa tài khoản</h3>
            <button
              className="icon-button"
              type="button"
              onClick={closeDeleteModal}
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
                onClick={closeDeleteModal}
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
