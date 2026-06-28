import { useFocusStore } from "../stores/focusStore";
import { SetupView } from "./SetupView";
import { ActiveView } from "./Activeview";
import type { Page } from "../../../shared/components/Sidebar";

type DashboardProps = {
  onNavigate?: (page: Page) => void;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { session } = useFocusStore();
  return session ? <ActiveView /> : <SetupView onNavigate={onNavigate} />;
}
