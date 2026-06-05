import { useState } from "react";
import axios from "axios";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import { LoginSchema } from "../schemas/auth.schemas";
import { getStringLimits } from "../../../utils/zod-utils";
import { parseApiError } from "../../../utils/error-mapper";
import { useAuthStore } from "../stores/authStore";
import type { ApiErrorResponse } from "../../../types";

type LoginFormData = z.infer<typeof LoginSchema>;

// Chạy ngoài hook — không tính lại mỗi render
const emailLimits = getStringLimits(LoginSchema.shape.email);
const passwordLimits = getStringLimits(LoginSchema.shape.password);

export function useLoginForm() {
  const { t } = useTranslation(["validationErrors", "common"]);
  const { login, isLoading, error: authError, clearError } = useAuthStore();
  const [localGlobalError, setLocalGlobalError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // ── Submit ────────────────────────────────────────
  const onSubmit = async (data: LoginFormData) => {
    setLocalGlobalError("");
    if (authError) clearError();

    try {
      await login(data);
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        const { globalMessage, fieldErrors } = parseApiError(err.response.data);

        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as FieldPath<LoginFormData>, {
            type: "server",
            message: message ?? "Invalid",
          });
        });

        if (globalMessage) setLocalGlobalError(globalMessage);
      } else {
        setLocalGlobalError("An unexpected error occurred.");
      }
    }
  };

  // ── Clear error khi user gõ lại ───────────────────
  const createChangeHandler =
    (
      fieldName: FieldPath<LoginFormData>,
      originalOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      originalOnChange(e);
      if (authError) clearError();
      if (localGlobalError) setLocalGlobalError("");
      clearErrors(fieldName);
    };

  const displayGlobalError = localGlobalError || authError;

  return {
    // react-hook-form
    register,
    handleSubmit,
    errors,

    // handlers
    onSubmit,
    createChangeHandler,

    // state
    isLoading,
    displayGlobalError,

    // i18n + limits
    t,
    emailLimits,
    passwordLimits,
  };
}
