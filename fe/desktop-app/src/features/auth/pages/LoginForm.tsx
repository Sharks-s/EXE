import { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useAuthStore } from "../stores/authStore";
import { LoginSchema } from "../schemas/auth.schemas";
import { getStringLimits } from "../../../utils/zod-utils";
import { parseApiError } from "../../../utils/error-mapper";
import type { ApiErrorResponse } from "../../../types";

type LoginFormData = z.infer<typeof LoginSchema>;

// Bóc tách giới hạn ký tự từ schema để truyền vào i18n
const passwordLimits = getStringLimits(LoginSchema.shape.password);
const emailLimits = getStringLimits(LoginSchema.shape.email);

export default function LoginForm() {
  // Chuyển sang Named export cho đồng bộ
  // 2. Lấy state và actions từ Zustand authStore
  const { login, isLoading, error: authError, clearError } = useAuthStore();

  const { t } = useTranslation(["validationErrors", "common"]);
  const [localGlobalError, setLocalGlobalError] = useState<string>("");

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

  /* ===============================
      SUBMIT LOGIC
  =============================== */
  const onSubmit = async (data: LoginFormData) => {
    setLocalGlobalError("");
    if (authError) clearError();

    try {
      // 3. Gọi hàm login của Zustand. Hàm này tự lưu token vào memory,
      // cập nhật session flag và chuyển trạng thái user để drive UI đổi màn hình.
      await login(data);

      // XOÁ BỎ: navigate("/home") cũ ở đây!
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        const { globalMessage, fieldErrors } = parseApiError(err.response.data);

        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          Object.entries(fieldErrors).forEach(([field, message]) => {
            const fieldName = field as FieldPath<LoginFormData>;
            setError(fieldName, {
              type: "server",
              message: message ?? "Invalid",
            });
          });
        }

        if (globalMessage) {
          setLocalGlobalError(String(globalMessage));
        }
      } else {
        setLocalGlobalError("An unexpected error occurred. Please try again.");
      }
    }
  };

  /* ===============================
      CHANGE HANDLER
  =============================== */
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

  const emailReg = register("email");
  const passwordReg = register("password");

  const displayGlobalError = localGlobalError || authError;
  const isEmailError = !!errors.email || !!displayGlobalError;
  const isPasswordError = !!errors.password || !!displayGlobalError;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="h-full w-full flex flex-col items-center justify-center bg-[#f1f5f9] px-10 rounded-tr-[100px]"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        {t("common:auth.login_title", { defaultValue: "Sign In" })}
      </h1>

      {/* SOCIAL LOGIN */}
      <div className="flex gap-3 my-5">
        <button
          type="button"
          onClick={() => {
            window.location.href =
              "http://localhost:8080/oauth2/authorize/google";
          }}
          className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-300 text-slate-600 font-semibold hover:border-yellow-400 hover:text-yellow-500 hover:shadow-[0_0_12px_rgba(250,204,21,0.5)] transition"
        >
          G
        </button>
        <button
          type="button"
          disabled
          className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
        >
          F
        </button>
      </div>

      <span className="text-sm text-slate-500 mb-4">
        {t("common:auth.login_subtitle", {
          defaultValue: "Use your email & password",
        })}
      </span>

      {/* EMAIL INPUT */}
      <div className="w-full max-w-sm">
        <input
          {...emailReg}
          onChange={createChangeHandler("email", emailReg.onChange)}
          type="text"
          autoComplete="email"
          placeholder={t("common:auth.email_placeholder", {
            defaultValue: "Email",
          })}
          className={`w-full px-4 py-3 text-sm rounded-xl border bg-white focus:outline-none transition ${
            isEmailError
              ? "border-red-400 focus:ring-2 focus:ring-red-400/30"
              : "border-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
          }`}
        />
        {errors.email?.message && (
          <p className="mt-1 text-xs text-red-500">
            {t(`validationErrors:email.${errors.email.message}`, {
              max: emailLimits.max,
            })}
          </p>
        )}
      </div>

      {/* PASSWORD INPUT */}
      <div className="w-full max-w-sm mt-3">
        <input
          {...passwordReg}
          onChange={createChangeHandler("password", passwordReg.onChange)}
          type="password"
          placeholder={t("common:auth.password_placeholder", {
            defaultValue: "Password",
          })}
          autoComplete="current-password"
          className={`w-full px-4 py-3 text-sm rounded-xl border bg-white focus:outline-none transition ${
            isPasswordError
              ? "border-red-400 focus:ring-2 focus:ring-red-400/30"
              : "border-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
          }`}
        />
        {errors.password?.message && (
          <p className="mt-1 text-xs text-red-500">
            {t(`validationErrors:password.${errors.password.message}`, {
              max: passwordLimits.max,
            })}
          </p>
        )}
      </div>

      {/* GLOBAL ERROR */}
      <div className="w-full max-w-sm min-h-[24px] mt-2 text-center">
        {displayGlobalError && !Object.keys(errors).length && (
          <p className="text-sm text-red-500 font-medium">
            {displayGlobalError}
          </p>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={isLoading}
        className={`mt-3 px-12 py-3 rounded-xl text-sm font-semibold uppercase bg-yellow-400 text-black transition ${
          isLoading
            ? "opacity-60 cursor-wait"
            : "hover:shadow-[0_0_25px_rgba(250,204,21,0.7)]"
        }`}
      >
        {isLoading
          ? t("common:auth.signing_in", { defaultValue: "Signing in..." })
          : t("common:auth.btn_login", { defaultValue: "Sign In" })}
      </button>
    </form>
  );
}
