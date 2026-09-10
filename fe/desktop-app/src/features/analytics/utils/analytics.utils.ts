import type { Trend } from "../types/analyticsPage.types";

export const rangeLabels = [
    { range: "DAY", label: "Ngày" },
    { range: "WEEK", label: "Tuần" },
    { range: "MONTH", label: "Tháng" },
    { range: "YEAR", label: "Năm" },
] as const;

export const violationLabels: Record<string, string> = {
    AWAY: "Rời khỏi màn hình",
    LOOK_AWAY: "Nhìn sang nơi khác",
    BAD_POSTURE: "Tư thế chưa tốt",
    POOR_LIGHTING: "Ánh sáng kém",
    TOO_CLOSE: "Ngồi quá gần",
    PHONE: "Dùng điện thoại",
    ENTERTAINMENT: "Ứng dụng giải trí",
};

export const formatMinutes = (minutes?: number) =>
    `${Math.max(Math.round(minutes ?? 0), 0)} phút`;

export const formatChange = (value?: number, suffix = "") => {
    if (value === undefined || value === null) return "0";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value}${suffix}`;
};

export const trendFromNumber = (value?: number): Trend => {
    if (!value) return "neutral";
    return value > 0 ? "up" : "down";
};

export const formatHourRange = (hour: number | null) => {
    if (hour === null) return "Chưa có dữ liệu";
    const endHour = (hour + 1) % 24;
    return `${String(hour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`;
};

export const formatChartLabel = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
};

export const formatCalendarMonth = (date: Date) =>
    new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(date);

export const buildChartPath = (items: { focusMinutes: number }[]) => {
    if (!items.length) return null;
    const maxMinutes = Math.max(...items.map((item) => item.focusMinutes), 1);
    const lastIndex = Math.max(items.length - 1, 1);
    const points = items.map((item, index) => ({
        x: (index / lastIndex) * 1000,
        y: 280 - (item.focusMinutes / maxMinutes) * 220,
    }));

    const line = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
    const area = `${line} L1000,300 L0,300 Z`;
    return { line, area };
};