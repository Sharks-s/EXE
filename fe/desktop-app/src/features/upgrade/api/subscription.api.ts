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
  checkoutUrl: string;
  amount: number;
}

export type TransactionStatus =
  | "PENDING"
  | "PAID"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

export interface TransactionStatusResponse {
  orderCode: string;
  status: TransactionStatus;
  plan: string;
  amount: number;
}

type RawCreatePaymentResponse = Partial<CreatePaymentResponse> & {
  payUrl?: string;
  checkout_url?: string;
  orderCode?: string;
  order_code?: string;
  order_invoice_number?: string;
  orderAmount?: number | string;
  order_amount?: number | string;
};

const normalizePaymentResponse = (
  payment: RawCreatePaymentResponse
): CreatePaymentResponse => {
  const orderCode =
    payment.orderCode ?? payment.order_code ?? payment.order_invoice_number;
  const checkoutUrl =
    payment.checkoutUrl ?? payment.checkout_url ?? payment.payUrl;
  const rawAmount = payment.amount ?? payment.orderAmount ?? payment.order_amount;

  if (!orderCode || !checkoutUrl) {
    throw new Error("Invalid SePay payment response");
  }

  return {
    orderCode,
    checkoutUrl,
    amount: Number(rawAmount ?? 0),
  };
};

export const subscriptionApi = {
  getPlans: () =>
    api
      .get<ApiResponse<SubscriptionPlan[]>>("/subscriptions/plans")
      .then((r) => r.data.data),

  createSePayPayment: (planCode: UpgradeProPlanCode) =>
    api
      .post<ApiResponse<RawCreatePaymentResponse>>("/payments/sepay/create", {
        plan: planCode,
      })
      .then((r) => normalizePaymentResponse(r.data.data)),

  getPaymentStatus: (orderCode: string) =>
    api
      .get<ApiResponse<TransactionStatusResponse>>(
        `/payments/${orderCode}/status`
      )
      .then((r) => r.data.data),
};
