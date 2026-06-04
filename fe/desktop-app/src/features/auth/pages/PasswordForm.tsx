// PasswordForm.tsx
import { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { completeRegisterService } from "../services/auth.service";
import {
  CompleteRegisterSchema,
  CompleteRegisterBaseShape,
} from "../schemas/auth.schemas";
import { getStringLimits } from "../../../utils/zod-utils";
import { parseApiError } from "../../../utils/error-mapper";
import { useAuthStore } from "../stores/authStore";
import type { ApiErrorResponse } from "../../../types";

type Props = {
  sessionToken: string;
  onBack: () => void;
};

type FormData = z.infer<typeof CompleteRegisterSchema>;

const passwordLimits = getStringLimits(
  CompleteRegisterBaseShape.shape.password,
);

export default function PasswordForm({ sessionToken, onBack }: Props) {
  const { t } = useTranslation(["validationErrors", "common"]);
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

  const onSubmit = async (data: FormData) => {
    setLocalGlobalError("");
    try {
      setLoading(true);
      await completeRegisterService({
        sessionToken,
        password: data.password,
      });
      // completeRegisterService tự set user vào authStore
      // MainWindow detect user → render Dashboard/SetupProfile
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

  const passwordReg = register("password");
  const confirmPasswordReg = register("confirmPassword");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col items-center justify-center text-center px-4"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        {t("common:auth.set_password_title", { defaultValue: "Set Password" })}
      </h1>

      <p className="text-sm text-slate-500 mb-6">
        {t("common:auth.set_password_subtitle", {
          defaultValue: "Almost there! Set a password for your account",
        })}
      </p>

      {/* PASSWORD */}
      <div className="w-full max-w-sm">
        <input
          {...passwordReg}
          onChange={createChangeHandler("password", passwordReg.onChange)}
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

      {/* CONFIRM PASSWORD */}
      <div className="w-full max-w-sm mt-3">
        <input
          {...confirmPasswordReg}
          onChange={createChangeHandler(
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

      {/* GLOBAL ERROR */}
      <div className="w-full max-w-sm min-h-[24px] mt-3 text-center">
        {localGlobalError && !Object.keys(errors).length && (
          <p className="text-sm text-red-500">{localGlobalError}</p>
        )}
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className={`mt-3 px-12 py-3 rounded-xl text-sm font-semibold uppercase bg-yellow-400 text-black transition ${
          loading
            ? "opacity-60 cursor-wait"
            : "hover:shadow-[0_0_25px_rgba(250,204,21,0.7)]"
        }`}
      >
        {loading
          ? t("common:auth.completing", { defaultValue: "Setting up..." })
          : t("common:auth.btn_complete", { defaultValue: "Complete" })}
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
