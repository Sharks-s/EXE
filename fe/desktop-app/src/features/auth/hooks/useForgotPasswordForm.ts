import { useState } from "react";
import axios from "axios";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { RegisterInitSchema } from "../schemas/auth.schemas";
import { forgotPasswordService } from "../services/auth.service";
import { parseApiError } from "@/utils/error-mapper";
import { toast } from "@/shared/store/toastStore";
import type { ApiErrorResponse } from "@/types";
import type {
    ForgotPasswordRequest,
    ForgotPasswordResponse,
} from "../types/auth.types";

interface UseForgotPasswordFormProps {
    onSuccess: (res: ForgotPasswordResponse, email: string) => void;
}

export function useForgotPasswordForm({ onSuccess }: UseForgotPasswordFormProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<ForgotPasswordRequest>({
        resolver: zodResolver(RegisterInitSchema),
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

                Object.entries(fieldErrors).forEach(([field, message]) => {
                    setError(field as FieldPath<ForgotPasswordRequest>, {
                        type: "server",
                        message: message ?? t("errorCodes.VAL_001", { defaultValue: "Dữ liệu không hợp lệ" }),
                    });
                });

                if (globalMessage) {
                    toast.error(globalMessage);
                }
            } else {
                const fallbackMessage = t("errorCodes.SYS_001", {
                    defaultValue: "Lỗi hệ thống, vui lòng thử lại sau",
                });
                toast.error(fallbackMessage);
            }
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
    };
}