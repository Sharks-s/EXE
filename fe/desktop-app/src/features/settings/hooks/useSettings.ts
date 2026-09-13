import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
    authSession,
    logoutService,
    authStorage,
    useAuthStore,
} from "@/features/auth";
import { settingsApi } from "../api/settings.api";
import { profileApi } from "@/features/profile";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/shared/store/toastStore";
import type { PersonalityResponse, AppRuleResponse } from "../types/settings.types";

export type AppListTab = "whitelist" | "blacklist";

export interface DeviceInfo {
    id: string;
    name: string;
    lastActive: string;
}

export function useSettings() {
    const { i18n } = useTranslation();

    // ── Cấu hình AI ──
    const [personalities, setPersonalities] = useState<PersonalityResponse[]>([]);
    const [activePersonalityId, setActivePersonalityId] = useState<number | null>(null);
    const [isSavingPersonality, setIsSavingPersonality] = useState(false);
    const [selfAddress, setSelfAddress] = useState("");
    const [userAddress, setUserAddress] = useState("");
    const [isSavingAiAddress, setIsSavingAiAddress] = useState(false);

    // ── Danh sách ứng dụng ──
    const [appListTab, setAppListTab] = useState<AppListTab>("whitelist");
    const [appRules, setAppRules] = useState<AppRuleResponse[]>([]);
    const [newKeyword, setNewKeyword] = useState("");
    const [isAddingRule, setIsAddingRule] = useState(false);

    // ── Thông báo ──
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

    const handleChangeLanguage = async (lang: "vi" | "en") => {
        i18n.changeLanguage(lang); // đổi UI ngay lập tức
        try {
            await settingsApi.changeLanguage({ language: lang });
        } catch {
            toast.error("Không thể lưu ngôn ngữ lên tài khoản (vẫn áp dụng trên máy này).");
        }
    };

    return {
        // i18n
        i18n,

        // Cấu hình AI
        personalities,
        activePersonalityId,
        isSavingPersonality,
        selfAddress,
        setSelfAddress,
        userAddress,
        setUserAddress,
        isSavingAiAddress,
        handleSaveAiAddress,
        handleSelectPersonality,

        // Ngôn ngữ
        handleChangeLanguage,

        // Danh sách ứng dụng
        appListTab,
        setAppListTab,
        appRules,
        newKeyword,
        setNewKeyword,
        isAddingRule,
        currentList,
        handleAddKeyword,
        handleRemoveKeyword,

        // Thông báo
        warningWindowEnabled,
        setWarningWindowEnabled,
        soundReminderEnabled,
        setSoundReminderEnabled,

        // Bảo mật & Tài khoản
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
    };
}