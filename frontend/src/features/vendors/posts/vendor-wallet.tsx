"use client";

import { FormEvent, useEffect, useState } from "react";
import { History, Wallet } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { api, ApiError } from "@/shared/lib/api";
import { inr } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

const PRESETS = [500, 1000, 2000, 5000];

type WalletInfo = {
  availableBalance: string;
  pendingBalance: string;
};

type WalletTx = {
  id: string;
  type: "CREDIT" | "DEBIT";
  reason: string;
  amount: string;
  balanceAfter: string;
  note: string | null;
  createdAt: string;
};

const REASON_LABELS: Record<string, string> = {
  TOPUP: "Wallet top-up",
  BOOKING_EARNING: "Booking earning",
  COMMISSION: "Commission",
  PAYOUT: "Payout",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

function reasonLabel(reason: string) {
  return REASON_LABELS[reason] ?? reason.replaceAll("_", " ").toLowerCase();
}

export function VendorWallet() {
  const token = useAuth((s) => s.accessToken);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!token) return;
    let live = true;
    api<WalletInfo>("/wallet", { token })
      .then((res) => {
        if (live && res.data) setWallet(res.data);
      })
      .catch(() => {
        if (live) setError("Could not load wallet");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token]);

  async function addMoney(value: number) {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const res = await api<WalletInfo>("/wallet/topup", {
        method: "POST",
        token,
        body: JSON.stringify({ amount: value }),
      });
      if (res.data) setWallet(res.data);
      setAmount("");
      setSaved(`Added ${inr(value)} to your wallet.`);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not add money");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 100 || value > 20000) {
      setError("Add between ₹100 and ₹20,000");
      setSaved("");
      return;
    }
    void addMoney(value);
  }

  const available = Number(wallet?.availableBalance ?? 0);
  const pending = Number(wallet?.pendingBalance ?? 0);

  return (
    <div className="px-1 pb-6">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
        <Wallet className="h-3.5 w-3.5" aria-hidden />
        Wallet
      </p>

      <section className="mt-4 rounded-[1.5rem] bg-white p-5 ring-1 ring-[var(--border)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Current wallet amount</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{loading ? "…" : inr(available)}</p>
        {pending > 0 ? (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{inr(pending)} pending from bookings</p>
        ) : (
          <p className="mt-1 text-sm text-[var(--text-muted)]">Available to spend on bookings</p>
        )}
      </section>

      <form onSubmit={onSubmit} className="mt-4 space-y-4 rounded-[1.5rem] bg-white p-5 ring-1 ring-[var(--border)]">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Add to wallet amount</span>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value.replace(/\D/g, "").slice(0, 5));
              setError("");
              setSaved("");
            }}
            placeholder="Enter ₹100 – ₹20,000"
            className="mt-1.5 h-11 w-full rounded-2xl bg-white px-3 text-sm outline-none ring-1 ring-[var(--border)] focus:ring-[var(--primary)]"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={busy}
              onClick={() => {
                setAmount(String(preset));
                setError("");
                setSaved("");
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 disabled:opacity-60",
                amount === String(preset)
                  ? "bg-[var(--primary)] text-white ring-[var(--primary)]"
                  : "bg-white text-[var(--text)] ring-[var(--border)]",
              )}
            >
              {inr(preset)}
            </button>
          ))}
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {saved ? <p className="text-sm text-emerald-700">{saved}</p> : null}
        <button
          type="submit"
          disabled={busy || !amount}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add to wallet"}
        </button>
      </form>
    </div>
  );
}

export function VendorWalletHistory() {
  const token = useAuth((s) => s.accessToken);
  const [rows, setRows] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let live = true;
    api<WalletTx[]>("/wallet/transactions?limit=50", { token })
      .then((res) => {
        if (live) setRows(res.data ?? []);
      })
      .catch(() => {
        if (live) setError("Could not load wallet history");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token]);

  return (
    <div className="px-1 pb-6">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
        <History className="h-3.5 w-3.5" aria-hidden />
        Wallet history
      </p>
      <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-[var(--border)]">
        {loading ? (
          <p className="px-5 py-8 text-sm text-[var(--text-muted)]">Loading history…</p>
        ) : error ? (
          <p className="px-5 py-8 text-sm text-rose-600">{error}</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--text-muted)]">No wallet history yet. Add money from the Wallet tab.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {rows.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{reasonLabel(row.reason)}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {row.note ? `${row.note} · ` : ""}
                    {new Date(row.createdAt).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">Balance {inr(row.balanceAfter)}</p>
                </div>
                <p className={cn("shrink-0 text-sm font-semibold", row.type === "CREDIT" ? "text-emerald-700" : "text-rose-600")}>
                  {row.type === "CREDIT" ? "+" : "−"}
                  {inr(row.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
