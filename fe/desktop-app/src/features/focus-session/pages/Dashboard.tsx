import { useFocusStore } from "../stores/focusStore";
import { SetupView } from "./SetupView";
import { ActiveView } from "./Activeview";
import { SessionSummaryPopup } from "../components/SessionSummaryPopup";
import { UpgradeNudgePopup } from "../components/UpgradeNudgePopup";
import type { Page } from "@/shared/components/Sidebar";


type DashboardProps = {
  onNavigate?: (page: Page) => void;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const {
    session,
    lastCompletedSession,
    dismissSummary,
    isUpgradeNudgeOpen,
    hideUpgradeNudge,
  } = useFocusStore();

  return (
    <>
      {lastCompletedSession ? (
        <SessionSummaryPopup
          session={lastCompletedSession}
          onClose={dismissSummary}
        />
      ) : session ? (
        <ActiveView />
      ) : (
        <SetupView onNavigate={onNavigate} />
      )}
      {isUpgradeNudgeOpen && (
        <UpgradeNudgePopup
          onClose={hideUpgradeNudge}
          onNavigate={onNavigate}
        />
      )}
    </>
  );
}
