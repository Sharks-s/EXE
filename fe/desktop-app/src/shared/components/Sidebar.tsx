import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../features/auth/stores/authStore";
import type { User } from "../../features/auth/types/auth.types";
import { profileApi } from "../../features/profile/api/profile.api";
import type { DailyUsageResponse } from "../../features/profile/types/profile.types";
import logoIcon from "../../assets/logo/MonkeyLogo.png";
import { icons } from "./sidebarIcons";
import { useFocusStore } from "../../features/focus-session/stores/focusStore";

export type Page =
  | "dashboard"
  | "analytics"
  | "settings"
  | "pet"
  | "profile"
  | "upgrade";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isLocked?: boolean;
}

const DAILY_USAGE_FALLBACK_LIMIT = 120;

const getDailyUsedMinutes = (user: User | null) =>
  user?.dailyUsedMinute ?? user?.dailyUsedMinutes ?? user?.daily_used_minutes ?? 0;

const createFallbackDailyUsage = (user: User | null): DailyUsageResponse => {
  const dailyUsedMinute = getDailyUsedMinutes(user);

  return {
    dailyUsedMinute,
    dailyLimitMinute: DAILY_USAGE_FALLBACK_LIMIT,
    remainingMinute: Math.max(DAILY_USAGE_FALLBACK_LIMIT - dailyUsedMinute, 0),
  };
};

const formatUsageMinutes = (minutes: number) => {
  const safeMinutes = Math.max(Math.round(minutes), 0);
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours <= 0) return `${safeMinutes}p`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}p`;
};

function DailyUsageCard({
  usage,
  collapsed,
}: {
  usage: DailyUsageResponse;
  collapsed: boolean;
}) {
  const usedPercent =
    usage.dailyLimitMinute > 0
      ? Math.min((usage.dailyUsedMinute / usage.dailyLimitMinute) * 100, 100)
      : 0;
  const label = `Còn lại ${formatUsageMinutes(usage.remainingMinute)} hôm nay`;

  return (
    <div
      title={collapsed ? label : undefined}
      className={`
        w-full flex items-center rounded-xl
        border border-blue-100 bg-blue-50/70 text-blue-700
        shadow-sm shadow-blue-100/60 overflow-hidden
        ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
      `}
    >
      <span className="shrink-0 w-[18px] h-[18px] flex items-center justify-center">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </span>

      <div
        className={`
          min-w-0 flex-1 overflow-hidden transition-all duration-300 ease-in-out
          ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[160px] opacity-100 ml-3"}
        `}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="m-0 text-[11px] leading-none font-bold text-blue-400 whitespace-nowrap">
            Còn lại
          </p>
          <strong className="text-sm leading-none font-extrabold whitespace-nowrap">
            {formatUsageMinutes(usage.remainingMinute)}
          </strong>
        </div>

        <div className="mt-2 h-2 rounded-full bg-white/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            style={{ width: `${usedPercent}%` }}
          />
        </div>

        <p className="m-0 mt-1 text-[10px] leading-none font-bold text-blue-400 whitespace-nowrap">
          Đã dùng {formatUsageMinutes(usage.dailyUsedMinute)} /{" "}
          {formatUsageMinutes(usage.dailyLimitMinute)}
        </p>
      </div>
    </div>
  );
}

function NavItem({
  page,
  label,
  icon,
  currentPage,
  onNavigate,
  collapsed,
  variant = "default",
  disabled = false,
}: {
  page: Page;
  label: string;
  icon: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  variant?: "default" | "upgrade";
  disabled?: boolean;
}) {
  const isActive = currentPage === page;

  const baseClasses = `
    w-full flex items-center px-3 py-2.5 rounded-xl
    text-sm transition-colors duration-200 overflow-hidden
    ${disabled ? "opacity-40 cursor-not-allowed" : ""}
  `;

  const variantClasses =
    variant === "upgrade"
      ? "font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-transform"
      : isActive
        ? "bg-blue-50 text-blue-600 font-semibold"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800";

  return (
    <button
      onClick={() => onNavigate(page)}
      disabled={disabled}
      title={
        collapsed
          ? label
          : disabled
            ? "Đang trong phiên tập trung hãy kết thúc phiên trước"
            : undefined
      }
      className={`${baseClasses} ${variantClasses}`}
    >
      <span className="shrink-0 w-[18px] h-[18px] flex items-center justify-center">
        {icon}
      </span>
      <span
        className={`
          whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
          ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[160px] opacity-100 ml-3"}
        `}
      >
        {label}
      </span>
    </button>
  );
}

export default function Sidebar({
  currentPage,
  onNavigate,
  isLocked = false,
}: SidebarProps) {
  const { t } = useTranslation("common");
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageResponse>(() =>
    createFallbackDailyUsage(user),
  );

  const focusStoreDailyUsage = useFocusStore((s) => s.dailyUsage);

  const effectiveDailyUsage: DailyUsageResponse = focusStoreDailyUsage
    ? {
      dailyUsedMinute: focusStoreDailyUsage.dailyUsedMinutes,
      dailyLimitMinute: focusStoreDailyUsage.dailyLimitMinutes,
      remainingMinute: Math.max(
        focusStoreDailyUsage.dailyLimitMinutes - focusStoreDailyUsage.dailyUsedMinutes,
        0,
      ),
    }
    : dailyUsage;

  useEffect(() => {
    let cancelled = false;

    const loadDailyUsage = async () => {
      const fallbackUsage = createFallbackDailyUsage(user);
      if (fallbackUsage.dailyUsedMinute > 0) setDailyUsage(fallbackUsage);

      try {
        const usage = await profileApi.getDailyUsage();
        if (!cancelled) setDailyUsage(usage);
      } catch {
        if (!cancelled) setDailyUsage(fallbackUsage);
      }
    };

    loadDailyUsage();
    const intervalId = window.setInterval(loadDailyUsage, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user]);

  return (
    <aside
      className={`
        relative h-full flex flex-col
        border-r border-blue-200 rounded-r-2xl
        transition-[width] duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-56"}
      `}
    >
      <div className="flex items-center px-3 py-5 border-b border-slate-100 overflow-hidden">
        <img
          src={logoIcon}
          alt="FocusBuddy"
          className="w-8 h-8 rounded-lg shrink-0 object-cover"
        />
        <span
          className={`
            font-bold text-blue-600 tracking-tight whitespace-nowrap overflow-hidden
            transition-all duration-300 ease-in-out
            ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[160px] opacity-100 ml-3"}
          `}
        >
          FocusBuddy
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <NavItem
          page="dashboard"
          label={t("sidebar.dashboard", { defaultValue: "Dashboard" })}
          icon={icons.dashboard}
          currentPage={currentPage}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
        <NavItem
          page="analytics"
          label={t("sidebar.analytics", { defaultValue: "Analytics" })}
          icon={icons.analytics}
          currentPage={currentPage}
          onNavigate={onNavigate}
          collapsed={collapsed}
          disabled={isLocked}
        />
        <NavItem
          page="settings"
          label={t("sidebar.settings", { defaultValue: "Settings" })}
          icon={icons.settings}
          currentPage={currentPage}
          onNavigate={onNavigate}
          collapsed={collapsed}
          disabled={isLocked}
        />
        <NavItem
          page="pet"
          label={t("sidebar.pet", { defaultValue: "Buddy" })}
          icon={icons.pet}
          currentPage={currentPage}
          onNavigate={onNavigate}
          collapsed={collapsed}
          disabled={isLocked}
        />

        <div className="my-2 border-t border-slate-100" />

        <NavItem
          page="upgrade"
          label={t("sidebar.upgrade", { defaultValue: "Upgrade" })}
          icon={icons.upgrade}
          currentPage={currentPage}
          onNavigate={onNavigate}
          collapsed={collapsed}
          variant="upgrade"
          disabled={isLocked}
        />
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-1">
        <DailyUsageCard usage={effectiveDailyUsage} collapsed={collapsed} />

        <NavItem
          page="profile"
          label={
            user?.email ?? t("sidebar.profile", { defaultValue: "Profile" })
          }
          icon={icons.profile}
          currentPage={currentPage}
          onNavigate={onNavigate}
          collapsed={collapsed}
          disabled={isLocked}
        />

        <button
          onClick={logout}
          title={
            collapsed
              ? t("sidebar.logout", { defaultValue: "Logout" })
              : undefined
          }
          className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors duration-200 overflow-hidden"
        >
          <span className="shrink-0 w-[18px] h-[18px] flex items-center justify-center">
            {icons.logout}
          </span>
          <span
            className={`
              whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
              ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[160px] opacity-100 ml-3"}
            `}
          >
            {t("sidebar.logout", { defaultValue: "Logout" })}
          </span>
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="
          sidebar-toggle-btn
          absolute -right-3 top-1/2 -translate-y-1/2
          w-6 h-6 rounded-full
          bg-white border border-slate-200
          flex items-center justify-center
          text-slate-400 hover:text-blue-600
          shadow-sm hover:shadow-md
          transition-all duration-200
          z-10
        "
      >
        {collapsed ? icons.chevronRight : icons.chevronLeft}
      </button>
    </aside>
  );
}