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
    <section id="explore" className="bg-white px-4 py-5 md:px-6 md:py-7" aria-labelledby="services-heading">
      <h2 id="services-heading" className="text-base font-semibold tracking-tight text-[var(--text)] md:text-lg">
        {heading}
      </h2>
      <ul
        className={cn(
          "mt-4 grid",
          featured
            ? "grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6"
            : "grid-cols-4 gap-x-2 gap-y-4 md:grid-cols-6 md:gap-x-3 md:gap-y-5",
        )}
      >
        {items.map((service, index) => (
          <li key={service.id} className="min-w-0">
            <Link
              href={service.href}
              prefetch
              className="group flex flex-col items-center gap-1.5 text-center md:rounded-2xl md:px-2 md:py-3 md:transition md:hover:bg-[#f8fafc]"
            >
              <span className="inline-flex overflow-hidden rounded-2xl">
                <CategoryArt
                  id={service.id}
                  size={featured ? 280 : 64}
                  priority={index < 8}
                  className={
                    featured
                      ? "h-full w-full object-contain"
                      : "h-12 w-12 object-contain sm:h-14 sm:w-14 md:h-16 md:w-16"
                  }
                />
              </span>
              <span
                className={cn(
                  "w-full font-medium leading-snug text-[var(--text)]",
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
