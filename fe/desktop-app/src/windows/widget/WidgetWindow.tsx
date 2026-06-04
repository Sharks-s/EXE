import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

// Widget window chỉ render bot
// Canvas animation sẽ implement sau khi có PNG frames
export default function WidgetWindow() {
  const handleClick = async () => {
    const mainWindow = await WebviewWindow.getByLabel("main");
    const widgetWindow = await WebviewWindow.getByLabel("widget");
    if (!mainWindow || !widgetWindow) return;
    await mainWindow.show();
    await widgetWindow.hide();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Placeholder — sẽ thay bằng Canvas khi có PNG */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "#0284C7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        🤖
      </div>
    </div>
  );
}
