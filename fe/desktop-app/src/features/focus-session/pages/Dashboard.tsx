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
    lastCompletionResult,
    dismissSummary,
    isUpgradeNudgeOpen,
    hideUpgradeNudge,
  } = useFocusStore();

  return (
    <>
      {lastCompletedSession ? (
        <SessionSummaryPopup
          session={lastCompletedSession}
          completionResult={lastCompletionResult}
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
