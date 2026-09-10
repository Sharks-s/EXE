import { useState } from "react";
import axios from "axios";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { ForgotPasswordSchema } from "../schemas/auth.schemas";
import { forgotPasswordService } from "../services/auth.service";
import { parseApiError } from "@/utils/error-mapper";
import { handleApiError } from "@/utils/handleApiError";
import { getStringLimits } from "@/utils/zod-utils";
import { toast } from "@/shared/store/toastStore";
import type { ApiErrorResponse } from "@/types";
import type {
    ForgotPasswordRequest,
    ForgotPasswordResponse,
} from "../types/auth.types";

interface UseForgotPasswordFormProps {
    onSuccess: (res: ForgotPasswordResponse, email: string) => void;
}

const emailLimits = getStringLimits(ForgotPasswordSchema.shape.email);
const LOG_CONTEXT = "[useForgotPasswordForm]";

export function useForgotPasswordForm({ onSuccess }: UseForgotPasswordFormProps) {
    const { t } = useTranslation(["validationErrors", "businessErrors", "common"]);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<ForgotPasswordRequest>({
        resolver: zodResolver(ForgotPasswordSchema),
        mode: "onChange",
        reValidateMode: "onChange",
    });

    // ── Submit ────────────────────────────────────────
    const onSubmit = async (data: ForgotPasswordRequest) => {
        try {
            setLoading(true);
            const email = data.email.trim();
            const res = await forgotPasswordService({ email });
            onSuccess(res, email);
        } catch (err: unknown) {
            if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
                const { globalMessage, fieldErrors } = parseApiError(err.response.data);

                if (Object.keys(fieldErrors).length > 0) {
                    Object.entries(fieldErrors).forEach(([field, message]) => {
                        setError(field as FieldPath<ForgotPasswordRequest>, {
                            type: "server",
                            message:
                                message ??
                                t("businessErrors:VAL_001", { defaultValue: "Dữ liệu không hợp lệ" }),
                        });
                    });
                    console.error(`${LOG_CONTEXT} Lỗi validate từ server:`, err);

                    if (globalMessage) toast.error(globalMessage);
                    return;
                }
            }

            handleApiError(err, {
                context: LOG_CONTEXT,
                action: "Lỗi yêu cầu đặt lại mật khẩu",
                fallbackMessage: t("businessErrors:SYS_001", {
                    defaultValue: "Lỗi hệ thống, vui lòng thử lại sau",
                }),
            });
        } finally {
            setLoading(false);
        }
    };

    // ── Clear field error khi gõ ──────────────────────
    const createChangeHandler =
        (
            fieldName: FieldPath<ForgotPasswordRequest>,
            originalOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void
        ) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                originalOnChange(e);
                clearErrors(fieldName);
            };

    return {
        register,
        handleSubmit,
        errors,
        onSubmit,
        createChangeHandler,
        loading,
        t,
        emailLimits,
    };
}