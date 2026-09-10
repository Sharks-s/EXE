import { useRegisterForm } from "../hooks/useRegisterForm";
import type { RegisterResponse } from "../types/auth.types";
import SocialButtons from "./SocialButtons";

type Props = {
  onRegisterSuccess: (data: RegisterResponse) => void;
};

export default function RegisterForm({ onRegisterSuccess }: Props) {
  const {
    register,
    handleSubmit,
    errors,
    onSubmit,
    createChangeHandler,
    loading,
    t,
    emailLimits,
  } = useRegisterForm({ onRegisterSuccess });

  const emailReg = register("email");

  // Xử lý message linh hoạt: Server trả về nguyên câu thì in luôn, Zod trả về key thì dịch qua i18n
  const emailErrorMessage = errors.email?.message
    ? errors.email.type === "server"
      ? errors.email.message
      : t(`validationErrors:email.${errors.email.message}`, {
        max: emailLimits.max,
        defaultValue: errors.email.message,
      })
    : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="h-full w-full flex flex-col items-center justify-center bg-[#f1f5f9] px-10 rounded-tl-[100px]"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        {t("common:auth.register_title", { defaultValue: "Create Account" })}
      </h1>

      <span className="text-sm text-slate-500 mb-2">
        {t("common:auth.register_subtitle", {
          defaultValue: "or use your email for registration",
        })}
      </span>

      {/* EMAIL */}
      <div className="w-full max-w-sm">
        <input
          {...emailReg}
          onChange={createChangeHandler("email", emailReg.onChange)}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("common:auth.email_placeholder", {
            defaultValue: "Email",
          })}
          className={`w-full px-4 py-3 mt-3 text-sm rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none transition ${errors.email
              ? "border-red-400 focus:ring-2 focus:ring-red-400/30"
              : "border-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
            }`}
        />
        {emailErrorMessage && (
          <p className="mt-1 text-xs text-left text-red-500">
            {emailErrorMessage}
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
          ? t("common:auth.signing_up", { defaultValue: "Signing up..." })
          : t("common:auth.btn_register", { defaultValue: "Sign Up" })}
      </button>

      <div className="flex items-center my-4 w-full max-w-sm">
        {/* Đường gạch trái */}
        <div className="flex-grow border-t border-slate-200"></div>

        {/* Chữ ở giữa */}
        <span className="shrink-0 px-3 text-xs font-medium text-slate-400 uppercase">
          {t("common:auth.login_divider", { defaultValue: "Or sign up with" })}
        </span>

        {/* Đường gạch phải */}
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* SOCIAL LOGIN */}
      <SocialButtons />
    </form>
  );
}