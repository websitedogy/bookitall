"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { api } from "@/shared/lib/api";
import { useAdminAuth, isPanelRole, type AuthUser } from "@/features/auth/store";

export function AdminLoginForm() {
  const router = useRouter();
  const user = useAdminAuth((s) => s.user);
  const setSession = useAdminAuth((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isPanelRole(user?.role)) {
      router.replace("/admin");
    }
  }, [user, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await api<{ accessToken: string; refreshToken: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!result.data) {
        throw new Error("Login failed");
      }
      if (!isPanelRole(result.data.user.role)) {
        throw new Error("Admin credentials required. Customer and vendor accounts cannot open this panel.");
      }
      setSession(result.data);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <aside className="relative hidden overflow-hidden bg-[var(--primary)] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative">
          <Link href="/" className="text-[22px] font-semibold tracking-tight">
            Book It All
          </Link>
          <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.18em] text-white/70">Control center</p>
        </div>
        <div className="relative max-w-md">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/20">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          </span>
          <h2 className="mt-6 text-[2.15rem] font-semibold leading-[1.15] tracking-tight">
            One desk for listings, vendors and bookings.
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-white/75">
            Review posts, handle bookings and keep website, Android and iOS in sync from a single admin session.
          </p>
        </div>
        <p className="relative text-[12px] text-white/55">Restricted access · Super admin and sub-editors</p>
      </aside>

      <main className="flex items-center justify-center bg-[#f4f7fb] px-5 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-[18px] font-semibold tracking-tight text-[var(--primary)]">
              Book It All
            </Link>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Control center
            </p>
          </div>

          <form onSubmit={onSubmit} className="rounded-2xl bg-white p-7 ring-1 ring-slate-200/80 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Admin</p>
            <h1 className="mt-2 text-[1.65rem] font-semibold tracking-tight text-slate-900">Sign in</h1>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">Use your admin or sub-editor email and password.</p>

            <label className="mt-7 block text-[13px] font-medium text-slate-700" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bookitall.com"
              autoComplete="username"
            />

            <label className="mt-4 block text-[13px] font-medium text-slate-700" htmlFor="admin-password">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white py-0 pr-11 pl-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 hover:text-slate-700"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2.5 text-[13px] leading-5 text-rose-700" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
            >
              <Lock className="h-4 w-4" strokeWidth={2} aria-hidden />
              {busy ? "Signing in…" : "Sign in to admin"}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-slate-500">
            Not an administrator?{" "}
            <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
              Go to website login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
