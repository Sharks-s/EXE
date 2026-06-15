import { useState } from "react";
import { useFocusStore } from "../stores/focusStore";
import { SetupView } from "./SetupView";
import { ActiveView } from "./Activeview";

export default function Dashboard() {
  const { session } = useFocusStore();
  return session ? <ActiveView /> : <SetupView />;
}
