"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/shared/lib/api";
import { homeForRole, useAuth, type AuthUser } from "@/features/auth/store";

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await api<{ accessToken: string; refreshToken: string; user: AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, phone, password, role: "CUSTOMER" }),
      });
      if (!result.data) {
        throw new Error("Could not register");
      }
      setSession(result.data);
      router.push(homeForRole(result.data.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-[2rem] bg-[var(--paper)] p-8">
      <h1 className="serif text-4xl">Create an account</h1>
      <input className="w-full rounded-2xl border border-[var(--line)] px-4 py-3" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input className="w-full rounded-2xl border border-[var(--line)] px-4 py-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full rounded-2xl border border-[var(--line)] px-4 py-3" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input type="password" className="w-full rounded-2xl border border-[var(--line)] px-4 py-3" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button className="w-full rounded-full bg-[var(--teal-dark)] py-3 text-[var(--paper)]">Register</button>
    </form>
  );
}
