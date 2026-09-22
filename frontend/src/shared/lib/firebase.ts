"use client";

import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  type ConfirmationResult,
  type RecaptchaVerifier,
  getAuth,
  RecaptchaVerifier as FirebaseRecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLZfKWqJAJbpPmVMJX_u-elFpdjmaAgJM",
  authDomain: "book-it-all.firebaseapp.com",
  projectId: "book-it-all",
  storageBucket: "book-it-all.firebasestorage.app",
  messagingSenderId: "446411933338",
  appId: "1:446411933338:web:00fe820d8d441acddb0123",
  measurementId: "G-XPCZBCJPST",
};

export function isFirebaseConfigured() {
  return true;
}

function firebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function firebaseAuth(): Auth {
  return getAuth(firebaseApp());
}

export function e164India(phone: string) {
  return `+91${phone.replace(/\D/g, "").slice(-10)}`;
}

export function firebaseAuthMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
  switch (code) {
    case "auth/invalid-phone-number":
      return "Enter a valid 10-digit mobile number";
    case "auth/too-many-requests":
      return "Too many OTP attempts. Wait a few minutes and try again.";
    case "auth/invalid-verification-code":
      return "That OTP is incorrect. Check the SMS and try again.";
    case "auth/code-expired":
    case "auth/session-expired":
      return "OTP expired. Request a new code.";
    case "auth/missing-verification-code":
      return "Enter the 6-digit OTP";
    case "auth/quota-exceeded":
      return "SMS quota exceeded for today. Try again tomorrow.";
    case "auth/billing-not-enabled":
      return "Real SMS needs Firebase Blaze billing. Or add a test number: Authentication → Sign-in method → Phone → Phone numbers for testing."
    case "auth/operation-not-allowed":
      return "Phone is still blocked on the Firebase project. Authentication → Settings → SMS region policy lo India (IN) allow chey, then Phone provider ni Save malli click chey.";
    case "auth/captcha-check-failed":
    case "auth/invalid-app-credential":
    case "auth/argument-error":
      return typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "Firebase localhost lo OTP block chestundi. http://127.0.0.1:3000/login open chesi Send OTP kodu. Authorized domains lo 127.0.0.1 undali."
        : "reCAPTCHA failed. Hard refresh chesi malli try chey. Firebase → Authentication → Settings → Authorized domains lo 127.0.0.1 add chey.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    case "auth/api-key-not-valid":
      return "Firebase blocked this browser key. In Google Cloud → Credentials, open the Browser API key and set Application restrictions to None.";
    default:
      return error instanceof Error ? error.message : "Could not verify OTP";
  }
}

let recaptcha: RecaptchaVerifier | null = null;
export const RECAPTCHA_HOST_ID = "firebase-recaptcha";

function createFreshVerifier() {
  clearRecaptcha();
  const host = document.getElementById(RECAPTCHA_HOST_ID);
  if (!host) throw new Error("reCAPTCHA box missing. Refresh the page.");
  const box = document.createElement("div");
  host.replaceChildren(box);
  recaptcha = new FirebaseRecaptchaVerifier(firebaseAuth(), box, { size: "invisible" });
  return recaptcha;
}

export function clearRecaptcha() {
  try {
    recaptcha?.clear();
  } catch {
    // Verifier already torn down.
  }
  recaptcha = null;
  document.getElementById(RECAPTCHA_HOST_ID)?.replaceChildren();
}

export async function sendPhoneOtp(phone: string) {
  const verifier = createFreshVerifier();
  try {
    return await signInWithPhoneNumber(firebaseAuth(), e164India(phone), verifier);
  } catch (error) {
    clearRecaptcha();
    throw error;
  }
}

export async function confirmPhoneOtp(confirmation: ConfirmationResult, otp: string) {
  const credential = await confirmation.confirm(otp);
  const idToken = await credential.user.getIdToken();
  await signOut(firebaseAuth());
  return idToken;
}
