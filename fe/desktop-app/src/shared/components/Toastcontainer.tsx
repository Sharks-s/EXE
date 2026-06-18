import { useEffect } from "react";
import { useToastStore, type Toast, type ToastType } from "../store/toastStore";

const TYPE_STYLES: Record<
  ToastType,
  { border: string; icon: string; iconBg: string }
> = {
  success: {
    border: "border-l-emerald-500",
    icon: "M5 13l4 4L19 7",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  error: {
    border: "border-l-red-500",
    icon: "M6 18L18 6M6 6l12 12",
    iconBg: "bg-red-100 text-red-600",
  },
  warning: {
    border: "border-l-amber-500",
    icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
    iconBg: "bg-amber-100 text-amber-600",
  },
  info: {
    border: "border-l-sky-500",
    icon: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
    iconBg: "bg-sky-100 text-sky-600",
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const style = TYPE_STYLES[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 w-80 rounded-lg border-l-4 ${style.border} bg-white shadow-lg shadow-slate-900/10 p-4 animate-toast-in`}
    >
      <span
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${style.iconBg}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-3.5 h-3.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
        </svg>
      </span>

      <p className="flex-1 text-sm text-slate-700 leading-snug pt-0.5">
        {toast.message}
      </p>

      <button
        onClick={() => dismiss(toast.id)}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
        aria-label="Đóng"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

// Mount component này 1 lần duy nhất ở App.tsx, hiển thị toast cố định bên phải màn hình
export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
