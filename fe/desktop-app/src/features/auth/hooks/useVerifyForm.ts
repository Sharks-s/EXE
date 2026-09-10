import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { handleApiError } from "@/utils/handleApiError";
import { toast } from "@/shared/store/toastStore";

const LOG_CONTEXT = "[useVerifyForm]";

interface UseVerifyFormProps {
    verifyId: string;
    expiresInSeconds: number;
    onVerify: (data: { verifyId: string; otp: string }) => Promise<{
        sessionToken: string;
    }>;
    onResend: () => Promise<{
        expiresInSeconds: number;
    }>;
    onVerifySuccess: (sessionToken: string) => void;
}

export function useVerifyForm({
    verifyId,
    expiresInSeconds,
    onVerify,
    onResend,
    onVerifySuccess,
}: UseVerifyFormProps) {
    const { t } = useTranslation(["validationErrors", "common", "businessErrors"]);
    const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
    const [remaining, setRemaining] = useState(expiresInSeconds);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const otp = digits.join("");

    // ── Sync prop expiresInSeconds vào state khi prop đổi ──
    useEffect(() => {
        setRemaining(expiresInSeconds);
    }, [expiresInSeconds]);

    // ── Countdown Timer ────────────────────────────────
    useEffect(() => {
        if (remaining <= 0) return;
        const timer = setInterval(() => {
            setRemaining((r) => Math.max(r - 1, 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [remaining]);

    // ── Auto Focus ô đầu tiên ─────────────────────────
    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    // ── Handlers nhập liệu OTP ─────────────────────────
    const handleDigitChange = (index: number, value: string) => {
        const v = value.replace(/\D/g, "").slice(0, 1);
        if (!v && value !== "") return;
        if (error) setError(null);

        setDigits((prev) => {
            const next = [...prev];
            next[index] = v;
            return next;
        });

        if (v) {
            const nextInput = inputsRef.current[index + 1];
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        idx: number
    ) => {
        if (e.key === "Backspace") {
            if (!digits[idx]) {
                const prev = inputsRef.current[idx - 1];
                if (prev) {
                    prev.focus();
                    setDigits((d) => {
                        const n = [...d];
                        n[idx - 1] = "";
                        return n;
                    });
                }
            }
        } else if (e.key === "ArrowLeft") {
            inputsRef.current[idx - 1]?.focus();
        } else if (e.key === "ArrowRight") {
            inputsRef.current[idx + 1]?.focus();
        }
    };

    const handlePaste = (
        e: React.ClipboardEvent<HTMLInputElement>,
        startIndex: number
    ) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("Text").replace(/\D/g, "");
        if (!pasted) return;
        if (error) setError(null);

        setDigits((prev) => {
            const next = [...prev];
            for (let i = 0; i < pasted.length && startIndex + i < 6; i++) {
                next[startIndex + i] = pasted[i];
            }
            return next;
        });

        const endIndex = Math.min(6, startIndex + pasted.length);
        inputsRef.current[endIndex - 1]?.focus();
    };

    // ── Submit Verify OTP ─────────────────────────────
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            const msg = t("validationErrors:otp.invalid_length", {
                defaultValue: "Vui lòng nhập đủ 6 số OTP",
            });
            setError(msg);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await onVerify({ verifyId, otp });
            onVerifySuccess(res.sessionToken);
        } catch (err: unknown) {
            // Dùng handleApiError lấy message chuẩn, nhưng set silent: true 
            // để tự render message ở dạng chữ đỏ dưới ô OTP thay vì bắn Toast.
            const parsedMessage = handleApiError(err, {
                context: LOG_CONTEXT,
                action: "Lỗi xác thực OTP",
                silent: true,
                fallbackMessage: t("businessErrors:SYS_001", {
                    defaultValue: "Lỗi hệ thống, vui lòng thử lại sau",
                }),
            });
            setError(parsedMessage);
        } finally {
            setLoading(false);
        }
    };

    // ── Resend OTP ────────────────────────────────────
    const handleResend = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await onResend();

            setRemaining(res.expiresInSeconds);
            setDigits(["", "", "", "", "", ""]);
            inputsRef.current[0]?.focus();
            toast.success(
                t("common:auth.resend_success", { defaultValue: "Đã gửi lại mã OTP thành công" })
            );
        } catch (err: unknown) {
            handleApiError(err, {
                context: LOG_CONTEXT,
                action: "Lỗi gửi lại OTP",
                fallbackMessage: t("businessErrors:SYS_001", {
                    defaultValue: "Lỗi hệ thống, vui lòng thử lại sau",
                }),
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        digits,
        otp,
        remaining,
        loading,
        error,
        inputsRef,
        handleDigitChange,
        handleKeyDown,
        handlePaste,
        handleVerify,
        handleResend,
        t,
    };
}