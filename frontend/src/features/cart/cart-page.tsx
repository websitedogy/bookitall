"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "./store";
import { cartTotals, lineTotal, quantityLabel } from "./pricing";
import { ListingThumb } from "@/shared/ui/listing-thumb";
import { inr } from "@/shared/lib/format";

export function CartPage() {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const totals = cartTotals(items);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-1 py-10 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-[var(--text-muted)]" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Your cart is empty</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Pick a nearby service, add it here, then pay at checkout.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white">
          Browse services
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Cart</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{totals.count} item{totals.count === 1 ? "" : "s"} ready to book</p>
        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li key={item.key} className="flex gap-3 rounded-3xl bg-white p-3 ring-1 ring-[var(--border)] md:p-4">
              <Link href={`/listings/${item.listingId}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#F3EDE4]">
                <ListingThumb src={item.image} categoryId={item.categoryId} className="h-full w-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/listings/${item.listingId}`} className="block truncate font-semibold">
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {item.checkIn && item.checkOut
                        ? `${item.checkIn} → ${item.checkOut}`
                        : item.scheduledAt?.replace("T", " ")}
                    </p>
                  </div>
                  <button type="button" onClick={() => removeItem(item.key)} className="text-[var(--text-muted)]" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full bg-[var(--background-blue)] px-1 py-1">
                    <button type="button" className="inline-flex h-7 w-7 items-center justify-center" onClick={() => setQuantity(item.key, item.quantity - 1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-16 px-1 text-center text-xs font-semibold">
                      {item.quantity} {quantityLabel(item.categoryId).toLowerCase()}
                    </span>
                    <button type="button" className="inline-flex h-7 w-7 items-center justify-center" onClick={() => setQuantity(item.key, item.quantity + 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold">{inr(lineTotal(item))}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-3xl bg-white p-5 ring-1 ring-[var(--border)] lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Subtotal" value={inr(totals.subtotal)} />
          <Row label="Tax" value={inr(totals.tax)} />
          <Row label="To pay" value={inr(totals.total)} strong />
        </dl>
        <Link
          href="/checkout"
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white"
        >
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className={strong ? "font-semibold" : "font-medium"}>{value}</dd>
    </div>
  );
}
