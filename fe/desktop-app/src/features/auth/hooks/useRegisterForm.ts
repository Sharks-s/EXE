import { useState } from "react";
import axios from "axios";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import { RegisterInitSchema } from "../schemas/auth.schemas";
import { getStringLimits } from "@/utils/zod-utils";
import { parseApiError } from "@/utils/error-mapper";
import { registerInitService } from "../services/auth.service";
import { toast } from "@/shared/store/toastStore";
import type { ApiErrorResponse } from "@/types";
import type { RegisterResponse } from "../types/auth.types";

type FormData = z.infer<typeof RegisterInitSchema>;

// Chạy ngoài hook — không tính lại mỗi render
const emailLimits = getStringLimits(RegisterInitSchema.shape.email);

interface UseRegisterFormProps {
  onRegisterSuccess: (data: RegisterResponse) => void;
}

export function useRegisterForm({ onRegisterSuccess }: UseRegisterFormProps) {
  const { t } = useTranslation(["validationErrors", "common"]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(RegisterInitSchema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // ── Submit ────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const res = await registerInitService({ email: data.email });
      onRegisterSuccess(res);
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
        toast.error(
          t("common:errors.unexpected", {
            defaultValue: "An unexpected error occurred.",
          })
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Clear error khi user gõ lại ───────────────────
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
    // react-hook-form
    register,
    handleSubmit,
    errors,

    // handlers
    onSubmit,
    createChangeHandler,

    // state
    loading,

    // i18n + limits
    t,
    emailLimits,
  };
}