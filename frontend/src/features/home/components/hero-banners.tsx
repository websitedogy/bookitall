"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BANNERS } from "@/features/home/banners";
import { useServiceCatalog } from "@/features/services/service-catalog-provider";
import { cn } from "@/shared/lib/cn";

export function HeroBanners() {
  const { isEnabled } = useServiceCatalog();
  const slides = BANNERS.filter((item) => item.id === "home" || isEnabled(item.id));
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const banner = slides[active] ?? slides[0];
  if (!banner) return null;

  return (
    <section className="px-4 pt-3 md:px-6 md:pt-4" aria-label="Homepage banners">
      <Link href={banner.href} className="relative block overflow-hidden rounded-2xl">
        {slides.map((item, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.id}
            src={item.image}
            alt={index === 0 || index === active ? item.title : ""}
            fetchPriority={index === 0 ? "high" : "low"}
            loading={index === 0 ? "eager" : "lazy"}
            className={cn(
              "h-[10.5rem] w-full object-cover sm:h-[13rem] md:h-[200px] lg:h-[240px]",
              index === active ? "relative opacity-100" : "absolute inset-0 opacity-0",
            )}
          />
        ))}
      </Link>
      <div className="mt-2.5 flex items-center justify-center gap-1.5" role="tablist" aria-label="Banner slides">
        {slides.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={`${item.title} banner`}
            onClick={() => setActive(index)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === active ? "w-6 bg-[var(--primary)]" : "w-1.5 bg-[var(--border)]",
            )}
          />
        ))}
      </div>
    </section>
  );
}
