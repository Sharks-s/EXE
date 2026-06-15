import { useFocusStore } from "../stores/focusStore";
import { useFocusSession } from "../hooks/useFocusSession";
import "./ActiveView.css";
import { ProgressRing } from "../components/ProgressRing";
import { StatCard } from "../components/StatCard";

// ── ActiveView Main Component ──────────────────────────
export function ActiveView() {
  const { session, violationCount } = useFocusStore();

  // 🔥 Triệu hồi Hook điều phối trung tâm dọn sạch toàn bộ bộ đếm ở view cũ
  const { elapsed, isEnding, handleEndSession } = useFocusSession();

  if (!session) return null;

  // Các logic tính toán phục vụ thuần hiển thị UI
  const plannedSeconds = session.plannedDuration * 60;
  const cycleSeconds = 25 * 60;
  const startedAt = new Date(session.startedAt).getTime();

  const remaining = Math.max(plannedSeconds - elapsed, 0);
  const progressTotal = Math.min(elapsed / plannedSeconds, 1);

  const lastCycleAt = session.lastCycleAt
    ? new Date(session.lastCycleAt).getTime()
    : startedAt;
  const cycleElapsed = Math.max(
    Math.floor((Date.now() - lastCycleAt) / 1000),
    0,
  );
  const cycleProgress = Math.min(cycleElapsed / cycleSeconds, 1);
  const cycleRemaining = Math.max(cycleSeconds - cycleElapsed, 0);

  const currentCycle = Math.floor(session.accumulatedReward / 5) + 1;
  const totalCycles = Math.floor(session.plannedDuration / 25);
  const bankProgress = Math.min(
    session.accumulatedReward / session.totalRewardPool,
    1,
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleBackToDashboard = async () => {
    try {
      const mainWindow = (await import("@tauri-apps/api/webviewWindow"))
        .WebviewWindow;
      const main = await mainWindow.getByLabel("main");
      const widget = await mainWindow.getByLabel("widget");
      if (main && widget) {
        await main.show();
        await widget.hide();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="active-view-container"
      style={{
        ["--cycle-progress" as any]: cycleProgress,
        ["--bank-progress" as any]: bankProgress,
      }}
    >
      {/* HEADER */}
      <div className="active-view-header">
        <div>
          <h1>Đang tập trung 🔥</h1>
          <p>{session.goal || "Không có mục tiêu cụ thể"}</p>
        </div>
        <button className="btn-back-dashboard" onClick={handleBackToDashboard}>
          ← Widget
        </button>
      </div>

      {/* MAIN TIMER */}
      <div className="main-timer-box">
        <ProgressRing
          radius={72}
          stroke={8}
          progress={progressTotal}
          color="#9fd6fa"
        >
          <span className="time-text">{formatTime(remaining)}</span>
          <span className="label-text">CÒN LẠI</span>
        </ProgressRing>

        <div className="timer-bars-container">
          {/* Hiệp hiện tại */}
          <div>
            <div className="bar-row-header">
              <span className="title">
                Hiệp {currentCycle}/{totalCycles}
              </span>
              <span className="sub-info">
                {formatTime(cycleRemaining)} còn lại
              </span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" />
            </div>
          </div>

          {/* Break bank */}
          <div>
            <div className="bar-row-header">
              <span className="title">💰 Break bank</span>
              <span className="reward-info">
                {session.accumulatedReward} phút tích lũy
              </span>
            </div>
            <div className="progress-bar-bg break-bank-bg">
              <div className="progress-bar-fill break-bank-fill" />
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <StatCard
          label="Vi phạm"
          value={violationCount}
          sub="lần bị phát hiện"
          accent={violationCount > 0 ? "#EF4444" : "#0F172A"}
        />
        <StatCard
          label="Quỹ tương lai"
          value={`${session.potentialReward}p`}
          sub="có thể kiếm thêm"
          accent="#9fd6fa"
        />
        <StatCard
          label="Đã học"
          value={`${Math.floor(elapsed / 60)}p`}
          sub={`/ ${session.plannedDuration} phút`}
        />
      </div>

      {/* ACTIONS */}
      <div className="actions-footer">
        <button
          className={`btn-abort-session ${isEnding ? "cursor-wait" : "cursor-pointer"}`}
          onClick={() => handleEndSession(true)}
          disabled={isEnding}
        >
          Từ bỏ (-50% XP)
        </button>
        <button
          className={`btn-complete-session ${isEnding ? "cursor-wait" : "cursor-pointer"}`}
          onClick={() => handleEndSession(false)}
          disabled={isEnding}
        >
          Kết thúc phiên ✓
        </button>
      </div>
    </div>
  );
}
