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
import { getStringLimits } from "../../../utils/zod-utils";
import { parseApiError } from "../../../utils/error-mapper";
import { useAuthStore } from "../stores/authStore";
import type { ApiErrorResponse } from "../../../types";

type FormData = z.infer<typeof CompleteRegisterSchema>;

const passwordLimits = getStringLimits(
  CompleteRegisterBaseShape.shape.password,
);

interface UsePasswordFormProps {
  sessionToken: string;
}

export function usePasswordForm({ sessionToken }: UsePasswordFormProps) {
  const { t } = useTranslation(["validationErrors", "common"]);
  const { completeRegister } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [localGlobalError, setLocalGlobalError] = useState("");

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
    setLocalGlobalError("");
    try {
      setLoading(true);
      await completeRegister({
        sessionToken,
        password: data.password,
      });
      // completeRegisterService set user vào authStore
      // MainWindow tự detect → render Dashboard/SetupProfile
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        const { globalMessage, fieldErrors } = parseApiError(err.response.data);

        Object.entries(fieldErrors).forEach(([field, message]) => {
          setError(field as FieldPath<FormData>, {
            type: "server",
            message: message ?? "Invalid value",
          });
        });

        if (globalMessage) setLocalGlobalError(globalMessage);
      } else {
        setLocalGlobalError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Clear error khi user gõ lại ───────────────────
  const createChangeHandler =
    (
      fieldName: FieldPath<FormData>,
      originalOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      originalOnChange(e);
      if (localGlobalError) setLocalGlobalError("");
      clearErrors(fieldName);
    };

  return {
    // react-hook-form
    register,
    handleSubmit,
    errors,

    // handlers
    onSubmit,
    createChangeHandler,

    // state
    loading,
    localGlobalError,

    // i18n + limits
    t,
    passwordLimits,
  };
}
