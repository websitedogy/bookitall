"use client";

import Link from "next/link";
import Image from "next/image";
import { useVisibleServices } from "@/features/services/service-catalog-provider";
import { cn } from "@/shared/lib/cn";
import { CategoryArt } from "./category-art";

const SERVICE_ICON_FILES: Record<string, string> = {
  hotels: "1f3e8",
  tours: "1f9f3",
  electrician: "1f4a1",
  plumber: "1f6b0",
  ac: "1f321",
  cleaning: "1f9f9",
  jobs: "1f4bc",
  beautician: "1f484",
  painting: "1f3a8",
  carpenter: "1f528",
  appliance: "1f9f0",
  "public-transport": "1f695",
  "goods-transport": "1f69a",
  "packers-movers": "1f9f3",
  "cloud-kitchen": "1f9fe",
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
              {SERVICE_ICON_FILES[service.id] ? (
                <Image
                  src={`/emojis/3d/${SERVICE_ICON_FILES[service.id]}.png`}
                  alt=""
                  width={40}
                  height={40}
                  draggable={false}
                  className={featured ? "h-16 w-16 object-contain md:h-20 md:w-20" : "h-8 w-8 object-contain sm:h-9 sm:w-9 md:h-16 md:w-16"}
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
