import { useResetPasswordForm } from "../hooks/useResetPasswordForm";

type Props = {
  sessionToken: string;
  onSuccess: () => void;
  onBack: () => void;
};

export default function ResetPasswordForm({
  sessionToken,
  onSuccess,
  onBack,
}: Props) {
  const {
    register,
    handleSubmit,
    errors,
    onSubmit,
    createChangeHandler,
    loading,
    t,
    passwordLimits,
  } = useResetPasswordForm({ sessionToken, onSuccess });

  const passwordReg = register("password");
  const confirmPasswordReg = register("confirmPassword");

  // Tách biệt lỗi Server và Zod
  const passwordErrorMessage = errors.password?.message
    ? errors.password.type === "server"
      ? errors.password.message
      : t(`validationErrors:password.${errors.password.message}`, {
        min: passwordLimits.min,
        max: passwordLimits.max,
        defaultValue: errors.password.message,
      })
    : null;

  const confirmPasswordErrorMessage = errors.confirmPassword?.message
    ? errors.confirmPassword.type === "server"
      ? errors.confirmPassword.message
      : t(`validationErrors:confirmPassword.${errors.confirmPassword.message}`, {
        defaultValue: "Mật khẩu không khớp",
      })
    : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
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
          className={`w-full px-4 py-3 text-sm rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none transition ${errors.password
              ? "border-red-400 focus:ring-2 focus:ring-red-400/30"
              : "border-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
            }`}
        />
        {passwordErrorMessage && (
          <p className="mt-1 text-xs text-left text-red-500">
            {passwordErrorMessage}
          </p>
        )}
      </div>

      {/* CONFIRM PASSWORD */}
      <div className="w-full max-w-sm mt-3">
        <input
          {...confirmPasswordReg}
          onChange={createChangeHandler(
            "confirmPassword",
            confirmPasswordReg.onChange
          )}
          type="password"
          autoComplete="new-password"
          placeholder={t("common:auth.confirm_password_placeholder", {
            defaultValue: "Confirm Password",
          })}
          className={`w-full px-4 py-3 text-sm rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none transition ${errors.confirmPassword
              ? "border-red-400 focus:ring-2 focus:ring-red-400/30"
              : "border-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
            }`}
        />
        {confirmPasswordErrorMessage && (
          <p className="mt-1 text-xs text-left text-red-500">
            {confirmPasswordErrorMessage}
          </p>
        )}
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className={`mt-6 px-12 py-3 rounded-xl text-sm font-semibold uppercase bg-[#9fd6fa] cursor-pointer text-[#0f172a] transition duration-300 ${loading
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
        className="mt-4 text-sm text-slate-500 hover:underline cursor-pointer"
      >
        {t("common:auth.btn_back", { defaultValue: "Back" })}
      </button>
    </form>
  );
}