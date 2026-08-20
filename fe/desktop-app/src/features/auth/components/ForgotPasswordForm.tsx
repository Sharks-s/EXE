import { useForgotPasswordForm } from "../hooks/useForgotPasswordForm";
import type { ForgotPasswordResponse } from "../types/auth.types";

type Props = {
  onSuccess: (res: ForgotPasswordResponse, email: string) => void;
  onBack: () => void;
};

export default function ForgotPasswordForm({ onSuccess, onBack }: Props) {
  const {
    register,
    handleSubmit,
    errors,
    onSubmit,
    createChangeHandler,
    loading,
    t,
  } = useForgotPasswordForm({ onSuccess });

  const emailReg = register("email");

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
          defaultValue: "Nhập email của bạn và chúng tôi sẽ gửi OTP cho bạn",
        })}
      </p>

      {/* EMAIL */}
      <div className="w-full max-w-sm">
        <input
          {...emailReg}
          onChange={createChangeHandler("email", emailReg.onChange)}
          type="text"
          autoComplete="email"
          placeholder={t("common:auth.email_placeholder", {
            defaultValue: "Email",
          })}
          className={`w-full px-4 py-3 text-sm rounded-xl border bg-white focus:outline-none transition ${errors.email
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

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className={`mt-6 px-10 py-3 rounded-xl text-sm font-semibold uppercase bg-[#9fd6fa] cursor-pointer text-[#0f172a] transition duration-300 ${loading
            ? "opacity-60 cursor-wait"
            : "hover:bg-[#7bc3f7] hover:shadow-[0_0_25px_rgba(159,214,250,0.65)]"
          }`}
      >
        {loading
          ? t("common:auth.sending", { defaultValue: "Sending..." })
          : t("common:auth.btn_send_otp", { defaultValue: "Gửi OTP" })}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-sm text-slate-500 hover:underline cursor-pointer"
      >
        {t("common:auth.btn_back", { defaultValue: "Back" })}
      </button>
    </form>
  );
}