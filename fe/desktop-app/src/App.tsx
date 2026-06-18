import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import MainWindow from "./windows/main/MainWindow";
import WidgetWindow from "./windows/widget/WidgetWindow";
import WarningWindow from "./windows/warning/WarningWindow";
import ToastContainer from "./shared/components/Toastcontainer";
import "./App.css";

export default function App() {
  const [windowLabel, setWindowLabel] = useState<string>("");

  useEffect(() => {
    const currentWindow = getCurrentWebviewWindow();
    setWindowLabel(currentWindow.label);
  }, []);

  if (windowLabel === "main")
    return (
      <>
        <MainWindow />
        <ToastContainer />
      </>
    );
  if (windowLabel === "widget") return <WidgetWindow />;
  if (windowLabel === "warning") return <WarningWindow />;

  return null;
}
