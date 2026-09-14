import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import { analyticsApi, type AnalyticsSummary } from "@/features/analytics";
import { achievementsApi, type Achievement } from "@/features/achievements";
import { toast } from "@/shared/store/toastStore";
import { locationApi } from "../api/location.api";
import { profileApi } from "../api/profile.api";
import type { Gender, LocationOption, UserSummary } from "../types/profile.types";

const fallbackAvatar =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBxwHxTE-WFE2W2qVXDxYWaMKEka0GAlMD4scsRy9VSrypOEaIiRsg-Ceu8RxsNEPFDhwOIAI0gUPJMmCn7QYmvURSCJNk4DX9NWHeTizUx0iWaI-cE1Kh76AYiGGOd7UMGGzUFOiX46-xSQzFWePmqRm3aj84lzuq9jVdmid7WFFmOSpRiaB9RQf1jDRzVo3IxtL7cVuoqbtaDA3Mj7LeY-QNlKN2KcxbsIET17F11KZ3AiCVIh35Fhsm7nuL3SJG7diXBUnsIbns";

export const mockProfileExtras = {
    joinedLabel: "Tham gia từ tháng 3, 2023",
    location: "TP. Hồ Chí Minh",
    rank: "Expert",
    isPremium: false,
    currentStreakDays: 25,
    longestSessionMinutes: 120,
    achievementsMore: 12,
};

export type ProfileFormState = {
    fullName: string;
    phoneNumber: string;
    gender: Gender;
    dateOfBirth: string;
    addressLine: string;
    provinceCode: string;
    wardCode: string;
};

export const formatMinutes = (minutes?: number) => `${Math.max(Math.round(minutes ?? 0), 0)} phút`;

const formatDate = (value?: string | null) => {
    if (!value) return "Chưa cập nhật";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("vi-VN").format(date);
};

const formatAddress = (profile: UserSummary | null) => {
    const parts = [profile?.addressLine, profile?.wardName, profile?.provinceName].filter(Boolean);
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

const toProfileForm = (profile: UserSummary | null): ProfileFormState => ({
    fullName: profile?.fullName ?? "",
    phoneNumber: profile?.phoneNumber ?? "",
    gender: profile?.gender ?? "OTHER",
    dateOfBirth: (profile?.dateOfBirth ?? profile?.dob ?? "").slice(0, 10),
    addressLine: profile?.addressLine ?? "",
    provinceCode: profile?.provinceCode ? String(profile.provinceCode) : "",
    wardCode: profile?.wardCode ? String(profile.wardCode) : "",
});

export function useProfilePage() {
    const avatarInputRef = useRef<HTMLInputElement | null>(null);
    const [profile, setProfile] = useState<UserSummary | null>(null);
    const [isProActive, setIsProActive] = useState(false);
    const [yearSummary, setYearSummary] = useState<AnalyticsSummary | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [provinces, setProvinces] = useState<LocationOption[]>([]);
    const [wards, setWards] = useState<LocationOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingWards, setIsLoadingWards] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileForm, setProfileForm] = useState<ProfileFormState>(() => toProfileForm(null));

    useEffect(() => {
        let cancelled = false;

        const loadProfileData = async () => {
            setIsLoading(true);

            const [profileResult, yearResult, achievementsResult, dailyUsageResult] =
                await Promise.allSettled([
                    profileApi.getMyProfile(),
                    analyticsApi.getSummary({ range: "YEAR" }),
                    achievementsApi.getMine(),
                    profileApi.getDailyUsage(),
                ]);

            if (cancelled) return;

            if (profileResult.status === "fulfilled") {
                setProfile(profileResult.value);
                setProfileForm(toProfileForm(profileResult.value));
            } else {
                toast.error("Không thể tải thông tin hồ sơ.");
            }

            if (yearResult.status === "fulfilled") setYearSummary(yearResult.value);
            if (achievementsResult.status === "fulfilled") setAchievements(achievementsResult.value);
            if (dailyUsageResult.status === "fulfilled") {
                setIsProActive(dailyUsageResult.value.unlimited);
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
        return {
            name: profile?.fullName?.trim() || "Chưa cập nhật",
            email: profile?.email || "Chưa cập nhật",
            phone: profile?.phoneNumber || "Chưa cập nhật",
            dob: formatDate(profile?.dateOfBirth ?? profile?.dob),
            address: formatAddress(profile),
            avatarUrl: profile?.avatarUrl || fallbackAvatar,
            meta: `${formatJoinedLabel(profile?.createdAt)} • ${profile?.provinceName ?? mockProfileExtras.location
                }`,
            isPremium: isProActive,
            planLabel: isProActive ? "Pro" : "Free",
        };
    }, [profile, isProActive]);

    const openProfileModal = () => {
        setProfileForm(toProfileForm(profile));
        setIsProfileModalOpen(true);
    };

    const closeProfileModal = () => setIsProfileModalOpen(false);

    const handleProfileOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) closeProfileModal();
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

    return {
        avatarInputRef,
        yearSummary,
        achievements,
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
    };
}
