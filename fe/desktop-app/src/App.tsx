import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import MainWindow from "./windows/main/MainWindow";
import WidgetWindow from "./windows/widget/WidgetWindow";
import WarningWindow from "./windows/warning/WarningWindow";
import ToastContainer from "./shared/components/Toastcontainer";
import "./App.css";
import BubbleWindow from "./windows/bubble/BubbleWindow";
import { ClosingOverlay } from "./shared/components/ClosingOverlay";
import { useFocusStore } from "./features/focus-session/stores/focusStore";

export default function App() {
  const [windowLabel, setWindowLabel] = useState<string>("");

  const isClosing = useFocusStore((s) => s.isClosing);

  useEffect(() => {
    const currentWindow = getCurrentWebviewWindow();
    setWindowLabel(currentWindow.label);
  }, []);

  if (windowLabel === "main")
    return (
      <>
        <MainWindow />
        <ToastContainer />
        {isClosing && <ClosingOverlay />}
      </>
    );
  if (windowLabel === "widget") return <WidgetWindow />;
  if (windowLabel === "widget-bubble") return <BubbleWindow />;
  if (windowLabel === "warning") return <WarningWindow />;

  return null;
}
