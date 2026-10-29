"use client";

import Link from "next/link";
import Image from "next/image";
import { useVisibleServices } from "@/features/services/service-catalog-provider";
import { cn } from "@/shared/lib/cn";
import { CategoryArt } from "./category-art";

const SERVICE_ART: Record<string, string> = {
  hotels: "/categories/hotels.png",
  tours: "/categories/tours.png",
  electrician: "/categories/electrician.png",
  plumber: "/categories/plumber.png",
  ac: "/categories/ac.png",
  cleaning: "/categories/cleaning.png",
  jobs: "/categories/jobs.png",
  beautician: "/categories/beautician.png",
  painting: "/categories/painting.png",
  carpenter: "/categories/carpenter.png",
  appliance: "/categories/appliance.png",
  "public-transport": "/categories/cabs.png",
  "goods-transport": "/categories/goods-transport.svg",
  "packers-movers": "/categories/movers.png",
  "cloud-kitchen": "/categories/cloud-kitchen.svg",
};

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
    <section id="explore" className="bg-white px-4 py-4 md:px-6 md:py-7" aria-labelledby="services-heading">
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1 rounded-full bg-[#f97316]" aria-hidden />
        <h2 id="services-heading" className="text-base font-semibold tracking-tight text-[#102b4c] md:text-lg">
          {heading}
        </h2>
      </div>
      <ul
        className={cn(
          "mt-4 grid",
          featured
            ? "grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6"
            : "grid-cols-4 gap-x-2 gap-y-2.5 md:grid-cols-6 md:gap-x-3 md:gap-y-5",
        )}
      >
        {items.map((service, index) => (
          <li key={service.id} className="min-w-0">
            <Link
              href={service.href}
              prefetch
              className="group flex min-h-[4.5rem] flex-col items-center justify-center gap-1 px-1 py-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 md:min-h-0 md:rounded-2xl md:px-2 md:py-3 md:transition md:hover:bg-[#f8fafc]"
            >
              {SERVICE_ART[service.id] ? (
                <Image
                  src={SERVICE_ART[service.id]}
                  alt=""
                  width={40}
                  height={40}
                  draggable={false}
                  className={
                    featured
                      ? "h-16 w-16 object-contain md:h-20 md:w-20"
                      : "h-10 w-10 object-contain sm:h-12 sm:w-12 md:h-16 md:w-16"
                  }
                />
              ) : (
                <CategoryArt
                  id={service.id}
                  size={featured ? 96 : 64}
                  priority={index < 4}
                  className={featured ? "h-16 w-16 object-contain md:h-20 md:w-20" : "h-8 w-8 object-contain sm:h-9 sm:w-9 md:h-16 md:w-16"}
                />
              )}
              <span
                className={cn(
                  "w-full font-medium leading-snug text-[var(--text)]",
                  featured ? "text-sm" : "line-clamp-2 text-[10px] md:line-clamp-none md:text-[13px]",
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
