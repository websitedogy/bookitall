"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ListingThumb } from "@/shared/ui/listing-thumb";
import { PriceLabel } from "@/shared/ui/price-label";
import { WishlistButton } from "./wishlist-button";
import { useSaved, useSavedReady } from "./store";

export function SavedList() {
  const ready = useSavedReady();
  const items = useSaved((s) => s.items);

  if (!ready) {
    return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-1 py-8 text-center">
        <Heart className="mx-auto h-10 w-10 text-[var(--text-muted)]" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Saved</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Hotels, tours and services you heart will show up here.</p>
        <Link href="/" className="mt-6 inline-flex text-sm font-medium text-[var(--primary)]">
          Browse services
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Saved</h1>
      <p className="mt-1 text-sm text-slate-500">{items.length} listing{items.length === 1 ? "" : "s"}</p>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <article className="flex h-full flex-col overflow-hidden bg-white ring-1 ring-slate-200">
              <div className="relative">
                <Link href={item.href} className="relative block h-52 overflow-hidden bg-slate-100">
                  <ListingThumb src={item.image} categoryId={item.categoryId} className="h-full w-full object-cover" />
                </Link>
                <WishlistButton item={item} className="absolute right-3 top-3 z-10" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <Link href={item.href}>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">{item.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {[item.category, item.location].filter(Boolean).join(" · ")}
                  </p>
                </Link>
                {item.priceLabel ? (
                  <div className="mt-auto pt-5">
                    <PriceLabel label={item.priceLabel} amountClassName="text-[18px]" />
                  </div>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
