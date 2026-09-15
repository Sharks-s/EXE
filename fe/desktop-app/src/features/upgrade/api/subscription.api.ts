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

export interface CreatePaymentResponse {
  orderCode: string;
  payUrl: string;
  deeplink: string | null;
  amount: number;
}

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface TransactionStatusResponse {
  orderCode: string;
  status: TransactionStatus;
  plan: string;
  amount: number;
}

export const subscriptionApi = {
  getPlans: () =>
    api
      .get<ApiResponse<SubscriptionPlan[]>>("/subscriptions/plans")
      .then((r) => r.data.data),

  createMomoPayment: (planCode: UpgradeProPlanCode) =>
    api
      .post<ApiResponse<CreatePaymentResponse>>("/payments/momo/create", {
        planCode,
      })
      .then((r) => r.data.data),

  getPaymentStatus: (orderCode: string) =>
    api
      .get<ApiResponse<TransactionStatusResponse>>(
        `/payments/${orderCode}/status`
      )
      .then((r) => r.data.data),
};