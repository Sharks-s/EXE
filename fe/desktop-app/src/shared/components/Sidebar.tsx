import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../features/auth/stores/authStore";

// ── Types ─────────────────────────────────────────────
export type Page =
  | "dashboard"
  | "analytics"
  | "settings"
  | "profile"
  | "upgrade";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

// ── Icons ─────────────────────────────────────────────
const icons = {
  dashboard: (
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
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  analytics: (
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
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  settings: (
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  profile: (
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
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  upgrade: (
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  logout: (
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  chevronLeft: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevronRight: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

// ── NavItem ───────────────────────────────────────────
function NavItem({
  page,
  label,
  icon,
  currentPage,
  onNavigate,
  collapsed,
  variant = "default",
}: {
  page: Page;
  label: string;
  icon: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  variant?: "default" | "upgrade";
}) {
  const isActive = currentPage === page;

  if (variant === "upgrade") {
    return (
      <button
        onClick={() => onNavigate(page)}
        title={collapsed ? label : undefined}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
          font-semibold text-sm transition-all duration-200
          bg-gradient-to-r from-amber-400 to-orange-400
          text-white shadow-md hover:shadow-lg hover:scale-[1.02]
          ${collapsed ? "justify-center" : ""}
        `}
      >
        <span className="shrink-0">{icon}</span>
        {!collapsed && <span>{label}</span>}
      </button>
    );
  }

  return (
    <button
      onClick={() => onNavigate(page)}
      title={collapsed ? label : undefined}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
        text-sm transition-all duration-200
        ${collapsed ? "justify-center" : ""}
        ${
          isActive
            ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        }
      `}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

// ── Sidebar ───────────────────────────────────────────
export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { t } = useTranslation("common");
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        relative h-full flex flex-col
        bg-white border-r border-slate-100
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-56"}
      `}
    >
      {/* ── Logo / App name ── */}
      <div
        className={`
        flex items-center gap-3 px-4 py-5 border-b border-slate-100
        ${collapsed ? "justify-center px-2" : ""}
      `}
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-white font-black text-sm">F</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-slate-800 tracking-tight">
            FocusBuddy
          </span>
        )}
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
        />
        <NavItem
          page="settings"
          label={t("sidebar.settings", { defaultValue: "Settings" })}
          icon={icons.settings}
          currentPage={currentPage}
          onNavigate={onNavigate}
          collapsed={collapsed}
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
        />

        <button
          onClick={logout}
          title={
            collapsed
              ? t("sidebar.logout", { defaultValue: "Logout" })
              : undefined
          }
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-sm text-red-400 hover:bg-red-50 hover:text-red-600
            transition-all duration-200
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <span className="shrink-0">{icons.logout}</span>
          {!collapsed && (
            <span>{t("sidebar.logout", { defaultValue: "Logout" })}</span>
          )}
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
          text-slate-400 hover:text-slate-700
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
