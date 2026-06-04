import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import MainWindow from "./windows/main/MainWindow";
import WidgetWindow from "./windows/widget/WidgetWindow";

// App chỉ làm 1 việc duy nhất:
// Xác định đang ở window nào → render đúng component
export default function App() {
  const [windowLabel, setWindowLabel] = useState<string>("");

  useEffect(() => {
    const currentWindow = getCurrentWebviewWindow();
    setWindowLabel(currentWindow.label);
  }, []);

  if (windowLabel === "main") return <MainWindow />;
  if (windowLabel === "widget") return <WidgetWindow />;

  // Đang load window label — render nothing để tránh flash
  return null;
}
