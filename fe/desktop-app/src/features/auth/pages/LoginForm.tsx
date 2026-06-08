import { useLoginForm } from "../hooks/useLoginForm";

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    errors,
    onSubmit,
    createChangeHandler,
    isLoading,
    displayGlobalError,
    t,
    emailLimits,
    passwordLimits,
  } = useLoginForm();

  const emailReg = register("email");
  const passwordReg = register("password");

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

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={isLoading}
        className={`mt-3 px-12 py-3 rounded-xl text-sm font-semibold uppercase bg-[#9fd6fa] text-[#0f172a] transition duration-300 ${
          isLoading
            ? "opacity-60 cursor-wait"
            : "hover:bg-[#7bc3f7] hover:shadow-[0_0_25px_rgba(159,214,250,0.65)]"
        }`}
      >
        {isLoading
          ? t("common:auth.signing_in", { defaultValue: "Signing in..." })
          : t("common:auth.btn_login", { defaultValue: "Sign In" })}
      </button>
    </form>
  );
}
