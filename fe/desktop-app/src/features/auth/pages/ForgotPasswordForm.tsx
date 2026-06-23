import { useState } from "react";
import axios from "axios";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { RegisterInitSchema } from "../schemas/auth.schemas";
import { forgotPasswordService } from "../services/auth.service";
import { parseApiError } from "../../../utils/error-mapper";
import type { ApiErrorResponse } from "../../../types";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from "../types/auth.types";

type Props = {
  onSuccess: (res: ForgotPasswordResponse, email: string) => void;
  onBack: () => void;
};

export default function ForgotPasswordForm({ onSuccess, onBack }: Props) {
  const { t } = useTranslation(["validationErrors", "common", "businessErrors"]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

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

  const emailReg = register("email");

  const onSubmit = async (data: ForgotPasswordRequest) => {
    setGlobalError("");
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
            message: message ?? "Invalid",
          });
        });
        setGlobalError(globalMessage);
      } else {
        setGlobalError(t("businessErrors:SYS_001"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-center justify-center text-center px-4"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        {t("common:auth.forgot_title", { defaultValue: "Reset Password" })}
      </h1>

      <p className="text-sm text-slate-500 mb-6">
        {t("common:auth.forgot_subtitle", {
          defaultValue: "Nhập email của bạn và tôi sẽ gửi OTP cho bạn",
        })}
      </p>

      <div className="w-full max-w-sm">
        <input
          {...emailReg}
          onChange={(e) => {
            emailReg.onChange(e);
            if (globalError) setGlobalError("");
            clearErrors("email");
          }}
          type="text"
          autoComplete="email"
          placeholder={t("common:auth.email_placeholder", {
            defaultValue: "Email",
          })}
          className={`w-full px-4 py-3 text-sm rounded-xl border bg-white focus:outline-none transition ${
            errors.email
              ? "border-red-400 focus:ring-2 focus:ring-red-400/30"
              : "border-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
          }`}
        />
        {errors.email?.message && (
          <p className="mt-1 text-xs text-red-500">
            {t(`validationErrors:email.${errors.email.message}`, {
              defaultValue: errors.email.message,
            })}
          </p>
        )}
      </div>

      <div className="w-full max-w-sm min-h-[24px] mt-3 text-center">
        {globalError && <p className="text-sm text-red-500">{globalError}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`mt-3 px-10 py-3 rounded-xl text-sm font-semibold uppercase bg-yellow-400 text-black transition ${
          loading
            ? "opacity-60 cursor-wait"
            : "hover:shadow-[0_0_25px_rgba(250,204,21,0.7)]"
        }`}
      >
        {loading
          ? t("common:auth.sending", { defaultValue: "Sending..." })
          : t("common:auth.btn_send_otp", { defaultValue: "Gửi OTP" })}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-sm text-slate-500 hover:underline"
      >
        {t("common:auth.btn_back", { defaultValue: "Back" })}
      </button>
    </form>
  );
}
