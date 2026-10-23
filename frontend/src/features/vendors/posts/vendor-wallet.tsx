"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Coins, History, Wallet } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { api } from "@/shared/lib/api";
import { inr } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

const CREDIT_PRESETS = [500, 1000, 2000, 5000];

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

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name?: string; email?: string; contact?: string };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal: { ondismiss: () => void };
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve() : reject(new Error("Razorpay checkout did not load.")));
    script.onerror = () => reject(new Error("Could not load Razorpay checkout. Check your connection and try again."));
    document.head.appendChild(script);
  });
}

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
  const user = useAuth((s) => s.user);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletError, setWalletError] = useState("");
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseNotice, setPurchaseNotice] = useState("");

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

  async function purchaseCredits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || purchaseBusy) return;
    const credits = Number(creditsToAdd);
    if (!Number.isInteger(credits) || credits < 100 || credits > 20000) {
      setPurchaseError("Choose between 100 and 20,000 credits.");
      setPurchaseNotice("");
      return;
    }

    setPurchaseBusy(true);
    setPurchaseError("");
    setPurchaseNotice("");
    try {
      const orderResult = await api<{
        keyId: string;
        orderId: string;
        amount: number;
        currency: string;
        credits: number;
      }>("/wallet/credits/purchase-order", {
        method: "POST",
        token,
        body: JSON.stringify({ credits }),
      });
      if (!orderResult.data?.keyId || !orderResult.data.orderId) {
        throw new Error("Could not start the credit purchase. Please try again.");
      }
      await loadRazorpayCheckout();
      if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable.");

      const checkout = new window.Razorpay({
        key: orderResult.data.keyId,
        order_id: orderResult.data.orderId,
        amount: orderResult.data.amount,
        currency: orderResult.data.currency,
        name: "Book It All",
        description: `${orderResult.data.credits.toLocaleString("en-IN")} credits`,
        prefill: {
          name: user?.fullName,
          email: user?.email ?? undefined,
          contact: user?.phone,
        },
        handler: (response) => {
          void (async () => {
            try {
              const verification = await api<{ creditPoints: number; creditsAdded: number }>(
                "/wallet/credits/verify-purchase",
                {
                  method: "POST",
                  token,
                  body: JSON.stringify(response),
                },
              );
              const result = verification.data;
              if (!result) throw new Error("Payment verification returned no credit balance.");
              setWallet((current) => current ? { ...current, creditPoints: result.creditPoints } : current);
              setCreditsToAdd("");
              setPurchaseNotice(
                result.creditsAdded > 0
                  ? `${result.creditsAdded.toLocaleString("en-IN")} credits added.`
                  : "Payment verified. These credits were already added to your balance.",
              );
            } catch (cause) {
              setPurchaseError(
                cause instanceof Error
                  ? cause.message
                  : "Payment completed, but credits could not be verified. Contact support before paying again.",
              );
            } finally {
              setPurchaseBusy(false);
              void refreshWallet();
            }
          })();
        },
        modal: {
          ondismiss: () => setPurchaseBusy(false),
        },
      });
      checkout.on("payment.failed", (response) => {
        setPurchaseError(response.error?.description ?? "Payment failed. No credits were added.");
        setPurchaseBusy(false);
      });
      checkout.open();
    } catch (cause) {
      setPurchaseError(cause instanceof Error ? cause.message : "Could not start the credit purchase.");
      setPurchaseBusy(false);
    }
  }

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
          Credits are deducted when an order is completed. Admin-assigned and purchased credits share this balance.
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

      <form onSubmit={(event) => void purchaseCredits(event)} className="mt-4 space-y-4 rounded-[1.5rem] bg-white p-5 ring-1 ring-[var(--border)]">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Add credits</span>
          <input
            required
            type="number"
            min={100}
            max={20000}
            step={1}
            value={creditsToAdd}
            onChange={(event) => {
              setCreditsToAdd(event.target.value);
              setPurchaseError("");
              setPurchaseNotice("");
            }}
            placeholder="Enter 100 – 20,000 credits"
            className="mt-1.5 h-11 w-full rounded-2xl bg-white px-3 text-sm outline-none ring-1 ring-[var(--border)] focus:ring-[var(--primary)]"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {CREDIT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={purchaseBusy}
              onClick={() => {
                setCreditsToAdd(String(preset));
                setPurchaseError("");
                setPurchaseNotice("");
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 disabled:opacity-60",
                creditsToAdd === String(preset)
                  ? "bg-[var(--primary)] text-white ring-[var(--primary)]"
                  : "bg-white text-[var(--text)] ring-[var(--border)]",
              )}
            >
              {preset.toLocaleString("en-IN")} credits
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)]">1 credit = ₹1. Payment is securely processed by Razorpay.</p>
        {purchaseError ? <p role="alert" className="text-sm text-rose-600">{purchaseError}</p> : null}
        {purchaseNotice ? <p role="status" className="text-sm text-emerald-700">{purchaseNotice}</p> : null}
        <button
          type="submit"
          disabled={purchaseBusy || !creditsToAdd}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
        >
          {purchaseBusy ? "Processing…" : "Add credits"}
        </button>
      </form>
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
          Wallet balance (₹)
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
