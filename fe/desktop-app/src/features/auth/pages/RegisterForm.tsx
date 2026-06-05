import { useRegisterForm } from "../hooks/useRegisterForm";
import type { RegisterResponse } from "../types/auth.types";

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
    localGlobalError,
    t,
    emailLimits,
  } = useRegisterForm({ onRegisterSuccess });

  const emailReg = register("email");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="h-full w-full flex flex-col items-center justify-center bg-[#f1f5f9] px-10 rounded-tl-[100px]"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        {t("common:auth.register_title", { defaultValue: "Create Account" })}
      </h1>

      {/* SOCIAL REGISTER */}
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
          className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 font-semibold cursor-not-allowed opacity-60"
        >
          F
        </button>
      </div>

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
          type="text"
          inputMode="email"
          autoComplete="email"
          placeholder={t("common:auth.email_placeholder", {
            defaultValue: "Email",
          })}
          className={`w-full px-4 py-3 mt-3 text-sm rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none transition ${
            errors.email
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
          ? t("common:auth.signing_up", { defaultValue: "Signing up..." })
          : t("common:auth.btn_register", { defaultValue: "Sign Up" })}
      </button>
    </form>
  );
}
