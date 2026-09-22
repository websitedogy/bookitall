"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { inr } from "@/shared/lib/format";

type Wallet = { availableBalance: string; pendingBalance: string };
type Tx = { id: string; type: string; reason: string; amount: string; createdAt: string };

export default function PartnerWalletPage() {
  const token = useAuth((s) => s.accessToken);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [amount, setAmount] = useState("1000");

  function load() {
    if (!token) return;
    api<Wallet>("/wallet", { token }).then((r) => setWallet(r.data ?? null));
    api<Tx[]>("/wallet/transactions", { token }).then((r) => setTxs(r.data ?? []));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function payout(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    await api("/payouts", { method: "POST", token, body: JSON.stringify({ amount: Number(amount) }) });
    load();
  }

  return (
    <div>
      <h1 className="serif mt-2 text-4xl">Wallet & payouts</h1>
      <p className="mt-4 text-3xl">{inr(wallet?.availableBalance ?? 0)} available</p>
      <form onSubmit={payout} className="mt-6 flex gap-3">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-full border border-[var(--line)] px-4 py-2" />
        <button className="rounded-full bg-[var(--teal-dark)] px-5 py-2 text-[var(--paper)]">Request payout</button>
      </form>
      <div className="mt-8 space-y-2">
        {txs.map((tx) => (
          <div key={tx.id} className="flex justify-between rounded-2xl bg-[var(--paper)] px-4 py-3 text-sm">
            <span>{tx.reason}</span>
            <span>{tx.type === "CREDIT" ? "+" : "-"}{inr(tx.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
