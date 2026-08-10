import { useState } from "react";
import { useFocusStore } from "../stores/focusStore";
import { useFocusSession } from "../hooks/useFocusSession";
import "./ActiveView.css";
import { ProgressRing } from "../components/ProgressRing";
import { StatCard } from "../components/StatCard";
import { BreakPromptPopup } from "../../../shared/components/BreakPromptPopup";
import { ResumeConfirmPopup } from "../../../shared/components/ResumeConfirmPopup";
import { focusApi } from "../api/focus.api";
import { invoke } from "@tauri-apps/api/core";

const VIOLATION_LABELS: Record<string, string> = {
  AWAY: "Rời khỏi màn hình",
  LOOK_AWAY: "Nhìn đi chỗ khác",
  TOO_CLOSE: "Ngồi quá gần",
  ENTERTAINMENT: "Mở app giải trí",
  BAD_POSTURE: "Sai tư thế",
  POOR_LIGHTING: "Thiếu sáng",
  PHONE: "Dùng điện thoại",
};

export function ActiveView() {
  const { session, isResumeConfirmPending } = useFocusStore();
  const [isResuming, setIsResuming] = useState(false);

  if (!session) return null;

  // Đang chờ xác nhận khôi phục phiên cũ -> chặn render orchestrator thật
  if (isResumeConfirmPending) {
    return (
      <ResumeConfirmPopup
        session={session}
        isProcessing={isResuming}
        onContinue={async () => {
          setIsResuming(true);
          try {
            await useFocusStore.getState().initializeSessionConfig(session);
            useFocusStore.getState().setResumeConfirmPending(false);
          } finally {
            setIsResuming(false);
          }
        }}
        onEnd={async () => {
          setIsResuming(true);
          try {
            await focusApi.endSession(session.id, true);
            useFocusStore.getState().clearSession();
          } catch (err) {
            console.error("Lỗi khi kết thúc phiên cũ:", err);
          } finally {
            setIsResuming(false);
          }
        }}
      />
    );
  }

  return <ActiveViewContent />;
}

function ActiveViewContent() {
  const { session, violationCount, aiMessages } = useFocusStore();
  const [isAbortConfirmOpen, setIsAbortConfirmOpen] = useState(false);


  // Triệu hồi Hook quản lý thời gian gốc
  const {
    elapsed,
    isEnding,
    handleEndSession,
    isPromptActive,
    isBreaking,
    breakRemaining,
    promptCountdown,
    handleRejectBreak,
    handleAcceptBreak,
    handleResumeSession,
    cycleElapsed,
  } = useFocusSession();

  if (!session) return null;

  // Các logic tính toán phục vụ thuần hiển thị UI
  const plannedSeconds = session.plannedDuration * 60;
  const cycleSeconds = 25 * 60;

  const remaining = Math.max(plannedSeconds - elapsed, 0);
  const progressTotal = Math.min(elapsed / plannedSeconds, 1);

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
      await invoke("back_to_widget");

      const { emit } = await import("@tauri-apps/api/event");
      await emit("widget-active-state", { active: true });
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
      </div>

      {/* MAIN TIMER */}
      <div className="main-timer-box">
        <ProgressRing
          radius={72}
          stroke={8}
          // Nếu đang nghỉ, tính tiến trình dựa trên thời gian nghỉ còn lại
          progress={
            isBreaking
              ? breakRemaining / (session.accumulatedReward * 60 || 1)
              : progressTotal
          }
          // Đổi màu vòng tròn khi nghỉ sang màu cam nhẹ #F59E0B hoặc giữ màu của bạn
          color={isBreaking ? "#F59E0B" : "#9fd6fa"}
        >
          {/* Đổi text thời gian tương ứng theo trạng thái học/nghỉ */}
          <span className="time-text">
            {isBreaking ? formatTime(breakRemaining) : formatTime(remaining)}
          </span>
          <span className="label-text">
            {isBreaking ? "GIẢI LAO" : "CÒN LẠI"}
          </span>
        </ProgressRing>

        <div className="timer-bars-container">
          {/* phiên hiện tại */}
          {totalCycles > 0 && (
            <div>
              <div className="bar-row-header">
                <span className="title">
                  Phiên {currentCycle}/{totalCycles}
                </span>
                <span className="sub-info">
                  {formatTime(cycleRemaining)} còn lại
                </span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" />
              </div>
            </div>
          )}

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

      {/* AI MESSAGES + VIOLATIONS LOG — 2 cột ngang nhau */}
      <div className="grid grid-cols-2 gap-4 mt-4" style={{ height: 200 }}>
        {/* Cột trái — lời AI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 overflow-y-auto">
          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">
            Trợ lý nói
          </h4>
          {aiMessages.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Chưa có gì...</p>
          ) : (
            <ul className="space-y-2">
              {aiMessages.map((item, idx) => (
                <li key={idx} className="text-sm text-slate-700">
                  <span className="text-xs text-slate-400 mr-2">
                    {new Date(item.timestamp).toLocaleTimeString("vi-VN")}
                  </span>
                  {item.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cột phải — danh sách vi phạm */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 overflow-y-auto">
          <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">
            Vi phạm trong phiên
          </h4>
          {!session.violations || session.violations.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Chưa có vi phạm nào</p>
          ) : (
            <ul className="space-y-2">
              {session.violations.map((v, idx) => (
                <li key={idx} className="text-sm text-slate-700">
                  <span className="text-xs text-slate-400 mr-2">
                    {new Date(v.occurredAt).toLocaleTimeString("vi-VN")}
                  </span>
                  {VIOLATION_LABELS[v.type] ?? v.type}
                  {v.appName ? ` (${v.appName})` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ACTIONS: Tự động tính toán hiển thị nút theo tiến trình học */}
      <div className="actions-footer">
        {isBreaking ? (
          <>
            {/*KỊCH BẢN NGHỈ: Học tiếp sớm hoặc Thu nhỏ về Widget trong lúc nghỉ */}
            <button
              className="btn-complete-session cursor-pointer"
              onClick={handleResumeSession}
              style={{ width: "100%", backgroundColor: "#10B981" }} // Màu xanh lá cho tươi tắn
            >
              Quay lại học (Kết thúc nghỉ)
            </button>

            <button
              className="btn-minimize-widget"
              onClick={handleBackToDashboard}
            >
              <span className="action-button-icon primary">
                <span className="material-symbols-outlined">picture_in_picture_alt</span>
              </span>
              <span className="action-button-copy">
                <strong>Thu nhỏ</strong>
                <small>Về Widget</small>
              </span>
            </button>
          </>
        ) : (
          <>
            {/* ĐANG HỌC: 2 nút Từ bỏ và Thu nhỏ. Nhánh "đã đủ giờ chờ bấm Hoàn thành" đã bỏ
                vì session giờ tự động kết thúc khi đủ giờ (xem handleEndSession trong useFocusSession) */}
            <button
              className={`btn-abort-session ${isEnding ? "cursor-wait" : "cursor-pointer"}`}
              onClick={() => setIsAbortConfirmOpen(true)}
              disabled={isEnding}
            >
              <span className="action-button-icon danger">
                <span className="material-symbols-outlined">flag</span>
              </span>
              <span className="action-button-copy">
                <strong>Từ bỏ phiên</strong>
                <small>-50% XP</small>
              </span>
            </button>

            <button
              className="btn-minimize-widget"
              onClick={handleBackToDashboard}
            >
              <span className="action-button-icon primary">
                <span className="material-symbols-outlined">picture_in_picture_alt</span>
              </span>
              <span className="action-button-copy">
                <strong>Thu nhỏ</strong>
                <small>Về Widget</small>
              </span>
            </button>
          </>
        )}
      </div>

      <BreakPromptPopup
        isOpen={isPromptActive}
        countdown={promptCountdown}
        onAccept={handleAcceptBreak}
        onReject={handleRejectBreak}
      />

      {isAbortConfirmOpen && (
        <div
          className="abort-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="abort-confirm-title"
          onClick={() => {
            if (!isEnding) setIsAbortConfirmOpen(false);
          }}
        >
          <div
            className="abort-confirm-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="abort-confirm-icon">
              <span className="material-symbols-outlined">flag</span>
            </div>

            <div className="abort-confirm-copy">
              <h2 id="abort-confirm-title">Từ bỏ phiên tập trung?</h2>
              <p>
                Phiên hiện tại sẽ kết thúc ngay và phần thưởng XP bị giảm 50%.
                Bạn vẫn có thể bắt đầu phiên mới sau đó.
              </p>
            </div>

            <div className="abort-confirm-actions">
              <button
                className="abort-confirm-secondary"
                type="button"
                disabled={isEnding}
                onClick={() => setIsAbortConfirmOpen(false)}
              >
                Tiếp tục học
              </button>
              <button
                className="abort-confirm-danger"
                type="button"
                disabled={isEnding}
                onClick={() => handleEndSession(true)}
              >
                {isEnding ? "Đang kết thúc..." : "Xác nhận từ bỏ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
