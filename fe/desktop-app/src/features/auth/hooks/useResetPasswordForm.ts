import { useState } from "react";
import axios from "axios";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import {
    CompleteRegisterSchema,
    CompleteRegisterBaseShape,
} from "../schemas/auth.schemas";
import { resetPasswordService } from "../services/auth.service";
import { getStringLimits } from "@/utils/zod-utils";
import { parseApiError } from "@/utils/error-mapper";
import { handleApiError } from "@/utils/handleApiError";
import { toast } from "@/shared/store/toastStore";
import type { ApiErrorResponse } from "@/types";

type FormData = z.infer<typeof CompleteRegisterSchema>;

const passwordLimits = getStringLimits(
    CompleteRegisterBaseShape.shape.password
);

const LOG_CONTEXT = "[useResetPasswordForm]";

interface UseResetPasswordFormProps {
    sessionToken: string;
    onSuccess: () => void;
}

export function useResetPasswordForm({
    sessionToken,
    onSuccess,
}: UseResetPasswordFormProps) {
    const { t } = useTranslation(["validationErrors", "common", "businessErrors"]);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(CompleteRegisterSchema),
        mode: "onChange",
        reValidateMode: "onChange",
    });

    // ── Submit ────────────────────────────────────────
    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true);
            await resetPasswordService({ sessionToken, password: data.password });
            onSuccess();
        } catch (err: unknown) {
            if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
                const { globalMessage, fieldErrors } = parseApiError(err.response.data);

                if (Object.keys(fieldErrors).length > 0) {
                    Object.entries(fieldErrors).forEach(([field, message]) => {
                        setError(field as FieldPath<FormData>, {
                            type: "server",
                            message:
                                message ??
                                t("businessErrors:VAL_001", { defaultValue: "Dữ liệu không hợp lệ" }),
                        });
                    });

                    console.error(`${LOG_CONTEXT} Lỗi validate từ server:`, err);

                    if (globalMessage) {
                        toast.error(globalMessage);
                    }
                    return;
                }
            }

            handleApiError(err, {
                context: LOG_CONTEXT,
                action: "Lỗi đặt lại mật khẩu",
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
            fieldName: FieldPath<FormData>,
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
        passwordLimits,
    };
}