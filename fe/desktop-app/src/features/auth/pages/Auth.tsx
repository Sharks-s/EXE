import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import AuthLayout from "./AuthLayout";
import VerifyForm from "./VerifyForm";
import PasswordForm from "./PasswordForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import ResetPasswordForm from "./ResetPasswordForm";
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
  const [registerResult, setRegisterResult] = useState<RegisterResponse | null>(
    null,
  );
  const [resetResult, setResetResult] = useState<ForgotPasswordResponse | null>(
    null,
  );
  const [resetEmail, setResetEmail] = useState("");
  const [sessionToken, setSessionToken] = useState<string>("");

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

      {/* Slot 2 — VerifyForm hoặc PasswordForm */}
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
          onBack={() => setMode("auth")}
        />
      )}
      {mode === "password" && (
        <PasswordForm
          sessionToken={sessionToken}
          onBack={() => setMode("verify")}
        />
      )}
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
      {mode === "reset-password" && (
        <ResetPasswordForm
          sessionToken={sessionToken}
          onSuccess={() => {
            setSessionToken("");
            setResetResult(null);
            setResetEmail("");
            setMode("auth");
          }}
          onBack={() => setMode("reset-otp")}
        />
      )}
    </AuthLayout>
  );
}
