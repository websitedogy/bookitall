"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ConfirmationResult } from "firebase/auth";
import { api } from "@/shared/lib/api";
import {
  RECAPTCHA_HOST_ID,
  clearRecaptcha,
  confirmPhoneOtp,
  firebaseAuthMessage,
  sendPhoneOtp,
} from "@/shared/lib/firebase";
import { homeForRole, isPanelRole, useAuth, type AuthUser } from "@/features/auth/store";

function loginError(err: unknown) {
  const raw = err instanceof Error ? err.message : "Could not sign in";
  if (
    raw === "Failed to fetch" ||
    raw === "Request failed" ||
    raw === "NetworkError when attempting to fetch resource." ||
    raw.includes("ECONNREFUSED")
  ) {
    return "Cannot reach the server. Wait a few seconds for the API to start, then try again.";
  }
  return firebaseAuthMessage(err);
}

function safeNext(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

const fieldClass =
  "w-full border-0 border-b border-[var(--auth-line)] bg-transparent px-0 py-3 text-[15px] text-[var(--auth-ink)] outline-none placeholder:text-[var(--studio-muted)] focus:border-[var(--primary)]";

function isLocalAuthBypass() {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.NEXT_PUBLIC_LOCAL_AUTH_BYPASS === "true") return true;
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuth((s) => s.setSession);
  const [step, setStep] = useState<"details" | "otp">("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [onLocalhost] = useState(() => isLocalAuthBypass());
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    return () => clearRecaptcha();
  }, []);

  async function finishSignIn(name: string, digits: string, extras?: { otp?: string; idToken?: string }) {
    const result = await api<{ accessToken: string; refreshToken: string; user: AuthUser }>("/auth/phone", {
      method: "POST",
      body: JSON.stringify({ fullName: name, phone: digits, ...extras }),
    });
    if (!result.data) throw new Error("Could not sign in");
    if (isPanelRole(result.data.user.role)) {
      throw new Error("Admin staff must sign in at /admin/login");
    }
    setSession(result.data);
    router.replace(safeNext(searchParams.get("next")) ?? homeForRole(result.data.user.role));
  }

  async function requestOtp() {
    const name = fullName.trim();
    const digits = phone.replace(/\D/g, "");
    if (!name) {
      setError("Enter your name");
      return;
    }
    if (digits.length !== 10) {
      setError("Enter a 10-digit mobile number");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const localHost = isLocalAuthBypass();
      if (localHost) {
        confirmationRef.current = null;
        setPhone(digits);
        setOtp("");
        setStep("otp");
        setResendIn(0);
        return;
      }
      confirmationRef.current = await sendPhoneOtp(digits);
      setPhone(digits);
      setOtp("");
      setStep("otp");
      setResendIn(30);
    } catch (err) {
      clearRecaptcha();
      setError(loginError(err));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    const name = fullName.trim();
    const digits = phone.replace(/\D/g, "");
    const code = otp.replace(/\D/g, "");
    if (code.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const localHost = isLocalAuthBypass();
      if (localHost && code === "123456") {
        await finishSignIn(name, digits, { otp: code });
        return;
      }
      const confirmation = confirmationRef.current;
      if (!confirmation) {
        setError("Request a new OTP");
        setStep("details");
        return;
      }
      const idToken = await confirmPhoneOtp(confirmation, code);
      await finishSignIn(name, digits, { idToken });
    } catch (err) {
      setError(loginError(err));
    } finally {
      setBusy(false);
    }
  }

  function onEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (busy) return;
    if (step === "details") void requestOtp();
    else void verifyOtp();
  }

  return (
    <section className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--auth-ivory)] px-6 py-10 md:min-h-[calc(100dvh-4rem)]">
      <div className="w-full max-w-[26rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--auth-brass)]">
            Book It All
          </p>
          <h1 className="mt-3 font-serif text-[2.15rem] leading-none tracking-tight text-[var(--auth-ink)] md:text-5xl">
            {step === "details" ? "Sign in" : "Enter OTP"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--studio-muted)]">
            {step === "details"
              ? onLocalhost
                ? "Name and mobile. On this computer we do not send SMS — next screen use 123456."
                : "Name and mobile. We send a one-time code — no password."
              : onLocalhost
                ? "No SMS on this computer. Enter 123456."
                : `Code sent to +91 ${phone}.`}
          </p>

          <div className="mt-8 space-y-6">
            {step === "details" ? (
              <>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-muted)]">
                    Name
                  </span>
                  <input
                    className={`${fieldClass} mt-1`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={onEnter}
                    placeholder="Your name"
                    autoComplete="name"
                    autoCapitalize="words"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-muted)]">
                    Mobile
                  </span>
                  <div className="mt-1 flex items-end border-b border-[var(--auth-line)] focus-within:border-[var(--primary)]">
                    <span className="pb-3 pr-3 text-[15px] font-medium text-[var(--auth-brass)]">+91</span>
                    <input
                      className="w-full border-0 bg-transparent py-3 text-[15px] text-[var(--auth-ink)] outline-none placeholder:text-[var(--studio-muted)]"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      onKeyDown={onEnter}
                      placeholder="10-digit number"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                    />
                  </div>
                </label>
              </>
            ) : (
              <>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-muted)]">
                    One-time code
                  </span>
                  <input
                    className={`${fieldClass} mt-1 text-center text-2xl tracking-[0.55em]`}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={onEnter}
                    placeholder="••••••"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                  />
                </label>
                <div className="flex items-center gap-3 text-sm">
                  <button
                    type="button"
                    className="text-[var(--studio-muted)] underline-offset-4 hover:text-[var(--auth-ink)] hover:underline"
                    onClick={() => {
                      confirmationRef.current = null;
                      setOtp("");
                      setError("");
                      setStep("details");
                    }}
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    disabled={busy || resendIn > 0}
                    className="ml-auto font-medium text-[var(--primary)] disabled:opacity-50"
                    onClick={() => void requestOtp()}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                  </button>
                </div>
              </>
            )}

            <div id={RECAPTCHA_HOST_ID} />
            {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => void (step === "details" ? requestOtp() : verifyOtp())}
              className="relative z-20 w-full cursor-pointer bg-[var(--primary)] py-3.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-wait disabled:opacity-60"
            >
              {busy
                ? step === "details"
                  ? "Sending…"
                  : "Please wait…"
                : step === "details"
                  ? "Send OTP"
                  : "Verify & continue"}
            </button>

            <p className="text-center text-sm text-[var(--studio-muted)]">
              <Link href="/" className="underline-offset-4 hover:text-[var(--auth-ink)] hover:underline">
                Back to Book It All
              </Link>
            </p>
          </div>
      </div>
    </section>
  );
}
