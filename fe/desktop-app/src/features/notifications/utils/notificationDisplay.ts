import type { TFunction } from "i18next";
import type { NotificationType } from "../types/notification.types";

export const notificationTypeTone: Record<NotificationType, string> = {
  SESSION_COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  ACHIEVEMENT_UNLOCKED: "bg-amber-50 text-amber-700 border-amber-100",
  STREAK_MILESTONE: "bg-orange-50 text-orange-700 border-orange-100",
  SESSION_ABORTED: "bg-slate-50 text-slate-600 border-slate-100",
  DAILY_LIMIT_REACHED: "bg-blue-50 text-blue-700 border-blue-100",
  PAYMENT_SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-100",
  PAYMENT_FAILED: "bg-red-50 text-red-600 border-red-100",
};

const notificationTitleKeys: Record<string, string> = {
  "Da dat gioi han hom nay": "daily_limit",
  "Đã đạt giới hạn hôm nay": "daily_limit",
  "Phien tap trung da dung som": "session_aborted",
  "Phiên tập trung đã dừng sớm": "session_aborted",
  "Hoan thanh phien tap trung": "session_completed",
  "Hoàn thành phiên tập trung": "session_completed",
  "Dat moc streak moi": "streak",
  "Đạt mốc streak mới": "streak",
  "Mo khoa thanh tuu moi": "achievement",
  "Mở khóa thành tựu mới": "achievement",
  "Thanh toan that bai": "payment_failed",
  "Thanh toán thất bại": "payment_failed",
  "Thanh toan thanh cong": "payment_success",
  "Thanh toán thành công": "payment_success",
};

const planKeys: Record<string, string> = {
  PRO_MONTHLY: "pro_monthly",
  PRO_YEARLY: "pro_yearly",
  "Pro Monthly": "pro_monthly",
  "Pro Yearly": "pro_yearly",
  "Pro monthly": "pro_monthly",
  "Pro yearly": "pro_yearly",
  "Pro tháng": "pro_monthly",
  "Pro năm": "pro_yearly",
};

function normalizePlanName(value: string, t: TFunction<"common">) {
  const planKey = planKeys[value.trim()];
  return planKey
    ? t(`notifications.plans.${planKey}`, { defaultValue: value })
    : value;
}

export function getNotificationTypeLabel(
  type: NotificationType,
  t: TFunction<"common">,
) {
  return t(`notifications.types.${type}`, {
    defaultValue: type.replace(/_/g, " "),
  });
}

export function formatNotificationTime(value: string, language?: string) {
  const locale = language?.startsWith("en") ? "en-US" : "vi-VN";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export function normalizeNotificationText(
  value: string,
  t: TFunction<"common">,
) {
  const titleKey = notificationTitleKeys[value];
  if (titleKey) {
    return t(`notifications.titles.${titleKey}`, { defaultValue: value });
  }

  const rules: Array<[RegExp, (...matches: string[]) => string]> = [
    [
      /^(Ban da dung het thoi gian mien phi hom nay\. Nang cap Pro de tiep tuc tap trung\.|Bạn đã dùng hết thời gian miễn phí hôm nay\. Nâng cấp Pro để tiếp tục tập trung\.)$/,
      () => t("notifications.messages.daily_limit"),
    ],
    [
      /^(?:Phien cua ban da ket thuc som sau|Phiên của bạn đã kết thúc sớm sau) (\d+) (?:phut|phút)\.$/,
      (minutes) => t("notifications.messages.session_aborted", { minutes }),
    ],
    [
      /^(?:Ban da hoan thanh|Bạn đã hoàn thành) (\d+) (?:phut|phút) (?:va nhan|và nhận) (\d+) (?:diem|điểm)\.$/,
      (minutes, points) =>
        t("notifications.messages.session_completed", { minutes, points }),
    ],
    [
      /^(?:Ban dang giu streak|Bạn đang giữ streak) (\d+) (?:ngay lien tiep|ngày liên tiếp)\.$/,
      (days) => t("notifications.messages.streak", { days }),
    ],
    [
      /^(?:Ban vua mo khoa|Bạn vừa mở khóa) (.+) (?:va nhan|và nhận) (\d+) (?:diem|điểm)\.$/,
      (achievementName, points) =>
        t("notifications.messages.achievement", { achievementName, points }),
    ],
    [
      /^(?:Giao dich|Giao dịch) (.+) (?:khong thanh cong|không thành công)\. (?:Vui long thu lai|Vui lòng thử lại)\.$/,
      (orderCode) => t("notifications.messages.payment_failed", { orderCode }),
    ],
    [
      /^(?:Goi|Gói) (.+) (?:da duoc kich hoat thanh cong|đã được kích hoạt thành công)\.$/,
      (planName) =>
        t("notifications.messages.payment_success", {
          planName: normalizePlanName(planName, t),
        }),
    ],
  ];

  for (const [pattern, buildText] of rules) {
    const match = value.match(pattern);
    if (match) return buildText(...match.slice(1));
  }

  return value;
}
