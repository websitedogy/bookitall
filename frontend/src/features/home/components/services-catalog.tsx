"use client";

import Link from "next/link";
import { useVisibleServices } from "@/features/services/service-catalog-provider";
import { CategoryArt } from "./category-art";

export function ServicesCatalog({ heading = "Home services in Hyderabad" }: { heading?: string }) {
  const items = useVisibleServices();
  return (
    <>
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-white pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:hidden">
        <header className="flex h-11 shrink-0 items-center border-b border-[var(--border)] pl-12 pr-3">
          <h1 className="text-[17px] font-semibold tracking-tight">{heading}</h1>
        </header>

        <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 content-start overflow-y-auto">
          {items.map((service, index) => (
            <li
              key={service.id}
              className="border-b border-r border-[var(--border)] [&:nth-child(2n)]:border-r-0"
            >
              <Link
                href={service.href}
                prefetch
                className="flex min-h-[7.25rem] flex-col items-center justify-center gap-2 px-2 py-3 text-center active:bg-[var(--background-blue)]"
              >
                <CategoryArt
                  id={service.id}
                  size={56}
                  priority={index < 4}
                  className="h-14 w-14 shrink-0 object-contain"
                />
                <span className="text-[13px] font-medium leading-snug text-[var(--text)]">
                  {service.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden bg-white md:block">
        <header className="flex h-11 items-center border-b border-[var(--border)] pl-12 pr-3">
          <h1 className="text-[17px] font-semibold tracking-tight">{heading}</h1>
        </header>
        <ul className="mt-6 grid grid-cols-4 gap-x-3 gap-y-6 px-4 pb-8 lg:grid-cols-6">
          {items.map((service, index) => (
            <li key={service.id}>
              <Link href={service.href} className="flex flex-col items-center gap-2 text-center">
                <span className="inline-flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.15rem]">
                  <CategoryArt id={service.id} size={120} priority={index < 6} className="h-full w-full object-contain" />
                </span>
                <span className="text-sm font-medium text-[var(--text)]">{service.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
