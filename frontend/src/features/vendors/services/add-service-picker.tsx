"use client";

import Link from "next/link";
import { useVisibleServices } from "@/features/services/service-catalog-provider";
import { CategoryArt } from "@/features/home/components/category-art";
import { FormBackButton } from "./form-back-button";
import { useClaimedCategories } from "./use-claimed-categories";

export function AddServicePicker() {
  const catalog = useVisibleServices();
  const { claimed } = useClaimedCategories();
  const items = catalog.filter((service) => !claimed.has(service.id));

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white pb-[calc(4.85rem+env(safe-area-inset-bottom))] md:h-auto md:overflow-visible">
      <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] pl-12 pr-4 md:h-auto md:flex-col md:items-start md:justify-start md:border-0 md:px-0 md:pb-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <FormBackButton fallback="/" />
          <h1 className="text-[17px] font-semibold tracking-tight md:mt-1 md:text-3xl">Place Register</h1>
        </div>
        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)] md:order-first md:text-[11px] md:tracking-[0.16em]">
          Vendor only
        </p>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center px-4 py-10 md:px-0">
          <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">
            Every service you already posted is hidden here, so you cannot add the same one twice. Open My Services to
            check review status.
          </p>
          <Link href="/vendors/posts" className="mt-5 text-sm font-medium text-[var(--primary)]">
            View My Services
          </Link>
        </div>
      ) : (
        <ul className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 md:mt-6 md:flex-none md:auto-rows-auto md:grid-cols-4 md:grid-rows-none md:gap-x-3 md:gap-y-6 lg:grid-cols-6">
          {items.map((service, index) => (
            <li key={service.id} className="min-h-0 min-w-0 border-b border-r border-[var(--border)] [&:nth-child(2n)]:border-r-0 [&:nth-last-child(-n+2)]:border-b-0 md:border-0">
              <Link
                href={`/vendors/services/${service.id}`}
                prefetch
                className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-1 px-1.5 py-1 text-center active:bg-[var(--background-blue)] md:gap-2 md:rounded-3xl md:px-2 md:py-3 md:hover:bg-transparent"
              >
                <span className="inline-flex h-9 w-9 max-h-[46%] max-w-full shrink-0 items-center justify-center md:h-24 md:w-24 md:max-h-none md:max-w-none">
                  <CategoryArt
                    id={service.id}
                    size={96}
                    priority={index < 8}
                    className="h-full w-full object-contain"
                  />
                </span>
                <span className="line-clamp-2 w-full text-[12px] font-medium leading-tight text-[var(--text)] md:line-clamp-none md:text-sm">
                  {service.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
