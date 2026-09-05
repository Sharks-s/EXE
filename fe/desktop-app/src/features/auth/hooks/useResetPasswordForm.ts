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
import { toast } from "@/shared/store/toastStore";
import type { ApiErrorResponse } from "@/types";

type FormData = z.infer<typeof CompleteRegisterSchema>;

const passwordLimits = getStringLimits(
    CompleteRegisterBaseShape.shape.password
);

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

                Object.entries(fieldErrors).forEach(([field, message]) => {
                    setError(field as FieldPath<FormData>, {
                        type: "server",
                        message: message ?? "Invalid value",
                    });
                });

                if (globalMessage) {
                    toast.error(globalMessage);
                }
            } else {
                toast.error(t("businessErrors:SYS_001"));
            }
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