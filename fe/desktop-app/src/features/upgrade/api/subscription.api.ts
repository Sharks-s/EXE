import api from "@/lib/axios";
import type { ApiResponse } from "@/types";

export type UpgradeProPlanCode = "PRO_MONTHLY" | "PRO_YEARLY";

export interface SubscriptionPlan {
  id: number;
  code: string;
  name: string;
  description: string;
  plan: string;
  billingCycle: string;
  priceVnd: number;
  durationDays: number | null;
  dailyLimitMinutes: number | null;
  unlimitedUsage: boolean;
  active: boolean;
}

export interface UpgradeProResponse {
  id: number;
  plan: "PRO" | "PREMIUM" | string;
  billingCycle: "MONTHLY" | "YEARLY" | string;
  startedAt: string;
  expiresAt: string | null;
  active: boolean;
  unlimited: boolean;
}

export const subscriptionApi = {
  getPlans: () =>
    api
      .get<ApiResponse<SubscriptionPlan[]>>("/subscriptions/plans")
      .then((r) => r.data.data),

  upgradePro: (planCode: UpgradeProPlanCode) =>
    api
      .post<ApiResponse<UpgradeProResponse>>("/subscriptions/upgrade-pro", {
        planCode,
      })
      .then((r) => r.data.data),
};
