import { useVerifyForm } from "../hooks/useVerifyForm";

type Props = {
  email: string;
  expiresInSeconds: number;
  verifyId: string;
  onVerify: (data: { verifyId: string; otp: string }) => Promise<{
    sessionToken: string;
  }>;
  onResend: () => Promise<{
    expiresInSeconds: number;
  }>;
  onVerifySuccess: (sessionToken: string) => void;
  onBack: () => void;
};

export default function VerifyForm({
  email,
  expiresInSeconds,
  verifyId,
  onVerify,
  onResend,
  onVerifySuccess,
  onBack,
}: Props) {
  const {
    digits,
    otp,
    remaining,
    loading,
    error,
    inputsRef,
    handleDigitChange,
    handleKeyDown,
    handlePaste,
    handleVerify,
    handleResend,
    t,
  } = useVerifyForm({
    verifyId,
    expiresInSeconds,
    onVerify,
    onResend,
    onVerifySuccess,
  });

  return (
    <form
      onSubmit={handleVerify}
      className="flex flex-col items-center justify-center text-center px-4"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        {t("common:auth.verify_title", { defaultValue: "Verify OTP" })}
      </h1>

      <p className="text-sm text-slate-500 mb-6">
        {t("common:auth.verify_subtitle", {
          defaultValue: "We sent a 6-digit code to",
        })}{" "}
        <span className="font-medium text-slate-700">{email}</span>
      </p>

      {/* OTP INPUTS */}
      <div className="flex gap-2 sm:gap-3 mb-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={(e) => handlePaste(e, i)}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            className={`w-11 h-11 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-lg border bg-white focus:outline-none transition ${error
                ? "border-red-400 focus:ring-2 focus:ring-red-400/30 text-red-600"
                : "border-slate-300 focus:border-[#9fd6fa] focus:ring-2 focus:ring-[#9fd6fa]/30 text-slate-700"
              }`}
          />
        ))}
      </div>

      {/* ERROR MESSAGE */}
      <div className="min-h-[20px] mb-4">
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={loading || otp.length < 6}
        className={`px-10 py-3 rounded-xl text-sm font-semibold uppercase bg-[#9fd6fa] cursor-pointer text-[#0f172a] transition duration-300 ${loading || otp.length < 6
            ? "opacity-60 cursor-not-allowed"
            : "hover:bg-[#7bc3f7] hover:shadow-[0_0_25px_rgba(159,214,250,0.65)]"
          }`}
      >
        {loading
          ? t("common:auth.verifying", { defaultValue: "Verifying..." })
          : t("common:auth.btn_verify", { defaultValue: "Verify" })}
      </button>

      {/* EXPIRES COUNTDOWN */}
      <p className="mt-4 text-sm text-slate-600">
        {t("common:auth.expires_in", { defaultValue: "Expires in" })}{" "}
        <b className="text-slate-800">{remaining}s</b>
      </p>

      {/* RESEND & BACK */}
      <div className="mt-4 flex gap-6 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={remaining > 0 || loading}
          className="text-[#0f8fd8] font-medium disabled:opacity-40 hover:underline cursor-pointer"
        >
          {t("common:auth.btn_resend", { defaultValue: "Resend OTP" })}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="text-slate-500 hover:underline cursor-pointer"
        >
          {t("common:auth.btn_back", { defaultValue: "Back" })}
        </button>
      </div>
    </form>
  );
}