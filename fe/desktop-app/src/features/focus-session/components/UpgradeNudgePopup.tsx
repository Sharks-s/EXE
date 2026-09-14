import type { Page } from "@/shared/components/Sidebar";

type UpgradeNudgePopupProps = {
  onClose: () => void;
  onNavigate?: (page: Page) => void;
};

export function UpgradeNudgePopup({
  onClose,
  onNavigate,
}: UpgradeNudgePopupProps) {
  const handleUpgrade = () => {
    onClose();
    onNavigate?.("upgrade");
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-nudge-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-blue-100 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <span className="material-symbols-outlined">workspace_premium</span>
        </div>

        <h2
          id="upgrade-nudge-title"
          className="m-0 text-xl font-extrabold text-slate-900"
        >
          Daily limit reached
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          Free plan includes 60 focus minutes per day. Upgrade Pro to continue
          with unlimited focus time.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
            onClick={onClose}
          >
            Later
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-blue-500/30"
            onClick={handleUpgrade}
          >
            Upgrade Pro
          </button>
        </div>
      </div>
    </div>
  );
}
