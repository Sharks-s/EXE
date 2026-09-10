import { useLoginForm } from "../hooks/useLoginForm";
import SocialButtons from "./SocialButtons";

type Props = {
  onForgotPassword: () => void;
};

export default function LoginForm({ onForgotPassword }: Props) {
  const {
    register,
    handleSubmit,
    errors,
    onSubmit,
    createChangeHandler,
    isLoading,
    t,
    emailLimits,
    passwordLimits,
  } = useLoginForm();

  const emailReg = register("email");
  const passwordReg = register("password");

  const isEmailError = !!errors.email;
  const isPasswordError = !!errors.password;

  // Xử lý message linh hoạt: Server trả về nguyên câu thì in luôn, Zod trả về key thì dịch qua i18n
  const emailErrorMessage = errors.email?.message
    ? errors.email.type === "server"
      ? errors.email.message
      : t(`validationErrors:email.${errors.email.message}`, { max: emailLimits.max })
    : null;

  const passwordErrorMessage = errors.password?.message
    ? errors.password.type === "server"
      ? errors.password.message
      : t(`validationErrors:password.${errors.password.message}`, { max: passwordLimits.max })
    : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="h-full w-full flex flex-col items-center justify-center bg-[#f1f5f9] px-10 rounded-tr-[100px]"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        {t("common:auth.login_title", { defaultValue: "Sign In" })}
      </h1>

      <span className="text-sm text-slate-500 mb-3 mt-2">
        {t("common:auth.login_subtitle", {
          defaultValue: "Use your email & password",
        })}
      </span>

      {/* EMAIL */}
      <div className="w-full max-w-sm">
        <input
          {...emailReg}
          onChange={createChangeHandler("email", emailReg.onChange)}
          type="email"
          autoComplete="email"
          placeholder={t("common:auth.email_placeholder", {
            defaultValue: "Email",
          })}
          className={`w-full px-4 py-3 text-sm rounded-xl border bg-white focus:outline-none transition ${isEmailError
            ? "border-red-400 focus:ring-2 focus:ring-red-400/30"
            : "border-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
            }`}
        />
        {emailErrorMessage && (
          <p className="mt-1 text-xs text-red-500 text-left">
            {emailErrorMessage}
          </p>
        )}
      </div>

      {/* PASSWORD */}
      <div className="w-full max-w-sm mt-3">
        <input
          {...passwordReg}
          onChange={createChangeHandler("password", passwordReg.onChange)}
          type="password"
          autoComplete="current-password"
          placeholder={t("common:auth.password_placeholder", {
            defaultValue: "Password",
          })}
          className={`w-full px-4 py-3 text-sm rounded-xl border bg-white focus:outline-none transition ${isPasswordError
            ? "border-red-400 focus:ring-2 focus:ring-red-400/30"
            : "border-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
            }`}
        />
        {passwordErrorMessage && (
          <p className="mt-1 text-xs text-red-500 text-left">
            {passwordErrorMessage}
          </p>
        )}
      </div>

      <div className="w-full max-w-sm mt-2 text-right">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs font-medium text-slate-500 hover:text-yellow-600 hover:underline cursor-pointer"
        >
          {t("common:auth.forgot_password", {
            defaultValue: "Forgot password?",
          })}
        </button>
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={isLoading}
        className={`mt-4 px-12 py-2 rounded-xl text-sm font-semibold uppercase bg-[#9fd6fa] text-[#0f172a] transition duration-300 cursor-pointer ${isLoading
          ? "opacity-60 cursor-wait"
          : "hover:bg-[#7bc3f7] hover:shadow-[0_0_25px_rgba(159,214,250,0.65)]"
          }`}
      >
        {isLoading
          ? t("common:auth.signing_in", { defaultValue: "Signing in..." })
          : t("common:auth.btn_login", { defaultValue: "Sign In" })}
      </button>

      <div className="flex items-center my-4 w-full max-w-sm">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="shrink-0 px-3 text-xs font-medium text-slate-400 uppercase">
          {t("common:auth.login_divider", { defaultValue: "Or sign up with" })}
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* SOCIAL LOGIN */}
      <SocialButtons />
    </form>
  );
}