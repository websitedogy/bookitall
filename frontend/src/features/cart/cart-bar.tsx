"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useCart, useCartCount } from "./store";
import { cartTotals } from "./pricing";
import { inr } from "@/shared/lib/format";

export function CartBar() {
  const pathname = usePathname();
  const items = useCart((s) => s.items);
  const dismissed = useCart((s) => s.barDismissed);
  const hideBar = useCart((s) => s.hideBar);
  const count = useCartCount();
  const totals = cartTotals(items);
  const hidden =
    dismissed ||
    !count ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/admin");

  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-30 px-3 md:bottom-28">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-1 rounded-full bg-[var(--primary)] py-1.5 pr-2 pl-5 text-white shadow-[0_12px_28px_-12px_rgba(15,118,110,0.8)]">
        <Link href="/cart" className="flex min-w-0 flex-1 items-center justify-between gap-3 py-1.5">
          <span className="truncate text-sm font-semibold">
            {count} item{count === 1 ? "" : "s"} · {inr(totals.total)}
          </span>
          <span className="shrink-0 text-sm font-semibold">View cart →</span>
        </Link>
        <button
          type="button"
          onClick={hideBar}
          aria-label="Hide cart bar"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/15"
        >
          <X className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
