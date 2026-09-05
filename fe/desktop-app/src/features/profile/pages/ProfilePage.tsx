import type { Gender } from "../types/profile.types";
import { formatMinutes, mockProfileExtras, useProfilePage } from "../hooks/useProfilePage";
import "./ProfilePage.css";

export default function ProfilePage() {
  const {
    avatarInputRef,
    yearSummary,
    daySummary,
    weekSummary,
    equippedPet,
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
              <p>Quản lý hồ sơ và hiệu suất học tập của bạn.</p>
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
                  {display.isPremium && <span className="badge badge-premium">Beginner</span>}
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
                <span className="material-symbols-outlined info-icon">smartphone</span>
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
                <span className="material-symbols-outlined info-icon">location_on</span>
                <div>
                  <small>Địa chỉ</small>
                  <p>{display.address}</p>
                </div>
              </div>
            </div>

            <button className="secondary-button" type="button" onClick={openProfileModal}>
              Cập nhật hồ sơ
            </button>
          </section>

          <section className="card productivity-card grid-right">
            <div className="card-header">
              <h3>Tổng quan hiệu suất</h3>
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
                  <span className="material-symbols-outlined">calendar_view_week</span>
                  Tuần này
                </span>
                <strong>{formatMinutes(weekSummary?.totalFocusMinutes)}</strong>
              </article>
              <article className="stat-box">
                <span>
                  <span className="material-symbols-outlined">linear_scale</span>
                  Phiên dài nhất
                </span>
                <strong>{formatMinutes(mockProfileExtras.longestSessionMinutes)}</strong>
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
                  <span className="material-symbols-outlined icon-fill">emoji_events</span>
                </span>
                <span className="achievement achievement-blue">
                  <span className="material-symbols-outlined icon-fill">dark_mode</span>
                </span>
                <span className="achievement achievement-green">
                  <span className="material-symbols-outlined icon-fill">sprint</span>
                </span>
                <span className="achievement achievement-more">
                  +{mockProfileExtras.achievementsMore}
                </span>
              </div>
            </div>
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
              <button className="ghost-button" type="button" onClick={closeProfileModal}>
                Hủy
              </button>
              <button className="primary-button" type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}