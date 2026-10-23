import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth";
import { locationApi } from "@/features/profile/api/location.api";
import type { Gender, LocationOption } from "@/features/profile/types/profile.types";
import { settingsApi } from "@/features/settings";
import type { PersonalityResponse } from "@/features/settings/types/settings.types";
import { toast } from "@/shared/store/toastStore";
import { onboardingApi } from "../api/onboarding.api";
import "./OnboardingPage.css";

const steps = ["Thông tin cơ bản", "Tính cách đồng hành", "Quyền sử dụng camera"];

const PERSONALITY_COPY: Record<string, { name: string; description: string; icon: string }> = {
  BASIC: {
    name: "Tính cách cơ bản",
    description: "Cân bằng, rõ ràng và hỗ trợ bạn tập trung một cách tự nhiên.",
    icon: "smart_toy",
  },
  SWEET: {
    name: "Tính cách ngọt ngào",
    description: "Ấm áp, dịu dàng và luôn khích lệ bạn bằng lời nói dễ thương.",
    icon: "volunteer_activism",
  },
  GRUMPY: {
    name: "Tính cách khó tính",
    description: "Nghiêm khắc, thẳng thắn và thúc bạn bám sát mục tiêu.",
    icon: "gavel",
  },
  FUNNY: {
    name: "Tính cách hài hước",
    description: "Vui nhộn, dí dỏm và giúp việc tập trung bớt căng thẳng.",
    icon: "sentiment_very_satisfied",
  },
};

export default function OnboardingPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [step, setStep] = useState(0);
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [wards, setWards] = useState<LocationOption[]>([]);
  const [personalities, setPersonalities] = useState<PersonalityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    gender: (user?.gender ?? "OTHER") as Gender,
    dateOfBirth: user?.dateOfBirth?.slice(0, 10) ?? "",
    addressLine: user?.addressLine ?? "",
    provinceCode: user?.provinceCode ? String(user.provinceCode) : "",
    wardCode: user?.wardCode ? String(user.wardCode) : "",
    personalityId: user?.personalityId ? Number(user.personalityId) : 0,
    cameraEnabled: false,
  });

  useEffect(() => {
    Promise.all([
      locationApi.getProvinces(),
      settingsApi.getPersonalities(),
      settingsApi.getUserSettings(),
    ])
      .then(([provinceList, personalityList, userSettings]) => {
        setProvinces(provinceList);
        setPersonalities(personalityList);
        setForm((current) => ({
          ...current,
          personalityId:
            current.personalityId ||
            personalityList.find((personality) => !personality.isPremium)?.id ||
            0,
          cameraEnabled: userSettings.cameraEnabled,
        }));
      })
      .catch(() => toast.error("Không thể tải dữ liệu onboarding."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const provinceCode = Number(form.provinceCode);
    if (!provinceCode) {
      setWards([]);
      return;
    }

    let cancelled = false;
    setIsLoadingWards(true);
    locationApi
      .getWards(provinceCode)
      .then((wardList) => {
        if (!cancelled) setWards(wardList);
      })
      .catch(() => {
        if (!cancelled) toast.error("Không thể tải danh sách phường/xã.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingWards(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.provinceCode]);

  const validateCurrentStep = () => {
    if (step === 0) {
      if (!form.fullName.trim() || !form.addressLine.trim()) {
        toast.error("Vui lòng nhập họ tên và địa chỉ.");
        return false;
      }
      if (!form.provinceCode || !form.wardCode) {
        toast.error("Vui lòng chọn tỉnh/thành và phường/xã.");
        return false;
      }
    }
    if (step === 1 && !form.personalityId) {
      toast.error("Vui lòng chọn một tính cách đồng hành.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) setStep((current) => Math.min(current + 1, 2));
  };

  const handleComplete = async () => {
    if (!validateCurrentStep() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const updatedUser = await onboardingApi.complete({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        addressLine: form.addressLine.trim(),
        provinceCode: Number(form.provinceCode),
        wardCode: Number(form.wardCode),
        personalityId: form.personalityId,
        cameraEnabled: form.cameraEnabled,
      });
      setUser(updatedUser);
      toast.success("Thiết lập ban đầu đã hoàn tất.");
    } catch {
      toast.error("Không thể hoàn tất thiết lập. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="onboarding-loading">Đang chuẩn bị thiết lập...</div>;
  }

  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <header className="onboarding-header">
          <span className="onboarding-eyebrow">FOCUS BUDDY</span>
          <h1>Chào mừng bạn</h1>
          <p>Thiết lập nhanh để người bạn đồng hành hỗ trợ bạn đúng cách.</p>
        </header>

        <div className="onboarding-steps">
          {steps.map((label, index) => (
            <div className={index <= step ? "onboarding-step active" : "onboarding-step"} key={label}>
              <span>{index + 1}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="onboarding-form-grid">
            <label>
              Họ và tên
              <input
                value={form.fullName}
                maxLength={100}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              />
            </label>
            <label>
              Số điện thoại
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
              />
            </label>
            <label>
              Giới tính
              <select
                value={form.gender}
                onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value as Gender }))}
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
                value={form.dateOfBirth}
                onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
              />
            </label>
            <label className="onboarding-full-field">
              Địa chỉ
              <input
                value={form.addressLine}
                maxLength={255}
                onChange={(event) => setForm((current) => ({ ...current, addressLine: event.target.value }))}
              />
            </label>
            <label>
              Tỉnh/thành
              <select
                value={form.provinceCode}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  provinceCode: event.target.value,
                  wardCode: "",
                }))}
              >
                <option value="">Chọn tỉnh/thành</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>{province.name}</option>
                ))}
              </select>
            </label>
            <label>
              Phường/xã
              <select
                value={form.wardCode}
                disabled={!form.provinceCode || isLoadingWards}
                onChange={(event) => setForm((current) => ({ ...current, wardCode: event.target.value }))}
              >
                <option value="">{isLoadingWards ? "Đang tải..." : "Chọn phường/xã"}</option>
                {wards.map((ward) => (
                  <option key={ward.code} value={ward.code}>{ward.name}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-personality-grid">
            {personalities.map((personality) => {
              const locked = personality.isPremium;
              const copy = PERSONALITY_COPY[personality.code];
              return (
                <button
                  type="button"
                  key={personality.id}
                  disabled={locked}
                  className={form.personalityId === personality.id ? "selected" : ""}
                  onClick={() => setForm((current) => ({ ...current, personalityId: personality.id }))}
                >
                  <span className="material-symbols-outlined">{locked ? "lock" : copy?.icon ?? "smart_toy"}</span>
                  <strong>{copy?.name ?? personality.name}</strong>
                  <p>{copy?.description ?? personality.description}</p>
                  {locked && <small>Dành cho gói Pro</small>}
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-camera-panel">
            <div className="onboarding-camera-icon">
              <span className="material-symbols-outlined">photo_camera</span>
            </div>
            <h2>Cho phép giám sát bằng camera?</h2>
            <p>
              Camera chỉ được bật trong các đợt quét của phiên tập trung để nhận biết tư thế và xao nhãng.
              Hình ảnh được xử lý cục bộ trên máy.
            </p>
            <button
              type="button"
              className={form.cameraEnabled ? "camera-consent enabled" : "camera-consent"}
              aria-pressed={form.cameraEnabled}
              onClick={() => setForm((current) => ({ ...current, cameraEnabled: !current.cameraEnabled }))}
            >
              <span>{form.cameraEnabled ? "Đã cho phép camera" : "Không sử dụng camera"}</span>
              <span className="camera-consent-track"><i /></span>
            </button>
            <small>Bạn có thể thay đổi lựa chọn này trong Cài đặt.</small>
          </div>
        )}

        <footer className="onboarding-actions">
          <button type="button" className="onboarding-back" disabled={step === 0 || isSubmitting} onClick={() => setStep((current) => current - 1)}>
            Quay lại
          </button>
          {step < 2 ? (
            <button type="button" className="onboarding-primary" onClick={handleNext}>Tiếp tục</button>
          ) : (
            <button type="button" className="onboarding-primary" disabled={isSubmitting} onClick={handleComplete}>
              {isSubmitting ? "Đang hoàn tất..." : "Bắt đầu sử dụng"}
            </button>
          )}
        </footer>
      </section>
    </main>
  );
}
