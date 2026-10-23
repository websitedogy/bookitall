"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins, History, Wallet } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { api } from "@/shared/lib/api";
import { inr } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

type WalletInfo = {
  availableBalance: string;
  pendingBalance: string;
  creditPoints: number;
  creditsPerOrder: number;
  creditRates?: Partial<Record<string, number>>;
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
  const [loading, setLoading] = useState(true);
  const [walletError, setWalletError] = useState("");

  const refreshWallet = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api<WalletInfo>("/wallet", { token });
      if (!res.data || !Number.isFinite(res.data.creditPoints)) {
        throw new Error("Wallet response did not include a valid credit balance");
      }
      setWallet(res.data);
      setWalletError("");
    } catch {
      setWalletError("Could not load your credits. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const initialRefresh = window.setTimeout(() => void refreshWallet(), 0);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshWallet();
    };
    const interval = window.setInterval(refreshWhenVisible, 15_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [token, refreshWallet]);

  return (
    <div className="px-1 pb-6">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
        <Coins className="h-3.5 w-3.5" aria-hidden />
        Credits
      </p>

      <section className="mt-4 rounded-[1.5rem] bg-white p-5 ring-1 ring-[var(--border)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Available credits</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {loading ? "…" : wallet ? wallet.creditPoints.toLocaleString("en-IN") : "—"}
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Admin-assigned credits are deducted when an order is completed. The rate depends on the service type.
        </p>
        {walletError ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm text-rose-600">{walletError}</p>
            <button
              type="button"
              onClick={() => void refreshWallet()}
              className="shrink-0 text-sm font-semibold text-[var(--primary)]"
            >
              Retry
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function VendorWalletHistory() {
  const token = useAuth((s) => s.accessToken);
  const [rows, setRows] = useState<WalletTx[]>([]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let live = true;
    Promise.all([
      api<WalletTx[]>("/wallet/transactions?limit=50", { token }),
      api<WalletInfo>("/wallet", { token }),
    ])
      .then(([transactions, walletResult]) => {
        if (!live) return;
        setRows(transactions.data ?? []);
        setWallet(walletResult.data ?? null);
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
      <section className="mt-4 rounded-[1.5rem] bg-white p-5 ring-1 ring-[var(--border)]">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          <Wallet className="h-3.5 w-3.5" aria-hidden />
          Wallet balance
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{wallet ? inr(wallet.availableBalance) : "—"}</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {Number(wallet?.pendingBalance ?? 0) > 0
            ? `${inr(wallet?.pendingBalance ?? 0)} pending from bookings`
            : "Wallet earnings and adjustments appear in the history below."}
        </p>
      </section>
      <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-[var(--border)]">
        {loading ? (
          <p className="px-5 py-8 text-sm text-[var(--text-muted)]">Loading history…</p>
        ) : error ? (
          <p className="px-5 py-8 text-sm text-rose-600">{error}</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--text-muted)]">No wallet transactions yet.</p>
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
