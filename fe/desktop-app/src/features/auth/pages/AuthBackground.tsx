import { useEffect } from "react";
import "./AuthBackground.css";

export default function AuthBackground() {
  const ROWS = 11;
  const COLS = 14;

  useEffect(() => {
    const cursor = document.querySelector(".auth-cursor") as HTMLElement;
    if (!cursor) return;

    const onMove = (e: MouseEvent) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    };

    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-cursor" />
        {Array.from({ length: ROWS }).map((_, r) => (
          <div className="row" key={r}>
            {Array.from({ length: COLS }).map((_, c) => (
              <div className="hex" key={c} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
