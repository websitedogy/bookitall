"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import { useAuth, useAuthHydrated } from "@/features/auth/store";
import { api, ApiError } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { inr } from "@/shared/lib/format";
import { readSavedLocation } from "@/shared/lib/geo";
import { trackBeginCheckout } from "@/shared/lib/analytics";
import { useCart } from "./store";
import { cartTotals } from "./pricing";
import { saveLastOrder, toCheckoutItems, type CheckoutResult } from "./checkout-payload";
import {
  emptyPayment,
  PaymentFields,
  paymentPayload,
  validatePaymentDraft,
  type PayMethod,
} from "./payment-fields";

const METHODS = [
  { id: "UPI" as const, label: "UPI", hint: "GPay, PhonePe, Paytm", icon: Smartphone },
  { id: "CARD" as const, label: "Card", hint: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "NET_BANKING" as const, label: "Net banking", hint: "All major banks", icon: Landmark },
  { id: "WALLET" as const, label: "Wallet", hint: "Book It All wallet", icon: Wallet },
  { id: "CASH" as const, label: "Pay after service", hint: "Cash / UPI to vendor after work", icon: Wallet },
];

type Quote = { subtotal: number; tax: number; total: number; currency: string };
type WalletInfo = { availableBalance: string; currency: string };

export function CheckoutPage() {
  const router = useRouter();
  const ready = useAuthHydrated();
  const token = useAuth((s) => s.accessToken);
  const user = useAuth((s) => s.user);
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const localTotals = cartTotals(items);

  const [address, setAddress] = useState("");
  const [editAddress, setEditAddress] = useState(false);
  const [draft, setDraft] = useState(emptyPayment());
  const [quote, setQuote] = useState<Quote | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [topupBusy, setTopupBusy] = useState(false);

  const totals = quote ?? localTotals;
  const walletBalance = Number(wallet?.availableBalance ?? 0);
  const needsAddress = items.some((item) => !["hotels", "tours"].includes(item.categoryId));
  const stayLocation = items.find(
    (item) => ["hotels", "tours"].includes(item.categoryId) && (item.address || item.customerLat != null),
  );

  const quoteItems = useMemo(() => toCheckoutItems(items), [items]);

  useEffect(() => {
    if (!ready) return;
    if (!token) router.replace("/login?next=/checkout");
  }, [ready, token, router]);

  useEffect(() => {
    const fromCart = items.map((item) => item.address || item.pickupAddress).find((value) => value?.trim());
    if (fromCart) {
      setAddress(fromCart);
      return;
    }
    const saved = readSavedLocation();
    if (!saved) return;
    const pin = [saved.houseNumber, saved.buildingName]
      .map((part) => part?.trim())
      .filter((part, index, all) => part && all.findIndex((row) => row?.toLowerCase() === part.toLowerCase()) === index)
      .join(", ");
    const full = saved.full || [saved.line1, saved.line2].filter(Boolean).join(", ");
    const next = pin && full && !full.toLowerCase().includes(pin.toLowerCase()) ? `${pin}, ${full}` : full || pin;
    if (next) setAddress(next);
  }, [items]);

  useEffect(() => {
    if (!token || !items.length) return;
    let live = true;
    api<Quote>("/bookings/quote", { method: "POST", token, body: JSON.stringify({ items: quoteItems }) })
      .then((res) => {
        if (live && res.data) setQuote(res.data);
      })
      .catch(() => {
        if (live) setQuote(null);
      });
    return () => {
      live = false;
    };
  }, [token, items.length, quoteItems]);

  useEffect(() => {
    if (!items.length) return;
    trackBeginCheckout({ value: totals.total, item_count: items.length });
  }, [items.length, totals.total]);

  useEffect(() => {
    if (!token) return;
    api<WalletInfo>("/wallet", { token })
      .then((res) => {
        if (res.data) setWallet(res.data);
      })
      .catch(() => setWallet(null));
  }, [token]);

  function setMethod(method: PayMethod) {
    setDraft((prev) => ({ ...prev, method }));
    setError("");
  }

  async function addMoney(amount: number) {
    if (!token) return;
    setTopupBusy(true);
    setError("");
    try {
      const res = await api<WalletInfo>("/wallet/topup", {
        method: "POST",
        token,
        body: JSON.stringify({ amount }),
      });
      if (res.data) setWallet(res.data);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not add money");
    } finally {
      setTopupBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!token) {
      router.push("/login?next=/checkout");
      return;
    }
    if (!items.length) {
      router.push("/");
      return;
    }
    const needsAddressNow = items.some((item) => !["hotels", "tours"].includes(item.categoryId));
    if (needsAddressNow && !address.trim() && items.every((item) => !item.address)) {
      setError("Add a service address so the vendor can reach you.");
      return;
    }
    const invalid = validatePaymentDraft(draft, walletBalance, totals.total);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api<CheckoutResult>("/bookings/checkout", {
        method: "POST",
        token,
        body: JSON.stringify({
          items: toCheckoutItems(items, address.trim()),
          ...paymentPayload(draft),
          address: address.trim(),
          customerName: user?.fullName,
          customerPhone: user?.phone,
          pay: true,
        }),
      });
      if (!result.data) throw new Error("Checkout failed");
      saveLastOrder(result.data);
      clear();
      router.push("/checkout/success");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not complete payment");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !token) {
    return <p className="px-1 py-10 text-sm text-[var(--text-muted)]">Taking you to sign in…</p>;
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <h1 className="text-2xl font-semibold">Nothing to book</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Open a service and tap Book now.</p>
        <Link href="/" className="mt-4 inline-flex text-sm font-medium text-[var(--primary)]">
          Browse services
        </Link>
      </div>
    );
  }

  const payLabel =
    draft.method === "CASH" ? "Place booking" : busy ? "Paying…" : `Pay ${inr(totals.total)}`;

  return (
    <form onSubmit={onSubmit} className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.35fr_0.85fr]">
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Reserve</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--studio-ink)] md:text-3xl">Checkout</h1>
          <p className="mt-1 text-sm text-[var(--studio-muted)]">Confirm details, choose payment, and place the booking.</p>
        </div>

        <section className="rounded-[28px] bg-white p-5 shadow-[var(--studio-shadow)] ring-1 ring-[var(--studio-line)]">
          <h2 className="font-semibold">Contact</h2>
          <p className="mt-2 text-sm">{user?.fullName}</p>
          <p className="text-sm text-[var(--text-muted)]">{user?.phone}</p>
        </section>

        {stayLocation ? (
          <section className="rounded-[28px] bg-white p-5 shadow-[var(--studio-shadow)] ring-1 ring-[var(--studio-line)]">
            <h2 className="font-semibold">Your location</h2>
            {stayLocation.address ? <p className="mt-3 text-sm leading-relaxed">{stayLocation.address}</p> : null}
            {stayLocation.customerLat != null && stayLocation.customerLng != null ? (
              <p className="mt-1 text-xs tabular-nums text-[var(--text-muted)]">
                {stayLocation.customerLat.toFixed(6)}, {stayLocation.customerLng.toFixed(6)}
              </p>
            ) : null}
            {stayLocation.checkIn && stayLocation.checkOut ? (
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {stayLocation.checkIn} → {stayLocation.checkOut}
              </p>
            ) : null}
          </section>
        ) : null}

        {needsAddress ? (
          <section className="rounded-[28px] bg-white p-5 shadow-[var(--studio-shadow)] ring-1 ring-[var(--studio-line)]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">Service address</h2>
              {address.trim() && !editAddress ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--primary)]"
                  onClick={() => setEditAddress(true)}
                >
                  Change
                </button>
              ) : null}
            </div>
            {address.trim() && !editAddress ? (
              <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">{address}</p>
            ) : (
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="House no, building name, street, landmark, city"
                className="mt-3 w-full rounded-2xl border border-[var(--border)] px-3 py-3 text-sm"
              />
            )}
          </section>
        ) : null}

        <section className="rounded-[28px] bg-white p-5 shadow-[var(--studio-shadow)] ring-1 ring-[var(--studio-line)]">
          <h2 className="font-semibold">Payment</h2>
          <ul className="mt-3 space-y-2">
            {METHODS.map((option) => {
              const Icon = option.icon;
              const active = draft.method === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => setMethod(option.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ring-1",
                      active ? "bg-[var(--primary-soft)] ring-[var(--primary)]" : "bg-white ring-[var(--border)]",
                    )}
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white">
                      <Icon className="h-4 w-4 text-[var(--primary)]" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="block text-xs text-[var(--text-muted)]">{option.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <PaymentFields draft={draft} onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))} />
          {draft.method === "WALLET" ? (
            <div className="mt-4 rounded-2xl bg-[var(--background-blue)] px-3 py-3">
              <p className="text-sm font-medium">Balance {inr(walletBalance)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[500, 1000, 2000, 5000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    disabled={topupBusy}
                    onClick={() => void addMoney(amount)}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-[var(--border)] disabled:opacity-60"
                  >
                    Add {inr(amount)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="h-fit rounded-[28px] bg-white p-5 shadow-[var(--studio-shadow)] ring-1 ring-[var(--studio-line)] lg:sticky lg:top-24">
        <h2 className="font-semibold">Order</h2>
        <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
          {items.map((item) => (
            <li key={item.key} className="flex justify-between gap-3 py-2">
              <span className="min-w-0 truncate">
                {item.title} × {item.quantity}
              </span>
              <span className="shrink-0 font-medium">{inr(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted)]">Subtotal</dt>
            <dd>{inr(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-muted)]">Tax</dt>
            <dd>{inr(totals.tax)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>{draft.method === "CASH" ? "To pay later" : "To pay"}</dt>
            <dd>{inr(totals.total)}</dd>
          </div>
        </dl>
        {error ? <p className="mt-3 text-sm text-[var(--error)]">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy && draft.method !== "CASH" ? "Paying…" : payLabel}
        </button>
        <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
          {draft.method === "CASH"
            ? "No money is collected now."
            : draft.method === "WALLET"
              ? "Amount is deducted from your Book It All wallet."
              : "Card and UPI details are checked here. Full card number is not stored."}
        </p>
      </aside>
    </form>
  );
}
