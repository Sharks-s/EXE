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

export const notificationTypeLabel: Record<NotificationType, string> = {
  SESSION_COMPLETED: "Ho\u00e0n th\u00e0nh phi\u00ean",
  ACHIEVEMENT_UNLOCKED: "Th\u00e0nh t\u1ef1u m\u1edbi",
  STREAK_MILESTONE: "M\u1ed1c streak",
  SESSION_ABORTED: "Phi\u00ean d\u1eebng s\u1edbm",
  DAILY_LIMIT_REACHED: "Gi\u1edbi h\u1ea1n ng\u00e0y",
  PAYMENT_SUCCESS: "Thanh to\u00e1n th\u00e0nh c\u00f4ng",
  PAYMENT_FAILED: "Thanh to\u00e1n th\u1ea5t b\u1ea1i",
};

const notificationTitleMap: Record<string, string> = {
  "Da dat gioi han hom nay":
    "\u0110\u00e3 \u0111\u1ea1t gi\u1edbi h\u1ea1n h\u00f4m nay",
  "Phien tap trung da dung som":
    "Phi\u00ean t\u1eadp trung \u0111\u00e3 d\u1eebng s\u1edbm",
  "Hoan thanh phien tap trung":
    "Ho\u00e0n th\u00e0nh phi\u00ean t\u1eadp trung",
  "Dat moc streak moi": "\u0110\u1ea1t m\u1ed1c streak m\u1edbi",
  "Mo khoa thanh tuu moi":
    "M\u1edf kh\u00f3a th\u00e0nh t\u1ef1u m\u1edbi",
  "Thanh toan that bai": "Thanh to\u00e1n th\u1ea5t b\u1ea1i",
  "Thanh toan thanh cong": "Thanh to\u00e1n th\u00e0nh c\u00f4ng",
};

export function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export function normalizeNotificationText(value: string) {
  const mappedTitle = notificationTitleMap[value];
  if (mappedTitle) return mappedTitle;

  const rules: Array<[RegExp, (...matches: string[]) => string]> = [
    [
      /^Ban da dung het thoi gian mien phi hom nay\. Nang cap Pro de tiep tuc tap trung\.$/,
      () =>
        "B\u1ea1n \u0111\u00e3 d\u00f9ng h\u1ebft th\u1eddi gian mi\u1ec5n ph\u00ed h\u00f4m nay. N\u00e2ng c\u1ea5p Pro \u0111\u1ec3 ti\u1ebfp t\u1ee5c t\u1eadp trung.",
    ],
    [
      /^Phien cua ban da ket thuc som sau (\d+) phut\.$/,
      (minutes) =>
        `Phi\u00ean c\u1ee7a b\u1ea1n \u0111\u00e3 k\u1ebft th\u00fac s\u1edbm sau ${minutes} ph\u00fat.`,
    ],
    [
      /^Ban da hoan thanh (\d+) phut va nhan (\d+) diem\.$/,
      (minutes, points) =>
        `B\u1ea1n \u0111\u00e3 ho\u00e0n th\u00e0nh ${minutes} ph\u00fat v\u00e0 nh\u1eadn ${points} \u0111i\u1ec3m.`,
    ],
    [
      /^Ban dang giu streak (\d+) ngay lien tiep\.$/,
      (days) =>
        `B\u1ea1n \u0111ang gi\u1eef streak ${days} ng\u00e0y li\u00ean ti\u1ebfp.`,
    ],
    [
      /^Ban vua mo khoa (.+) va nhan (\d+) diem\.$/,
      (achievementName, points) =>
        `B\u1ea1n v\u1eeba m\u1edf kh\u00f3a ${achievementName} v\u00e0 nh\u1eadn ${points} \u0111i\u1ec3m.`,
    ],
    [
      /^Giao dich (.+) khong thanh cong\. Vui long thu lai\.$/,
      (orderCode) =>
        `Giao d\u1ecbch ${orderCode} kh\u00f4ng th\u00e0nh c\u00f4ng. Vui l\u00f2ng th\u1eed l\u1ea1i.`,
    ],
    [
      /^Goi (.+) da duoc kich hoat thanh cong\.$/,
      (planName) =>
        `G\u00f3i ${planName} \u0111\u00e3 \u0111\u01b0\u1ee3c k\u00edch ho\u1ea1t th\u00e0nh c\u00f4ng.`,
    ],
  ];

  for (const [pattern, buildText] of rules) {
    const match = value.match(pattern);
    if (match) return buildText(...match.slice(1));
  }

  return value;
}
