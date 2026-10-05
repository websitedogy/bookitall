"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { CategoryArt } from "@/features/home/components/category-art";
import { useClaimedCategories } from "./use-claimed-categories";

export const LOCAL_MARKET_FORMS = [
  {
    id: "cloud-kitchen",
    name: "Cloud Kitchen",
    href: "/vendors/services/cloud-kitchen?type=cloud-kitchen",
  },
  {
    id: "local-shops",
    name: "Local Shops",
    href: "/vendors/services/cloud-kitchen?type=local-shops",
  },
] as const;

export function LocalMarketChoices({ respectClaims = false }: { respectClaims?: boolean }) {
  const { claimed } = useClaimedCategories();
  const items = LOCAL_MARKET_FORMS.filter((item) => !respectClaims || !claimed.has(item.id));

  if (!items.length) {
    return (
      <div className="px-4 py-8">
        <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">
          Cloud Kitchen and Local Shops are already listed. Open My Services to check them.
        </p>
        <Link href="/vendors/posts" className="mt-5 inline-flex text-sm font-medium text-[var(--primary)]">
          View My Services
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 px-4 py-5 md:max-w-xl md:px-0">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            prefetch
            className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl bg-white px-3 py-6 text-center ring-1 ring-[var(--border)] transition active:bg-[var(--background-blue)] md:hover:ring-[var(--primary)]/40"
          >
            {item.id === "cloud-kitchen" ? (
              <CategoryArt id="cloud-kitchen" size={96} className="h-20 w-20 object-contain" />
            ) : (
              <span className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[#fff4e8] text-[#c2410c]">
                <Store className="h-10 w-10" strokeWidth={1.7} aria-hidden />
              </span>
            )}
            <span className="text-sm font-semibold text-[var(--text)]">{item.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
