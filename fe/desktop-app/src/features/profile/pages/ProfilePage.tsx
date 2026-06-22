import { useEffect, useState } from "react";
import axios from "axios";
import "./ProfilePage.css";
import { profileApi } from "../api/profile.api";
import { parseApiError } from "../../../utils/error-mapper";
import type { ApiErrorResponse } from "../../../types";
import type { Gender } from "../types/profile.types";

type ProfileForm = {
  fullName: string;
  phoneNumber: string;
  gender: Gender;
  dateOfBirth: string;
  avatarUrl: string;
  personalityId: string;
};

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [personalityId, setPersonalityId] = useState("");

  const [imgError, setImgError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [initialProfile, setInitialProfile] = useState<ProfileForm | null>(
    null,
  );

  const initials = fullName.trim()
    ? fullName
        .trim()
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const displayAvatar = previewAvatar || avatarUrl;
  const formattedDateOfBirth = formatDateOfBirth(dateOfBirth);

  const applyProfileForm = (profile: ProfileForm) => {
    setFullName(profile.fullName);
    setPhoneNumber(profile.phoneNumber);
    setGender(profile.gender);
    setDateOfBirth(profile.dateOfBirth);
    setAvatarUrl(profile.avatarUrl);
    setPersonalityId(profile.personalityId);
    setImgError(false);
  };

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const user = await profileApi.getMyProfile();

        if (!mounted) return;

        const profile: ProfileForm = {
          fullName: user.fullName || "",
          phoneNumber: user.phoneNumber || "",
          gender: user.gender || "MALE",
          dateOfBirth: user.dob || user.dateOfBirth || "",
          avatarUrl: user.avatarUrl || "",
          personalityId:
            user.personalityId === undefined || user.personalityId === null
              ? ""
              : String(user.personalityId),
        };

        setInitialProfile(profile);
        applyProfileForm(profile);
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Không thể tải thông tin hồ sơ. Vui lòng thử lại.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleStartEdit = () => {
    setError("");
    setSaved(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (initialProfile) {
      applyProfileForm(initialProfile);
    }

    setPreviewAvatar("");
    setSelectedAvatar(null);
    setError("");
    setSaved(false);
    setIsEditing(false);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return;

    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedAvatar(file);
    setPreviewAvatar(URL.createObjectURL(file));
    setImgError(false);
  };

  const handleUploadAvatar = async () => {
    if (!isEditing || !selectedAvatar || uploadingAvatar) return;

    setError("");

    try {
      setUploadingAvatar(true);

      const updatedUser = await profileApi.updateAvatar({
        avatar: selectedAvatar,
      });

      setAvatarUrl(updatedUser.avatarUrl || "");
      setInitialProfile((prev) =>
        prev ? { ...prev, avatarUrl: updatedUser.avatarUrl || "" } : prev,
      );
      setPreviewAvatar("");
      setSelectedAvatar(null);
      setImgError(false);
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        const { globalMessage, fieldErrors } = parseApiError(err.response.data);
        setError(
          globalMessage ||
            Object.values(fieldErrors)[0] ||
            "Không thể upload avatar. Vui lòng thử lại.",
        );
      } else {
        setError("Không thể upload avatar. Vui lòng thử lại.");
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (saving || !isEditing) return;

    setError("");
    setSaved(false);

    const payload = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      gender,
      dateOfBirth: dateOfBirth || undefined,
      dob: dateOfBirth || undefined,
      personalityId: personalityId ? Number(personalityId) : undefined,
    };

    try {
      setSaving(true);

      const updatedUser = await profileApi.saveProfile(payload);

      const profile: ProfileForm = {
        fullName: updatedUser.fullName || "",
        phoneNumber: updatedUser.phoneNumber || "",
        gender: updatedUser.gender || "MALE",
        dateOfBirth: updatedUser.dob || updatedUser.dateOfBirth || "",
        avatarUrl: updatedUser.avatarUrl || "",
        personalityId:
          updatedUser.personalityId === undefined || updatedUser.personalityId === null
            ? ""
            : String(updatedUser.personalityId),
      };

      setInitialProfile(profile);
      applyProfileForm(profile);
      setIsEditing(false);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        const { globalMessage, fieldErrors } = parseApiError(err.response.data);
        setError(
          globalMessage ||
            Object.values(fieldErrors)[0] ||
            "Không thể lưu hồ sơ. Vui lòng thử lại.",
        );
      } else {
        setError("Không thể lưu hồ sơ. Vui lòng thử lại.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (changingPassword) return;

    setPasswordError("");
    setPasswordSaved(false);

    const validationError = validatePasswordChange({
      oldPassword,
      newPassword,
      confirmNewPassword,
    });

    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    try {
      setChangingPassword(true);
      await profileApi.changePassword({
        oldPassword,
        newPassword,
      });

      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        const { globalMessage, fieldErrors } = parseApiError(err.response.data);
        setPasswordError(
          globalMessage ||
            Object.values(fieldErrors)[0] ||
            "Không thể đổi mật khẩu, vui lòng thử lại",
        );
      } else {
        setPasswordError("Không thể đổi mật khẩu, vui lòng thử lại.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <h1>Thiết lập hồ sơ cá nhân</h1>
          <p>
            Nhập thông tin cơ bản để Focus Buddy cá nhân hóa trải nghiệm của bạn.
          </p>
        </div>

        <div className="top-avatar">
          {displayAvatar && !imgError ? (
            <img
              src={displayAvatar}
              alt="avatar"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </header>

      <main className="profile-body">
        <section className="profile-card">
          <div className="profile-card-stripe" />

          <div className="profile-card-content">
            <div className="profile-preview">
              <div className="avatar-preview-wrapper">
                <label
                  className={`avatar-preview ${isEditing ? "" : "locked"}`}
                  aria-label="Chọn ảnh đại diện"
                >
                  {displayAvatar && !imgError ? (
                    <img
                      src={displayAvatar}
                      alt="Avatar"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}

                  <span className="avatar-change-overlay">Đổi ảnh</span>

                  <input
                    className="avatar-file-input"
                    type="file"
                    accept="image/*"
                    disabled={!isEditing}
                    onChange={handleAvatarChange}
                  />
                </label>

                <small>Ảnh đại diện</small>

                {selectedAvatar && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handleUploadAvatar}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? "Đang upload..." : "Lưu ảnh"}
                  </button>
                )}
              </div>

              <div className="profile-preview-text">
                <h2>{fullName || "Tên của bạn"}</h2>
                <p>Thông tin hồ sơ Focus Buddy</p>
              </div>
            </div>

            <div className="divider" />

            <div className="form-grid">
              <FormField label="Họ và tên" required>
                <input
                  className="form-input"
                  value={fullName}
                  disabled={!isEditing}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                />
              </FormField>

              <FormField label="Số điện thoại">
                <input
                  className="form-input"
                  value={phoneNumber}
                  disabled={!isEditing}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </FormField>

              <FormField label="Giới tính">
                <select
                  className="form-input"
                  value={gender}
                  disabled={!isEditing}
                  onChange={(e) => setGender(e.target.value as Gender)}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </FormField>

              <FormField label="Ngày sinh">
                {isEditing ? (
                  <div className="date-input-shell">
                    <span
                      className={
                        formattedDateOfBirth
                          ? "date-input-display"
                          : "date-input-display placeholder"
                      }
                    >
                      {formattedDateOfBirth || "dd/mm/yyyy"}
                    </span>

                    <input
                      className="date-input-native"
                      type="date"
                      lang="en-GB"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                ) : (
                  <input
                    className="form-input"
                    value={formattedDateOfBirth}
                    disabled
                    placeholder="Chưa có ngày sinh"
                  />
                )}
              </FormField>

              <FormField label="Phong cách trợ lý">
                <select
                  className="form-input"
                  value={personalityId}
                  disabled={!isEditing}
                  onChange={(e) => setPersonalityId(e.target.value)}
                >
                  <option value="">Chọn personality</option>
                </select>
              </FormField>
            </div>

            <div className="divider" />

            {loading && <p className="profile-loading">Đang tải thông tin hồ sơ...</p>}

            {error && <p className="profile-error">{error}</p>}

            <div className="profile-actions">
              {isEditing ? (
                <>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving || uploadingAvatar}
                  >
                    Hủy
                  </button>

                  <button
                    className={`primary-button ${saved ? "saved" : ""}`}
                    onClick={handleSave}
                    disabled={saving || loading}
                    type="button"
                  >
                    {saving ? "Đang lưu..." : saved ? "Đã lưu!" : "Lưu thông tin"}
                  </button>
                </>
              ) : (
                <button
                  className={`primary-button ${saved ? "saved" : ""}`}
                  onClick={handleStartEdit}
                  disabled={loading}
                  type="button"
                >
                  {saved ? "Đã lưu!" : "Chỉnh sửa"}
                </button>
              )}
            </div>

            <div className="divider" />

            <form className="password-panel" onSubmit={handleChangePassword}>
              <div className="password-panel-header">
                <div>
                  <h3>Đổi mật khẩu</h3>
                  <p>Mật khẩu mới cần 6-32 ký tự, có chữ hoa và chữ thường.</p>
                </div>
              </div>

              <div className="form-grid">
                <FormField label="Mật khẩu hiện tại">
                  <input
                    className="form-input"
                    type="password"
                    autoComplete="current-password"
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </FormField>

                <FormField label="Mật khẩu mới">
                  <input
                    className="form-input"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Nhập mật khẩu mới"
                  />
                </FormField>

                <FormField label="Nhập lại mật khẩu mới">
                  <input
                    className="form-input"
                    type="password"
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </FormField>
              </div>

              {passwordError && <p className="profile-error">{passwordError}</p>}

              <div className="profile-actions">
                <button
                  className={`primary-button ${passwordSaved ? "saved" : ""}`}
                  type="submit"
                  disabled={changingPassword}
                >
                  {changingPassword
                    ? "Đang đổi..."
                    : passwordSaved
                      ? "Đã đổi!"
                      : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <label>
        {label}
        {required && <span>*</span>}
      </label>
      {children}
    </div>
  );
}

function formatDateOfBirth(value: string) {
  if (!value) return "";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function validatePasswordChange({
  oldPassword,
  newPassword,
  confirmNewPassword,
}: {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}) {
  if (!oldPassword || !newPassword || !confirmNewPassword) {
    return "Vui long nhap day du thong tin mat khau.";
  }

  if (newPassword.length < 6 || newPassword.length > 32) {
    return "Mat khau moi phai tu 6 den 32 ky tu.";
  }

  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) {
    return "Mat khau moi phai co it nhat 1 chu hoa va 1 chu thuong.";
  }

  if (newPassword !== confirmNewPassword) {
    return "Mat khau moi khong khop.";
  }

  return "";
}
