import { useFocusStore } from "../stores/focusStore";
import { SetupView } from "./SetupView";
import { ActiveView } from "./Activeview";
import { SessionSummaryPopup } from "../components/SessionSummaryPopup";
import type { Page } from "../../../shared/components/Sidebar";

type DashboardProps = {
  onNavigate?: (page: Page) => void;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { session, lastCompletedSession, dismissSummary } = useFocusStore();

  if (lastCompletedSession) {
    return (
      <SessionSummaryPopup
        session={lastCompletedSession}
        onClose={dismissSummary}
      />
    );
  }

  return session ? <ActiveView /> : <SetupView onNavigate={onNavigate} />;
}