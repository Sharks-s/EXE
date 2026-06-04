import { useState } from "react";
import "./AuthLayout.css";
import AuthBackground from "./AuthBackground";
import React from "react";
import { useTranslation } from "react-i18next";

export default function AuthLayout({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "auth" | "verify" | "password";
}) {
  const childrenArray = React.Children.toArray(children);
  const [active, setActive] = useState(false);
  const { t } = useTranslation("common");

  return (
    <div className="auth-container relative min-h-screen">
      <AuthBackground />

      <div className="auth-wrapper">
        {mode === "auth" && (
          <div className={`auth-card ${active ? "active" : ""}`}>
            <div className="auth-form auth-form-signin">
              <div className="left-child">{childrenArray[0]}</div>
            </div>

            <div className="auth-form auth-form-signup">
              <div className="right-child">{childrenArray[1]}</div>
            </div>

            <div className="auth-toggle">
              <div className="auth-toggle-slider">
                {/* LEFT — hiện khi đang ở tab Register, mời Sign In */}
                <div className="auth-toggle-panel auth-toggle-left text-center">
                  <h1 className="text-3xl font-bold tracking-wide text-black">
                    {t("auth.toggle_signin_title", {
                      defaultValue: "Welcome Back",
                    })}
                  </h1>
                  <p className="mt-3 text-sm text-black max-w-xs mx-auto">
                    {t("auth.toggle_signin_subtitle", {
                      defaultValue:
                        "Enter your personal details to continue your journey",
                    })}
                  </p>
                  <button
                    className="mt-6 px-10 py-3 rounded-full border border-white/60 text-sm font-semibold uppercase tracking-wider text-black backdrop-blur hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition"
                    onClick={() => setActive(false)}
                  >
                    {t("auth.btn_login", { defaultValue: "Sign In" })}
                  </button>
                </div>

                {/* RIGHT — hiện khi đang ở tab Login, mời Sign Up */}
                <div className="auth-toggle-panel auth-toggle-right text-center">
                  <h1 className="text-3xl font-bold tracking-wide text-black">
                    {t("auth.toggle_signup_title", {
                      defaultValue: "Hello, Friend",
                    })}
                  </h1>
                  <p className="mt-3 text-sm text-black max-w-xs mx-auto">
                    {t("auth.toggle_signup_subtitle", {
                      defaultValue:
                        "Register with your personal details and start your journey",
                    })}
                  </p>
                  <button
                    className="mt-6 px-10 py-3 rounded-full border border-white/60 text-sm font-semibold uppercase tracking-wider text-black backdrop-blur hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition"
                    onClick={() => setActive(true)}
                  >
                    {t("auth.btn_register", { defaultValue: "Sign Up" })}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(mode === "verify" || mode === "password") && (
          <div className="verify-wrapper">
            <div className="verify-card auth-card flex items-center justify-center">
              {childrenArray[2]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
