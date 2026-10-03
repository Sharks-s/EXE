import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Page } from "@/shared/components/Sidebar";
import type { NotificationItem } from "../types/notification.types";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationButton } from "./NotificationButton";
import { NotificationDropdown } from "./NotificationDropdown";

type NotificationBellProps = {
  collapsed: boolean;
  onNavigate: (page: Page) => void;
  isLocked?: boolean;
};

const actionPageMap: Record<string, Page> = {
  dashboard: "dashboard",
  analytics: "analytics",
  profile: "profile",
  upgrade: "upgrade",
  pet: "pet",
  songs: "songs",
  settings: "settings",
};

export function NotificationBell({
  collapsed,
  onNavigate,
  isLocked = false,
}: NotificationBellProps) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    left: 0,
    top: 0,
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const {
    badgeCount,
    deleteNotification,
    loadNotifications,
    loading,
    markAllAsRead,
    markAsRead,
    visibleItems,
    visibleUnreadCount,
  } = useNotifications();

  const updateDropdownPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dropdownWidth = 384;
    const dropdownHeight = 560;
    const viewportPadding = 12;
    const maxLeft = Math.max(
      viewportPadding,
      window.innerWidth - dropdownWidth - viewportPadding,
    );
    const maxTop = Math.max(
      viewportPadding,
      window.innerHeight - dropdownHeight - viewportPadding,
    );
    const left = Math.min(Math.max(rect.right + 12, viewportPadding), maxLeft);
    const top = Math.min(
      Math.max(rect.bottom - dropdownHeight, viewportPadding),
      maxTop,
    );

    setDropdownPosition({ left, top });
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleReposition = () => updateDropdownPosition();

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      updateDropdownPosition();
      await loadNotifications();
    }
  };

  const handleOpenNotification = async (notification: NotificationItem) => {
    await markAsRead(notification);

    const page = notification.actionUrl
      ? actionPageMap[notification.actionUrl]
      : undefined;

    if (page && (!isLocked || page === "dashboard")) {
      onNavigate(page);
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <NotificationButton
        badgeCount={badgeCount}
        buttonRef={buttonRef}
        collapsed={collapsed}
        label={t("notifications.title")}
        onClick={handleToggle}
      />

      {open && (
        <NotificationDropdown
          items={visibleItems}
          loading={loading}
          onDelete={deleteNotification}
          onMarkAllAsRead={markAllAsRead}
          onOpen={handleOpenNotification}
          position={dropdownPosition}
          unreadCount={visibleUnreadCount}
        />
      )}
    </div>
  );
}
