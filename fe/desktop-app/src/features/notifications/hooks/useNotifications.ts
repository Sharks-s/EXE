import { useEffect, useMemo, useState } from "react";
import { useFocusStore } from "@/features/focus-session";
import { notificationsApi } from "../api/notifications.api";
import type { NotificationItem, NotificationType } from "../types/notification.types";
import {
  isNotificationTypeEnabled,
  loadNotificationPreferences,
  NOTIFICATION_PREFERENCES_UPDATED,
  type NotificationPreferences,
} from "../utils/notificationPreferences";

function areAllTypesEnabled(preferences: NotificationPreferences) {
  return (
    preferences.sessionCompleted &&
    preferences.achievementUnlocked &&
    preferences.streakMilestone &&
    preferences.sessionAborted &&
    preferences.dailyLimitReached &&
    preferences.payments
  );
}

const importantTypes = new Set<NotificationType>([
  "DAILY_LIMIT_REACHED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
]);

const focusDeferredTypes = new Set<NotificationType>([
  "ACHIEVEMENT_UNLOCKED",
  "STREAK_MILESTONE",
]);

function toMinutes(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function isQuietHoursActive(preferences: NotificationPreferences) {
  if (!preferences.quietHoursEnabled) return false;

  const start = toMinutes(preferences.quietHoursStart);
  const end = toMinutes(preferences.quietHoursEnd);
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  if (start === end) return true;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

function shouldSurfaceNotification(
  item: NotificationItem,
  preferences: NotificationPreferences,
  isSessionActive: boolean,
) {
  if (!isNotificationTypeEnabled(item.type, preferences)) return false;

  if (
    preferences.pauseDuringFocus &&
    isSessionActive &&
    focusDeferredTypes.has(item.type)
  ) {
    return false;
  }

  if (isQuietHoursActive(preferences) && !importantTypes.has(item.type)) {
    return false;
  }

  return true;
}

function canUseServerUnreadCount(
  preferences: NotificationPreferences,
  isSessionActive: boolean,
) {
  return (
    areAllTypesEnabled(preferences) &&
    !isQuietHoursActive(preferences) &&
    !(preferences.pauseDuringFocus && isSessionActive)
  );
}

export function useNotifications() {
  const isSessionActive = useFocusStore((state) => Boolean(state.session));
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    loadNotificationPreferences,
  );

  const visibleItems = useMemo(
    () =>
      items.filter((item) =>
        shouldSurfaceNotification(item, preferences, isSessionActive),
      ),
    [isSessionActive, items, preferences],
  );

  const visibleUnreadCount = useMemo(() => unreadCount, [unreadCount]);

  const badgeCount = useMemo(
    () => (preferences.showUnreadBadge ? Math.min(visibleUnreadCount, 99) : 0),
    [preferences.showUnreadBadge, visibleUnreadCount],
  );

  const loadUnreadCount = async () => {
    try {
      const currentPreferences = loadNotificationPreferences();
      setPreferences(currentPreferences);

      if (canUseServerUnreadCount(currentPreferences, isSessionActive)) {
        setUnreadCount(await notificationsApi.getUnreadCount());
        return;
      }

      const page = await notificationsApi.getNotifications(0, 50);
      setUnreadCount(
        page.items.filter(
          (item) =>
            !item.read &&
            shouldSurfaceNotification(
              item,
              currentPreferences,
              isSessionActive,
            ),
        ).length,
      );
    } catch (err) {
      console.error("[useNotifications] Failed to load unread count:", err);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const page = await notificationsApi.getNotifications(0, 10);
      setItems(page.items);
      await loadUnreadCount();
    } catch (err) {
      console.error("[useNotifications] Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notification: NotificationItem) => {
    if (notification.read) return notification;

    const updated = await notificationsApi.markAsRead(notification.id);
    setItems((current) =>
      current.map((item) => (item.id === notification.id ? updated : item)),
    );
    if (shouldSurfaceNotification(notification, preferences, isSessionActive)) {
      setUnreadCount((count) => Math.max(count - 1, 0));
    }
    return updated;
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllAsRead();
    setItems((current) =>
      current.map((item) => ({
        ...item,
        read: true,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  };

  const deleteNotification = async (id: number) => {
    await notificationsApi.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
    await loadUnreadCount();
  };

  useEffect(() => {
    loadUnreadCount();
    const intervalId = window.setInterval(loadUnreadCount, 60_000);
    const handlePreferencesUpdated = () => {
      setPreferences(loadNotificationPreferences());
      void loadUnreadCount();
    };
    window.addEventListener(
      NOTIFICATION_PREFERENCES_UPDATED,
      handlePreferencesUpdated,
    );

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(
        NOTIFICATION_PREFERENCES_UPDATED,
        handlePreferencesUpdated,
      );
    };
  }, [isSessionActive]);

  return {
    badgeCount,
    deleteNotification,
    loadNotifications,
    loading,
    markAllAsRead,
    markAsRead,
    visibleItems,
    visibleUnreadCount,
  };
}
