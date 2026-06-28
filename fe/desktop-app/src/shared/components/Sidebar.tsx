import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../features/auth/stores/authStore";
import logoIcon from "../../assets/logo/MonkeyLogo.png";
import { icons } from "./sidebarIcons";

// ── Types ─────────────────────────────────────────────
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

// ── NavItem ───────────────────────────────────────────
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

// ── Sidebar ───────────────────────────────────────────
export default function Sidebar({
  currentPage,
  onNavigate,
  isLocked = false,
}: SidebarProps) {
  const { t } = useTranslation("common");
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        relative h-full flex flex-col
        border-r border-blue-200 rounded-r-2xl
        transition-[width] duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-56"}
      `}
    >
      {/* ── Logo / App name ── */}
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

      {/* ── Nav items ── */}
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
          label={t("sidebar.pet", { defaultValue: "Pet" })}
          icon={icons.pet}
          currentPage={currentPage}
          onNavigate={onNavigate}
          collapsed={collapsed}
          disabled={isLocked}
        />

        {/* Divider */}
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

      {/* ── Bottom: Profile + Logout ── */}
      <div className="p-3 border-t border-slate-100 space-y-1">
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

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="
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
