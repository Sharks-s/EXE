import type { NotificationItem } from "../types/notification.types";
import { NotificationListItem } from "./NotificationListItem";

type NotificationDropdownProps = {
  items: NotificationItem[];
  loading: boolean;
  onDelete: (id: number) => void;
  onMarkAllAsRead: () => void;
  onOpen: (item: NotificationItem) => void;
  position: {
    left: number;
    top: number;
  };
  unreadCount: number;
};

const TEXT = {
  title: "Th\u00f4ng b\u00e1o",
  unreadSuffix: "ch\u01b0a \u0111\u1ecdc",
  allRead: "T\u1ea5t c\u1ea3 \u0111\u00e3 \u0111\u1ecdc",
  markAllRead: "\u0110\u1ecdc t\u1ea5t c\u1ea3",
  loading: "\u0110ang t\u1ea3i...",
  empty: "Ch\u01b0a c\u00f3 th\u00f4ng b\u00e1o",
};

export function NotificationDropdown({
  items,
  loading,
  onDelete,
  onMarkAllAsRead,
  onOpen,
  position,
  unreadCount,
}: NotificationDropdownProps) {
  return (
    <div
      className="fixed w-96 max-h-[560px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 z-[9999]"
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div>
          <h3 className="m-0 text-sm font-extrabold text-slate-800">
            {TEXT.title}
          </h3>
          <p className="m-0 mt-1 text-xs font-semibold text-slate-400">
            {unreadCount > 0
              ? `${unreadCount} ${TEXT.unreadSuffix}`
              : TEXT.allRead}
          </p>
        </div>
        <button
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
          className="text-xs font-bold text-blue-600 disabled:text-slate-300"
        >
          {TEXT.markAllRead}
        </button>
      </div>

      <div className="max-h-[460px] overflow-y-auto">
        {loading && (
          <div className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
            {TEXT.loading}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="px-4 py-8 text-center text-sm font-semibold text-slate-400">
            {TEXT.empty}
          </div>
        )}

        {!loading &&
          items.map((item) => (
            <NotificationListItem
              item={item}
              key={item.id}
              onDelete={onDelete}
              onOpen={onOpen}
            />
          ))}
      </div>
    </div>
  );
}
