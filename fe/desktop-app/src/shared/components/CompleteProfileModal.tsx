import { useEffect, useState } from "react";
import { locationApi } from "../../features/profile/api/location.api";
import { profileApi } from "../../features/profile/api/profile.api";
import type {
  Gender,
  LocationOption,
} from "../../features/profile/types/profile.types";
import "./CompleteProfileModal.css";

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Gọi sau khi lưu thành công để parent có thể cập nhật state */
  onCompleted?: () => void;
}

export default function CompleteProfileModal({
  isOpen,
  onClose,
  onCompleted,
}: CompleteProfileModalProps) {
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [wards, setWards] = useState<LocationOption[]>([]);

  const [saving, setSaving] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadProvinces = async () => {
      try {
        const data = await locationApi.getProvinces();
        if (!cancelled) setProvinces(data);
      } catch {
        if (!cancelled) setError("Không thể tải danh sách tỉnh/thành.");
      }
    };

    loadProvinces();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const selectedProvinceCode = Number(provinceCode);

    if (!selectedProvinceCode) {
      setWards([]);
      return;
    }

    const loadWards = async () => {
      try {
        setLoadingWards(true);
        const data = await locationApi.getWards(selectedProvinceCode);
        if (!cancelled) setWards(data);
      } catch {
        if (!cancelled) {
          setWards([]);
          setError("Không thể tải danh sách phường/xã.");
        }
      } finally {
        if (!cancelled) setLoadingWards(false);
      }
    };

    loadWards();

    return () => {
      cancelled = true;
    };
  }, [isOpen, provinceCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!fullName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

    if (!addressLine.trim()) {
      setError("Vui lòng nhập địa chỉ.");
      return;
    }

    if (addressLine.trim().length > 255) {
      setError("Địa chỉ không được vượt quá 255 ký tự.");
      return;
    }

    if (!provinceCode) {
      setError("Vui lòng chọn tỉnh/thành.");
      return;
    }

    if (!wardCode) {
      setError("Vui lòng chọn phường/xã.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await profileApi.saveProfile({
        fullName: fullName.trim(),
        gender,
        dateOfBirth: dateOfBirth || undefined,
        dob: dateOfBirth || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        addressLine: addressLine.trim(),
        provinceCode: Number(provinceCode),
        wardCode: Number(wardCode),
      });

      onCompleted?.();
      onClose();
    } catch {
      setError("Không thể lưu thông tin. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cpm-backdrop" onClick={onClose}>
      <div
        className="cpm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cpm-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative stripe */}
        <div className="cpm-stripe" />

        <div className="cpm-body">
          {/* Header */}
          <div className="cpm-header">
            <div className="cpm-icon">👤</div>
            <div>
              <h2 id="cpm-title" className="cpm-title">
                Hoàn thiện hồ sơ
              </h2>
              <p className="cpm-subtitle">
                Hãy nhập thông tin cơ bản để Focus Buddy cá nhân hoá trải nghiệm
                cho bạn 🚀
              </p>
            </div>
          </div>

          {/* Form */}
          <form className="cpm-form" onSubmit={handleSubmit} noValidate>
            {/* Họ và tên */}
            <div className="cpm-field">
              <label htmlFor="cpm-fullname" className="cpm-label">
                Họ và tên <span className="cpm-required">*</span>
              </label>
              <input
                id="cpm-fullname"
                className="cpm-input"
                type="text"
                placeholder="Nhập họ và tên của bạn"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError("");
                }}
                autoFocus
                autoComplete="name"
              />
            </div>

            {/* Giới tính & Ngày sinh — 2 cột */}
            <div className="cpm-row">
              <div className="cpm-field">
                <label htmlFor="cpm-gender" className="cpm-label">
                  Giới tính
                </label>
                <select
                  id="cpm-gender"
                  className="cpm-input"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div className="cpm-field">
                <label htmlFor="cpm-dob" className="cpm-label">
                  Ngày sinh
                </label>
                <input
                  id="cpm-dob"
                  className="cpm-input"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="cpm-field">
              <label htmlFor="cpm-phone" className="cpm-label">
                Số điện thoại
              </label>
              <input
                id="cpm-phone"
                className="cpm-input"
                type="tel"
                placeholder="Nhập số điện thoại (tuỳ chọn)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div className="cpm-field">
              <label htmlFor="cpm-address" className="cpm-label">
                Địa chỉ <span className="cpm-required">*</span>
              </label>
              <input
                id="cpm-address"
                className="cpm-input"
                type="text"
                placeholder="Nhập số nhà, tên đường"
                value={addressLine}
                maxLength={255}
                onChange={(e) => {
                  setAddressLine(e.target.value);
                  setError("");
                }}
                autoComplete="street-address"
              />
            </div>

            <div className="cpm-row">
              <div className="cpm-field">
                <label htmlFor="cpm-province" className="cpm-label">
                  Tỉnh/thành <span className="cpm-required">*</span>
                </label>
                <select
                  id="cpm-province"
                  className="cpm-input"
                  value={provinceCode}
                  onChange={(e) => {
                    setProvinceCode(e.target.value);
                    setWardCode("");
                    setError("");
                  }}
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cpm-field">
                <label htmlFor="cpm-ward" className="cpm-label">
                  Phường/xã <span className="cpm-required">*</span>
                </label>
                <select
                  id="cpm-ward"
                  className="cpm-input"
                  value={wardCode}
                  disabled={!provinceCode || loadingWards}
                  onChange={(e) => {
                    setWardCode(e.target.value);
                    setError("");
                  }}
                >
                  <option value="">
                    {loadingWards ? "Đang tải..." : "Chọn phường/xã"}
                  </option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="cpm-error">{error}</p>}

            {/* Actions */}
            <div className="cpm-actions">
              <button
                type="button"
                className="cpm-btn-skip"
                onClick={onClose}
                disabled={saving}
              >
                Bỏ qua
              </button>
              <button
                type="submit"
                className="cpm-btn-save"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="cpm-spinner" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu thông tin ✓"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
