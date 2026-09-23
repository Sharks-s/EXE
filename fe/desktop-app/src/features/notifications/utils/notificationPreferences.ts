import type { NotificationType } from "../types/notification.types";

export type NotificationPreferences = {
  showUnreadBadge: boolean;
  sessionCompleted: boolean;
  achievementUnlocked: boolean;
  streakMilestone: boolean;
  sessionAborted: boolean;
  dailyLimitReached: boolean;
  payments: boolean;
  pauseDuringFocus: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  sessionDigest: boolean;
};

export type BooleanNotificationPreferenceKey = {
  [Key in keyof NotificationPreferences]: NotificationPreferences[Key] extends boolean
    ? Key
    : never;
}[keyof NotificationPreferences];

export const NOTIFICATION_PREFERENCES_UPDATED =
  "notification-preferences-updated";

const STORAGE_KEY = "focusbuddy.notificationPreferences";

export const defaultNotificationPreferences: NotificationPreferences = {
  showUnreadBadge: true,
  sessionCompleted: true,
  achievementUnlocked: true,
  streakMilestone: true,
  sessionAborted: true,
  dailyLimitReached: true,
  payments: true,
  pauseDuringFocus: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  sessionDigest: false,
};

export function loadNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return defaultNotificationPreferences;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultNotificationPreferences;

    return {
      ...defaultNotificationPreferences,
      ...(JSON.parse(raw) as Partial<NotificationPreferences>),
    };
  } catch {
    return defaultNotificationPreferences;
  }
}

export function saveNotificationPreferences(
  preferences: NotificationPreferences,
) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new Event(NOTIFICATION_PREFERENCES_UPDATED));
}

export function isNotificationTypeEnabled(
  type: NotificationType,
  preferences: NotificationPreferences,
) {
  switch (type) {
    case "SESSION_COMPLETED":
      return preferences.sessionCompleted;
    case "ACHIEVEMENT_UNLOCKED":
      return preferences.achievementUnlocked;
    case "STREAK_MILESTONE":
      return preferences.streakMilestone;
    case "SESSION_ABORTED":
      return preferences.sessionAborted;
    case "DAILY_LIMIT_REACHED":
      return preferences.dailyLimitReached;
    case "PAYMENT_SUCCESS":
    case "PAYMENT_FAILED":
      return preferences.payments;
    default:
      return true;
  }
}
