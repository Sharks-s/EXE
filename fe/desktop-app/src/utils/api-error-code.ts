import axios from "axios";
import type { ApiErrorResponse } from "@/types";

export const DAILY_LIMIT_ERROR_CODES = new Set([
  "DAILY_LIMIT_EXCEEDED",
  "PREMIUM_001",
]);

export const getApiErrorCode = (err: unknown): string | null => {
  if (!axios.isAxiosError<ApiErrorResponse>(err)) return null;
  return err.response?.data?.code ?? null;
};

export const isDailyLimitExceededError = (err: unknown) => {
  const code = getApiErrorCode(err);
  return code ? DAILY_LIMIT_ERROR_CODES.has(code) : false;
};
