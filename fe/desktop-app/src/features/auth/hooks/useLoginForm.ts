import axios from "axios";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import { LoginSchema } from "../schemas/auth.schemas";
import { getStringLimits } from "@/utils/zod-utils";
import { parseApiError } from "@/utils/error-mapper";
import { handleApiError } from "@/utils/handleApiError";
import { useAuthStore } from "../stores/authStore";
import { toast } from "@/shared/store/toastStore";
import type { ApiErrorResponse } from "@/types";

type LoginFormData = z.infer<typeof LoginSchema>;

// Chạy ngoài hook — không tính lại mỗi render
const emailLimits = getStringLimits(LoginSchema.shape.email);
const passwordLimits = getStringLimits(LoginSchema.shape.password);

const LOG_CONTEXT = "[useLoginForm]";

export function useLoginForm() {
  const { t } = useTranslation(["validationErrors", "businessErrors", "common"]);
  const { login, isLoading, error: authError, clearError } = useAuthStore();

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
    if (authError) clearError();

    try {
      await login(data);
    } catch (err: unknown) {
      // Case field-level errors (VAL_001 kèm errors[]) — giữ xử lý riêng vì
      // cần setError() cho từng field cụ thể, handleApiError chỉ lo global message.
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        const { globalMessage, fieldErrors } = parseApiError(err.response.data);

        if (Object.keys(fieldErrors).length > 0) {
          Object.entries(fieldErrors).forEach(([field, message]) => {
            setError(field as FieldPath<LoginFormData>, {
              type: "server",
              message:
                message ??
                t("businessErrors:VAL_001", { defaultValue: "Dữ liệu không hợp lệ" }),
            });
          });
          // Log để trace kể cả khi đã có field error hiển thị trên UI
          console.error(`${LOG_CONTEXT} Lỗi validate từ server:`, err);

          if (globalMessage) toast.error(globalMessage);
          return;
        }
      }

      // Mọi trường hợp còn lại (business error không kèm field, network error,
      // timeout...) -> đi qua handleApiError để log + toast thống nhất toàn app.
      handleApiError(err, {
        context: LOG_CONTEXT,
        action: "Lỗi đăng nhập",
        fallbackMessage: t("businessErrors:SYS_001", {
          defaultValue: "Lỗi hệ thống, vui lòng thử lại sau",
        }),
      });
    }
  };

  // ── Clear error khi user gõ lại ───────────────────
  const createChangeHandler =
    (
      fieldName: FieldPath<LoginFormData>,
      originalOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    ) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        originalOnChange(e);
        if (authError) clearError();
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
    isLoading,

    // i18n + limits
    t,
    emailLimits,
    passwordLimits,
  };
}