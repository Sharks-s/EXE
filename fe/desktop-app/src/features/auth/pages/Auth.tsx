import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import AuthLayout from "./AuthLayout";
import VerifyForm from "./VerifyForm";
import PasswordForm from "./PasswordForm";
import type { RegisterResponse } from "../types/auth.types";

type Mode = "auth" | "verify" | "password";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("auth");
  const [registerResult, setRegisterResult] = useState<RegisterResponse | null>(
    null,
  );
  const [sessionToken, setSessionToken] = useState<string>("");

  return (
    <AuthLayout mode={mode}>
      {/* Slot 0 — LoginForm */}
      <LoginForm />

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
    </AuthLayout>
  );
}
