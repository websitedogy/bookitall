"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { BANNERS } from "@/features/home/banners";
import { useServiceCatalog } from "@/features/services/service-catalog-provider";
import { API_URL } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";

type Slide = {
  id: string;
  href: string;
  title: string;
  image: string;
};

const SERVICE_SLIDES = new Set(["hotels", "tours", "cabs"]);

const FALLBACK: Slide[] = BANNERS.map((item) => ({
  id: item.id,
  href: item.href,
  title: item.title,
  image: item.image,
}));

export function HeroBanners() {
  const { isEnabled } = useServiceCatalog();
  const [remote, setRemote] = useState<Slide[] | null>(null);
  const [active, setActive] = useState(0);
  const source = remote ?? FALLBACK;
  const slides = source.filter((item) => !SERVICE_SLIDES.has(item.id) || isEnabled(item.id));

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/banners`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        const rows = Array.isArray(json.data) ? json.data : [];
        const next = rows
          .filter((row: { image?: string; href?: string; title?: string }) => row?.image && row?.href && row?.title)
          .map((row: { id?: string; slug?: string; href: string; title: string; image: string }) => ({
            id: String(row.slug || row.id),
            href: String(row.href),
            title: String(row.title),
            image: String(row.image),
          }));
        if (next.length) setRemote(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setActive(0);
  }, [slides.length, remote]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [slides.length, active]);

  const banner = slides[active] ?? slides[0];
  if (!banner) return null;

  function step(delta: number) {
    setActive((current) => (current + delta + slides.length) % slides.length);
  }

  return (
    <section className="px-4 pt-3 md:px-6 md:pt-4" aria-label="Homepage banners">
      <div className="relative">
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
                "h-[10.5rem] w-full object-cover brightness-110 saturate-125 sm:h-[13rem] md:h-[200px] lg:h-[240px]",
                index === active ? "relative opacity-100" : "absolute inset-0 opacity-0",
              )}
            />
          ))}
        </Link>
        {slides.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={() => step(-1)}
              className="absolute left-2 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-md ring-1 ring-black/10 hover:bg-white md:left-3 md:h-10 md:w-10"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next banner"
              onClick={() => step(1)}
              className="absolute right-2 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-md ring-1 ring-black/10 hover:bg-white md:right-3 md:h-10 md:w-10"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        ) : null}
      </div>
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
