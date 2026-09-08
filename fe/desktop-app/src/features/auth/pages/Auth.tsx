import { useState } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import AuthLayout from "./AuthLayout";
import VerifyForm from "../components/VerifyForm";
import PasswordForm from "../components/PasswordForm";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import ResetPasswordForm from "../components/ResetPasswordForm";
import {
  forgotPasswordService,
  registerInitService,
  verifyOtpService,
  verifyResetPasswordOtpService,
} from "../services/auth.service";
import type {
  ForgotPasswordResponse,
  RegisterResponse,
} from "../types/auth.types";

type Mode =
  | "auth"
  | "verify"
  | "password"
  | "forgot"
  | "reset-otp"
  | "reset-password";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("auth");
  const [registerResult, setRegisterResult] = useState<RegisterResponse | null>(null);
  const [resetResult, setResetResult] = useState<ForgotPasswordResponse | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [sessionToken, setSessionToken] = useState<string>("");

  // Helper reset sạch toàn bộ state auth dở dang
  const resetAllState = () => {
    setRegisterResult(null);
    setResetResult(null);
    setResetEmail("");
    setSessionToken("");
    setMode("auth");
  };

  return (
    <AuthLayout mode={mode}>
      {/* Slot 0 — LoginForm */}
      <LoginForm onForgotPassword={() => setMode("forgot")} />

      {/* Slot 1 — RegisterForm */}
      <RegisterForm
        onRegisterSuccess={(res) => {
          setRegisterResult(res);
          setMode("verify");
        }}
      />

      {/* Slot 2 — VerifyForm (Đăng ký) */}
      {mode === "verify" && registerResult && (
        <VerifyForm
          email={registerResult.email}
          expiresInSeconds={registerResult.expiresInSeconds}
          verifyId={registerResult.verifyId}
          onVerify={verifyOtpService}
          onResend={async () => {
            const res = await registerInitService({
              email: registerResult.email,
            });
            setRegisterResult(res);
            return res;
          }}
          onVerifySuccess={(token) => {
            setSessionToken(token);
            setMode("password");
          }}
          onBack={resetAllState}
        />
      )}

      {/* Slot 3 — PasswordForm (Đặt mật khẩu sau khi verify Đăng ký) */}
      {mode === "password" && (
        <PasswordForm
          sessionToken={sessionToken}
          onSuccess={() => {
            resetAllState(); // Clear sạch state & đưa về màn login
          }}
          onBack={resetAllState} // Khuyên dùng resetAllState thay vì quay lại verify
        />
      )}

      {/* Slot 4 — ForgotPasswordForm */}
      {mode === "forgot" && (
        <ForgotPasswordForm
          onSuccess={(res, email) => {
            setResetResult(res);
            setResetEmail(email);
            setMode("reset-otp");
          }}
          onBack={() => setMode("auth")}
        />
      )}

      {/* Slot 5 — VerifyForm (Quên mật khẩu) */}
      {mode === "reset-otp" && resetResult && (
        <VerifyForm
          email={resetResult.email}
          expiresInSeconds={resetResult.expiresInSeconds}
          verifyId={resetResult.verifyId}
          onVerify={verifyResetPasswordOtpService}
          onResend={async () => {
            const res = await forgotPasswordService({
              email: resetEmail,
            });
            setResetResult(res);
            return res;
          }}
          onVerifySuccess={(token) => {
            setSessionToken(token);
            setMode("reset-password");
          }}
          onBack={() => setMode("forgot")}
        />
      )}

      {/* Slot 6 — ResetPasswordForm */}
      {mode === "reset-password" && (
        <ResetPasswordForm
          sessionToken={sessionToken}
          onSuccess={resetAllState}
          onBack={() => setMode("reset-otp")}
        />
      )}
    </AuthLayout>
  );
}