import type { TFunction } from "i18next";
import type { NotificationItem } from "../types/notification.types";
import {
  formatNotificationTime,
  getNotificationTypeLabel,
  normalizeNotificationText,
  notificationTypeTone,
} from "../utils/notificationDisplay";

type NotificationListItemProps = {
  item: NotificationItem;
  onDelete: (id: number) => void;
  onOpen: (item: NotificationItem) => void;
  language?: string;
  t: TFunction<"common">;
};

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </svg>
  );
}

export function NotificationListItem({
  item,
  onDelete,
  onOpen,
  language,
  t,
}: NotificationListItemProps) {
  return (
    <div
      className={`group flex gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 ${
        item.read ? "bg-white" : "bg-blue-50/50"
      }`}
    >
      <button onClick={() => onOpen(item)} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              notificationTypeTone[item.type] ??
              "bg-slate-50 text-slate-600 border-slate-100"
            }`}
          >
            {getNotificationTypeLabel(item.type, t)}
          </span>
          {!item.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
        </div>
        <p className="m-0 mt-2 text-sm font-extrabold text-slate-800">
          {normalizeNotificationText(item.title, t)}
        </p>
        <p className="m-0 mt-1 text-xs leading-5 font-semibold text-slate-500">
          {normalizeNotificationText(item.message, t)}
        </p>
        <p className="m-0 mt-2 text-[11px] font-bold text-slate-400">
          {formatNotificationTime(item.createdAt, language)}
        </p>
      </button>

      <button
        onClick={() => onDelete(item.id)}
        title={t("notifications.delete_title")}
        className="mt-1 h-7 w-7 shrink-0 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center"
      >
        <TrashIcon />
      </button>
    </div>
  );
}
