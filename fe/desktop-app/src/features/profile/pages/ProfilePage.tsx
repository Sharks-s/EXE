import { useState } from "react";
import axios from "axios";
import "./ProfilePage.css";
import { profileApi } from "../api/profile.api";
import { parseApiError } from "../../../utils/error-mapper";
import type { ApiErrorResponse } from "../../../types";
import type { Gender } from "../types/profile.types";

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
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");

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

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedAvatar(file);
    setPreviewAvatar(URL.createObjectURL(file));
    setImgError(false);
  };

  const handleUploadAvatar = async () => {
    if (!selectedAvatar || uploadingAvatar) return;

    setError("");

    try {
      setUploadingAvatar(true);

      const updatedUser = await profileApi.updateAvatar({
        avatar: selectedAvatar,
      });

      setAvatarUrl(updatedUser.avatarUrl || "");
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
    if (saving) return;

    setError("");
    setSaved(false);

    const payload = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      gender,
      dateOfBirth: dateOfBirth || undefined,
      personalityId: personalityId ? Number(personalityId) : undefined,
    };

    try {
      setSaving(true);

      const updatedUser = await profileApi.saveProfile(payload);

      setFullName(updatedUser.fullName || "");
      setPhoneNumber(updatedUser.phoneNumber || "");
      setGender(updatedUser.gender || "MALE");
      setDateOfBirth(updatedUser.dateOfBirth || "");
      setAvatarUrl(updatedUser.avatarUrl || "");

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
                <div className="avatar-preview">
                  {displayAvatar && !imgError ? (
                    <img
                      src={displayAvatar}
                      alt="Avatar"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <small>Ảnh đại diện</small>

                <input
                  className="form-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />

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
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                />
              </FormField>

              <FormField label="Số điện thoại">
                <input
                  className="form-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </FormField>

              <FormField label="Giới tính">
                <select
                  className="form-input"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </FormField>

              <FormField label="Ngày sinh">
                <input
                  className="form-input"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </FormField>

              <FormField label="Phong cách trợ lý">
                <select
                  className="form-input"
                  value={personalityId}
                  onChange={(e) => setPersonalityId(e.target.value)}
                >
                  <option value="">Chọn personality</option>
                </select>
              </FormField>
            </div>

            <div className="divider" />

            {error && <p className="profile-error">{error}</p>}

            <div className="profile-actions">
              <button className="secondary-button" type="button">
                Bỏ qua
              </button>

              <button
                className={`primary-button ${saved ? "saved" : ""}`}
                onClick={handleSave}
                disabled={saving}
                type="button"
              >
                {saving ? "Đang lưu..." : saved ? "Đã lưu!" : "Lưu thông tin"}
              </button>
            </div>
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