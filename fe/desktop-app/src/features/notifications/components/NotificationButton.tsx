import type { RefObject } from "react";

type NotificationButtonProps = {
  badgeCount: number;
  collapsed: boolean;
  onClick: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
};

const LABEL = "Th\u00f4ng b\u00e1o";

function BellIcon() {
  return (
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
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function NotificationButton({
  badgeCount,
  buttonRef,
  collapsed,
  onClick,
}: NotificationButtonProps) {
  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      title={collapsed ? LABEL : undefined}
      className={`
        relative w-full flex items-center py-2.5 rounded-xl text-sm
        text-slate-500 hover:bg-[#f5f2ff] hover:text-slate-800
        transition-colors duration-200 overflow-hidden
        ${collapsed ? "justify-center px-0" : "px-3"}
      `}
    >
      <span className="shrink-0 w-[18px] h-[18px] flex items-center justify-center">
        <BellIcon />
      </span>
      {badgeCount > 0 && (
        <span className="absolute top-1.5 left-7 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 font-bold text-center">
          {badgeCount}
        </span>
      )}
      <span
        className={`
          whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
          ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[160px] opacity-100 ml-3"}
        `}
      >
        {LABEL}
      </span>
    </button>
  );
}
