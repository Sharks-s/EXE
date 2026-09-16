import type { FocusSessionResponse, SessionStatus } from "@/features/focus-session/types/focus.types";

export type SessionReviewGrade = "S" | "A" | "B" | "C" | "D";

export type SessionReview = {
  score: number;
  grade: SessionReviewGrade;
  completionRate: number;
};

export type ReviewedSession = {
  session: FocusSessionResponse;
  review: SessionReview;
};

export const getSessionMinutes = (session: FocusSessionResponse) => {
  return session.actualDuration ?? session.plannedDuration ?? 0;
};

const clampScore = (value: number) => Math.max(0, Math.min(Math.round(value), 100));

export const getSessionReview = (session: FocusSessionResponse): SessionReview => {
  const plannedMinutes = Math.max(session.plannedDuration ?? 0, 1);
  const actualMinutes = Math.max(getSessionMinutes(session), 0);
  const completionRate = clampScore((actualMinutes / plannedMinutes) * 100);
  const violations = session.violations ?? [];
  const penaltyViolations = violations.filter((violation) => violation.minutesDeducted > 0).length;
  const reminderViolations = violations.length - penaltyViolations;
  const rewardRate =
    session.totalRewardPool > 0
      ? (session.accumulatedReward / session.totalRewardPool) * 100
      : completionRate;
  const abortPenalty = session.status === "ABORTED" ? 18 : 0;
  const score = clampScore(
    completionRate * 0.68 +
      Math.max(rewardRate, 0) * 0.22 -
      penaltyViolations * 6 -
      reminderViolations * 2 -
      abortPenalty,
  );
  const grade = score >= 90 ? "S" : score >= 78 ? "A" : score >= 62 ? "B" : score >= 45 ? "C" : "D";

  return {
    score,
    grade,
    completionRate,
  };
};

export const getSessionStatusIcon = (status: SessionStatus) => {
  if (status === "COMPLETED") return "check_circle";
  if (status === "ABORTED") return "cancel";
  if (status === "IN_PROGRESS") return "play_circle";
  return "do_not_disturb_on";
};
