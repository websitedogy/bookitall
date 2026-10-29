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
    <section id="explore" className="bg-white px-4 py-6 md:px-6 md:py-9" aria-labelledby="services-heading">
      <div className="mb-5">
        <h2 id="services-heading" className="text-[27px] font-bold leading-none tracking-tight text-[#102b4c] md:text-[36px]">
          {heading === "All services" ? (
            <>
              All <span className="text-[#f97316]">services</span>
            </>
          ) : (
            heading
          )}
        </h2>
        <span className="mt-2 block h-1 w-12 rounded-full bg-[#f97316]" aria-hidden />
      </div>
      <ul
        className={cn(
          "grid gap-3",
          featured
            ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 md:gap-5",
        )}
      >
        {items.map((service, index) => (
          <li key={service.id} className="min-w-0">
            <Link
              href={service.href}
              prefetch
              className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#e7edf5] bg-white p-2 text-center shadow-[0_8px_24px_-18px_rgba(16,43,76,0.5)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_30px_-18px_rgba(16,43,76,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 md:rounded-[26px] md:p-3"
            >
              <span className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-[18px] bg-[radial-gradient(ellipse_at_50%_45%,#fff7ed_0%,#f2f6fc_62%,#ffffff_100%)] sm:h-40 md:h-44 md:rounded-[22px]">
                {SERVICE_ART[service.id] ? (
                  <Image
                    src={SERVICE_ART[service.id]}
                    alt=""
                    width={240}
                    height={200}
                    priority={index < 4}
                    draggable={false}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : (
                  <CategoryArt
                    id={service.id}
                    size={200}
                    priority={index < 4}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                )}
              </span>
              <span className="mt-2 flex min-h-9 w-full items-center justify-center rounded-full bg-[#f2f6fc] px-2 text-[13px] font-bold leading-tight text-[#102b4c] sm:text-[15px] md:min-h-10 md:text-[18px]">
                {service.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
