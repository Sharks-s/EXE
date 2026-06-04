import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

import {
  verifyOtpService,
  registerInitService,
} from "../services/auth.service";
import type { ApiErrorResponse } from "../../../types";
import { parseApiError } from "../../../utils/error-mapper";

type Props = {
  email: string;
  expiresInSeconds: number;
  verifyId: string;
  onVerifySuccess: (sessionToken: string) => void;
  onBack: () => void;
};

export default function VerifyForm({
  email,
  expiresInSeconds,
  verifyId,
  onVerifySuccess,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [remaining, setRemaining] = useState(expiresInSeconds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const otp = digits.join("");

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((r) => Math.max(r - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 1);
    if (!v && value !== "") return;
    if (error) setError(null);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });
    if (v) {
      const nextInput = inputsRef.current[index + 1];
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) => {
    if (e.key === "Backspace") {
      if (!digits[idx]) {
        const prev = inputsRef.current[idx - 1];
        if (prev) {
          prev.focus();
          setDigits((d) => {
            const n = [...d];
            n[idx - 1] = "";
            return n;
          });
        }
      }
    } else if (e.key === "ArrowLeft") {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight") {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startIndex: number,
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("Text").replace(/\D/g, "");
    if (!pasted) return;
    if (error) setError(null);
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < pasted.length && startIndex + i < 6; i++) {
        next[startIndex + i] = pasted[i];
      }
      return next;
    });
    const endIndex = Math.min(6, startIndex + pasted.length);
    inputsRef.current[endIndex - 1]?.focus();
  };

  // ── Verify OTP ────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError(
        t("validationErrors:otp.invalid_length", {
          defaultValue: "Please enter 6-digit OTP",
        }),
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verify OTP → nhận sessionToken
      const res = await verifyOtpService({ verifyId, otp });

      // Chuyển sang PasswordForm với sessionToken
      onVerifySuccess(res.sessionToken);
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        const { globalMessage } = parseApiError(err.response.data);
        setError(globalMessage || t("businessErrors:SYS_001"));
      } else {
        setError(t("businessErrors:SYS_001"));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────
  const handleResend = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi registerInit lại với email → BE tạo OTP mới
      const res = await registerInitService({ email });

      setRemaining(res.expiresInSeconds);
      setDigits(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data) {
        const { globalMessage } = parseApiError(err.response.data);
        setError(globalMessage);
      } else {
        setError(t("businessErrors:SYS_001"));
      }
    } finally {
      setLoading(false);
    }
  };

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
            className={`w-11 h-11 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-lg border bg-white focus:outline-none transition ${
              error
                ? "border-red-400 focus:ring-2 focus:ring-red-400/30 text-red-600"
                : "border-slate-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 text-slate-700"
            }`}
          />
        ))}
      </div>

      <div className="min-h-[20px] mb-4">
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading || otp.length < 6}
        className={`px-10 py-3 rounded-xl text-sm font-semibold uppercase bg-yellow-400 text-black transition ${
          loading || otp.length < 6
            ? "opacity-60 cursor-not-allowed"
            : "hover:shadow-[0_0_25px_rgba(250,204,21,0.7)]"
        }`}
      >
        {loading
          ? t("common:auth.verifying", { defaultValue: "Verifying..." })
          : t("common:auth.btn_verify", { defaultValue: "Verify" })}
      </button>

      <p className="mt-4 text-sm text-slate-600">
        {t("common:auth.expires_in", { defaultValue: "Expires in" })}{" "}
        <b className="text-slate-800">{remaining}s</b>
      </p>

      <div className="mt-4 flex gap-6 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={remaining > 0 || loading}
          className="text-yellow-600 font-medium disabled:opacity-40 hover:underline"
        >
          {t("common:auth.btn_resend", { defaultValue: "Resend OTP" })}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="text-slate-500 hover:underline"
        >
          {t("common:auth.btn_back", { defaultValue: "Back" })}
        </button>
      </div>
    </form>
  );
}
