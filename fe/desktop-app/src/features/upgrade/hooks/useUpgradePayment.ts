import { useCallback, useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-shell";
import { profileApi } from "@/features/profile";
import { useFocusStore } from "@/features/focus-session";
import { toast } from "@/shared/store/toastStore";
import {
    subscriptionApi,
    type UpgradeProPlanCode,
} from "../api/subscription.api";
import type { PaymentState } from "../types/subscription.types";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 60; // 60 x 3s = 3 phút timeout

export function useUpgradePayment(onUpgradeSuccess: () => void) {
    const [paymentState, setPaymentState] = useState<PaymentState>("idle");
    const [isUpgrading, setIsUpgrading] = useState(false);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    }, []);

    // Dừng polling nếu component unmount giữa chừng
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);

    const refreshDailyUsage = useCallback(() => {
        profileApi
            .getDailyUsage()
            .then((usage) => {
                useFocusStore.getState().setDailyUsage({
                    dailyUsedMinutes: usage.dailyUsedMinute,
                    dailyLimitMinutes: usage.dailyLimitMinute,
                    unlimited: usage.unlimited,
                });
            })
            .catch((err) => {
                console.error("[useUpgradePayment] Failed to refresh daily usage:", err);
            });
    }, []);

    const pollPaymentStatus = useCallback(
        (orderCode: string) => {
            let attempts = 0;

            const poll = async () => {
                attempts++;

                try {
                    const result = await subscriptionApi.getPaymentStatus(orderCode);

                    if (result.status === "SUCCESS") {
                        setPaymentState("success");
                        setIsUpgrading(false);
                        toast.success(
                            "Nâng cấp Pro thành công. Bạn đã được dùng không giới hạn."
                        );
                        refreshDailyUsage();
                        onUpgradeSuccess();
                        return;
                    }

                    if (result.status === "FAILED" || result.status === "CANCELLED") {
                        setPaymentState("failed");
                        setIsUpgrading(false);
                        toast.error("Thanh toán không thành công. Vui lòng thử lại.");
                        return;
                    }

                    if (attempts >= POLL_MAX_ATTEMPTS) {
                        setPaymentState("idle");
                        setIsUpgrading(false);
                        toast.error(
                            "Hết thời gian chờ xác nhận. Nếu đã thanh toán, vui lòng kiểm tra lại sau ít phút."
                        );
                        return;
                    }

                    // PENDING -> tiếp tục chờ, hẹn lần poll kế tiếp SAU KHI lần này đã xong
                    pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
                } catch (err) {
                    console.error("[useUpgradePayment] Poll status failed:", err);

                    // Lỗi mạng cũng phải tính vào timeout, không để chạy vô hạn
                    if (attempts >= POLL_MAX_ATTEMPTS) {
                        setPaymentState("idle");
                        setIsUpgrading(false);
                        toast.error(
                            "Hết thời gian chờ xác nhận. Nếu đã thanh toán, vui lòng kiểm tra lại sau ít phút."
                        );
                        return;
                    }

                    pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
                }
            };

            void poll();
        },
        [onUpgradeSuccess, refreshDailyUsage]
    );

    const startUpgrade = useCallback(
        async (planCode: UpgradeProPlanCode) => {
            setIsUpgrading(true);
            try {
                const payment = await subscriptionApi.createMomoPayment(planCode);
                setPaymentState("waiting");
                await open(payment.payUrl);
                pollPaymentStatus(payment.orderCode);
            } catch (err) {
                console.error("[useUpgradePayment] Create payment failed:", err);
                toast.error("Không thể tạo giao dịch thanh toán. Vui lòng thử lại.");
                setIsUpgrading(false);
                setPaymentState("idle");
            }
        },
        [pollPaymentStatus]
    );

    const resetPayment = useCallback(() => {
        stopPolling();
        setPaymentState("idle");
        setIsUpgrading(false);
    }, [stopPolling]);

    return { paymentState, isUpgrading, startUpgrade, resetPayment };
}