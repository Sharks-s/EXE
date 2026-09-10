import { useState } from "react";
import axios from "axios";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import { RegisterInitSchema } from "../schemas/auth.schemas";
import { getStringLimits } from "@/utils/zod-utils";
import { parseApiError } from "@/utils/error-mapper";
import { handleApiError } from "@/utils/handleApiError";
import { registerInitService } from "../services/auth.service";
import { toast } from "@/shared/store/toastStore";
import type { ApiErrorResponse } from "@/types";
import type { RegisterResponse } from "../types/auth.types";

type FormData = z.infer<typeof RegisterInitSchema>;

const emailLimits = getStringLimits(RegisterInitSchema.shape.email);
const LOG_CONTEXT = "[useRegisterForm]";

interface UseRegisterFormProps {
  onRegisterSuccess: (data: RegisterResponse) => void;
}

export function useRegisterForm({ onRegisterSuccess }: UseRegisterFormProps) {
  const { t } = useTranslation(["validationErrors", "common", "businessErrors"]);
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

      // Đẩy mọi lỗi còn lại cho handleApiError xử lý tập trung
      handleApiError(err, {
        context: LOG_CONTEXT,
        action: "Lỗi khởi tạo đăng ký",
        fallbackMessage: t("businessErrors:SYS_001", {
          defaultValue: "Lỗi hệ thống, vui lòng thử lại sau",
        }),
      });
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