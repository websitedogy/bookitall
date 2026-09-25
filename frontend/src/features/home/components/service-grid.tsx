"use client";

import Link from "next/link";
import { useVisibleServices } from "@/features/services/service-catalog-provider";
import { cn } from "@/shared/lib/cn";
import { CategoryArt } from "./category-art";

export function ServiceGrid({
  heading = "All services",
  featured = false,
}: {
  heading?: string;
  featured?: boolean;
}) {
  const items = useVisibleServices();
  if (!items.length) return null;
  return (
    <section
      id="explore"
      className="border-y border-slate-100 bg-white px-4 py-6 md:px-6 md:py-8"
      aria-labelledby="services-heading"
    >
      <h2 id="services-heading" className="text-[17px] font-bold tracking-[-0.02em] text-[var(--text)] md:text-xl">
        {heading}
      </h2>
      <ul
        className={cn(
          "mt-4 grid",
          featured
            ? "grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6"
            : "grid-cols-4 gap-2.5 md:grid-cols-6 md:gap-3.5",
        )}
      >
        {items.map((service) => (
          <li key={service.id} className="min-w-0">
            <Link
              href={service.href}
              prefetch
              className="group flex min-h-28 flex-col items-center justify-center gap-2 rounded-[20px] border border-slate-200/80 bg-white px-1.5 py-3 text-center shadow-[0_6px_20px_-16px_rgba(15,23,42,0.7)] transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_14px_28px_-16px_rgba(15,118,110,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 md:min-h-32 md:px-2 md:py-3.5"
            >
              <CategoryArt
                id={service.id}
                size={featured ? 280 : 64}
                className={
                  featured
                    ? "h-full w-full object-contain"
                    : "h-12 w-12 object-contain sm:h-14 sm:w-14 md:h-16 md:w-16"
                }
              />
              <span
                className={cn(
                  "w-full font-semibold leading-tight tracking-[-0.01em] text-[var(--text)]",
                  featured ? "text-sm" : "line-clamp-2 text-[11px] md:line-clamp-none md:text-[13px]",
                )}
              >
                {service.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
