import React from "react";

interface CheckItemProps {
  label: string;
  isDone: boolean;
  hint?: string;
}

export const CheckItem: React.FC<CheckItemProps> = React.memo(
  ({ label, isDone, hint }) => {
    return (
      <div className="flex flex-col py-1 overflow-hidden">
        {/* Hàng chính (Icon + Dòng chữ tiêu đề) */}
        <div className="flex items-center gap-3">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 shrink-0 ${
              isDone
                ? "bg-green-500/20 text-green-400 scale-105"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {isDone ? "✓" : "✕"}
          </div>
          <span
            className={`text-xs font-medium transition-colors duration-300 ${isDone ? "text-zinc-300" : "text-zinc-400"}`}
          >
            {label}
          </span>
        </div>

        {/* Hàng Gợi ý (Hint text) - Trượt mở/đóng mượt mà không làm giật Layout */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            !isDone && hint
              ? "grid-rows-[1fr] opacity-100 mt-1"
              : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden pl-8">
            <p className="text-[11px] text-amber-500/80 leading-normal">
              👉 {hint}
            </p>
          </div>
        </div>
      </div>
    );
  },
);

CheckItem.displayName = "CheckItem";
