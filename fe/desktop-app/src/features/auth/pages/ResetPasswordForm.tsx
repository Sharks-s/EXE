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
import { getStringLimits } from "../../../utils/zod-utils";
import { parseApiError } from "../../../utils/error-mapper";
import type { ApiErrorResponse } from "../../../types";

type FormData = z.infer<typeof CompleteRegisterSchema>;

type Props = {
  sessionToken: string;
  onSuccess: () => void;
  onBack: () => void;
};

const passwordLimits = getStringLimits(
  CompleteRegisterBaseShape.shape.password,
);

export default function ResetPasswordForm({
  sessionToken,
  onSuccess,
  onBack,
}: Props) {
  const { t } = useTranslation(["validationErrors", "common", "businessErrors"]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

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

  const passwordReg = register("password");
  const confirmPasswordReg = register("confirmPassword");

  const onSubmit = async (data: FormData) => {
    setGlobalError("");
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

        if (globalMessage) setGlobalError(globalMessage);
      } else {
        setGlobalError(t("businessErrors:SYS_001"));
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError =
    (
      fieldName: FieldPath<FormData>,
      originalOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      originalOnChange(e);
      if (globalError) setGlobalError("");
      clearErrors(fieldName);
    };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-center justify-center text-center px-4"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        {t("common:auth.new_password_title", {
          defaultValue: "New Password",
        })}
      </h1>

      <p className="text-sm text-slate-500 mb-6">
        {t("common:auth.new_password_subtitle", {
          defaultValue: "Hãy nhập mật khẩu mới của bạn",
        })}
      </p>

      <div className="w-full max-w-sm">
        <input
          {...passwordReg}
          onChange={clearFieldError("password", passwordReg.onChange)}
          type="password"
          autoComplete="new-password"
          placeholder={t("common:auth.password_placeholder", {
            defaultValue: "Password",
          })}
          className={`w-full px-4 py-3 text-sm rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none transition ${
            errors.password
              ? "border-red-400 focus:ring-2 focus:ring-red-400/30"
              : "border-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
          }`}
        />
        {errors.password?.message && (
          <p className="mt-1 text-xs text-red-500">
            {t(`validationErrors:password.${errors.password.message}`, {
              min: passwordLimits.min,
              max: passwordLimits.max,
            })}
          </p>
        )}
      </div>

      <div className="w-full max-w-sm mt-3">
        <input
          {...confirmPasswordReg}
          onChange={clearFieldError(
            "confirmPassword",
            confirmPasswordReg.onChange,
          )}
          type="password"
          autoComplete="new-password"
          placeholder={t("common:auth.confirm_password_placeholder", {
            defaultValue: "Confirm Password",
          })}
          className={`w-full px-4 py-3 text-sm rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none transition ${
            errors.confirmPassword
              ? "border-red-400 focus:ring-2 focus:ring-red-400/30"
              : "border-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
          }`}
        />
        {errors.confirmPassword?.message && (
          <p className="mt-1 text-xs text-red-500">
            {t(
              `validationErrors:confirmPassword.${errors.confirmPassword.message}`,
              { defaultValue: "Passwords do not match" },
            )}
          </p>
        )}
      </div>

      <div className="w-full max-w-sm min-h-[24px] mt-3 text-center">
        {globalError && !Object.keys(errors).length && (
          <p className="text-sm text-red-500">{globalError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`mt-3 px-12 py-3 rounded-xl text-sm font-semibold uppercase bg-[#9fd6fa] text-[#0f172a] transition ${
          loading
            ? "opacity-60 cursor-wait"
            : "hover:bg-[#7bc3f7] hover:shadow-[0_0_25px_rgba(159,214,250,0.65)]"
        }`}
      >
        {loading
          ? t("common:auth.resetting", { defaultValue: "Resetting..." })
          : t("common:auth.btn_reset_password", {
              defaultValue: "Reset Password",
            })}
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
