import { useEffect, useMemo, useState } from "react";
import { focusApi } from "@/features/focus-session/api/focus.api";
import type { FocusSessionResponse } from "@/features/focus-session/types/focus.types";
import { getSessionReview } from "../utils/sessionReview.utils";

export function useAnalyticsSessionHistory() {
  const [sessionHistory, setSessionHistory] = useState<FocusSessionResponse[]>([]);
  const [isSessionHistoryLoading, setIsSessionHistoryLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSessionHistory = async () => {
      try {
        setIsSessionHistoryLoading(true);
        const result = await focusApi.getSessionHistory({ page: 0, size: 12 });
        if (!cancelled) setSessionHistory(result.items);
      } catch {
        if (!cancelled) setSessionHistory([]);
      } finally {
        if (!cancelled) setIsSessionHistoryLoading(false);
      }
    };

    loadSessionHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const reviewedSessions = useMemo(
    () =>
      sessionHistory.map((session) => ({
        session,
        review: getSessionReview(session),
      })),
    [sessionHistory],
  );

  const averageReviewScore = useMemo(
    () =>
      reviewedSessions.length
        ? Math.round(
            reviewedSessions.reduce((total, item) => total + item.review.score, 0) /
              reviewedSessions.length,
          )
        : 0,
    [reviewedSessions],
  );

  return {
    sessionHistory,
    reviewedSessions,
    averageReviewScore,
    isSessionHistoryLoading,
  };
}
