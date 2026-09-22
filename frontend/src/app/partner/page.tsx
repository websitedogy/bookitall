"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { inr } from "@/shared/lib/format";

export default function PartnerHomePage() {
  const token = useAuth((s) => s.accessToken);
  const [wallet, setWallet] = useState<{ availableBalance: string; pendingBalance: string } | null>(null);
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    api<{ availableBalance: string; pendingBalance: string }>("/wallet", { token }).then((res) => setWallet(res.data ?? null));
    api<unknown[]>("/bookings", { token }).then((res) => setBookingCount(res.meta?.total ?? res.data?.length ?? 0));
  }, [token]);

  return (
    <div>
      <h1 className="serif mt-2 text-5xl">Your desk</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Stat label="Available" value={inr(wallet?.availableBalance ?? 0)} />
        <Stat label="Pending" value={inr(wallet?.pendingBalance ?? 0)} />
        <Stat label="Bookings" value={String(bookingCount)} />
      </div>
      <p className="mt-8 max-w-xl text-[var(--ink-soft)]">
        List hotels, tours, cabs or home services. Commission is taken when a job completes; the rest lands in this wallet.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.6rem] bg-[var(--paper)] p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--teal)]">{label}</p>
      <p className="serif mt-2 text-4xl">{value}</p>
    </div>
  );
}
