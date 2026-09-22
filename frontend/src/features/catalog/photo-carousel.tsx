"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mediaUrl } from "@/shared/lib/stable-image";
import { ListingThumb } from "@/shared/ui/listing-thumb";
import { cn } from "@/shared/lib/cn";

function SlideImage({
  src,
  categoryId,
  alt,
  className,
}: {
  src: string;
  categoryId: string;
  alt?: string;
  className: string;
}) {
  if (src.startsWith("/uploads/") || src.startsWith("http")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={mediaUrl(src)} alt={alt ?? ""} className={className} />
    );
  }
  return <ListingThumb src={src} categoryId={categoryId} className={className} />;
}

export function listingSlides(photos: string[] | undefined, fallback?: string) {
  const uploads = (photos ?? []).filter((src) => src.startsWith("/uploads/") || src.startsWith("http"));
  if (uploads.length) return uploads;
  return fallback ? [fallback] : [];
}

export function CompactPhotoCarousel({
  photos,
  fallback,
  categoryId,
  title,
  className,
}: {
  photos?: string[];
  fallback: string;
  categoryId: string;
  title: string;
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slides = listingSlides(photos, fallback);

  function onScroll() {
    const el = scroller.current;
    if (!el || !el.clientWidth) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  if (!slides.length) {
    return (
      <div className={cn("overflow-hidden bg-slate-100", className)}>
        <ListingThumb src={fallback} categoryId={categoryId} className="h-full w-full object-contain object-center" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-slate-100", className)}>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
      >
          {slides.map((src, i) => (
            <div key={`${src}-${i}`} className="flex h-full min-w-full shrink-0 snap-center basis-full items-center justify-center">
              <SlideImage
                src={src}
                categoryId={categoryId}
                alt={i === index ? title : ""}
                className="h-full w-full object-contain object-center"
              />
            </div>
          ))}
      </div>
      {slides.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
          {slides.map((_, i) => (
            <span
              key={`dot-${i}`}
              className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-white" : "bg-white/50")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PhotoCarousel({
  photos,
  fallback,
  categoryId,
  title,
  variant = "page",
}: {
  photos: string[];
  fallback: string;
  categoryId: string;
  title: string;
  variant?: "page" | "hero";
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const slides = photos.length ? photos : [fallback];

  function onScroll() {
    const el = scroller.current;
    if (!el || !el.clientWidth) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(next: number) {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setIndex(next);
  }

  const last = slides.length - 1;
  const hero = variant === "hero";

  useEffect(() => {
    if (viewerIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setViewerIndex(null);
      if (event.key === "ArrowLeft") setViewerIndex((current) => (current === null ? null : current === 0 ? last : current - 1));
      if (event.key === "ArrowRight") setViewerIndex((current) => (current === null ? null : current === last ? 0 : current + 1));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [last, viewerIndex]);

  return (
    <div className={hero ? "bg-[#0a1f1c]" : "bg-white"}>
      {slides.length ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto bg-white px-3 py-2.5 md:hidden">
          {slides.map((src, i) => (
            <button
              key={`mobile-thumb-${src}-${i}`}
              type="button"
              onClick={() => {
                setIndex(i);
                setViewerIndex(i);
              }}
              aria-label={`Open photo ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-[#f1f5f9] ring-2 ring-offset-1",
                i === index ? "ring-[var(--primary)]" : "ring-transparent",
              )}
            >
              <SlideImage src={src} categoryId={categoryId} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <div
        className={cn(
          "relative hidden w-full overflow-hidden bg-[#12241f] md:block",
          hero ? "h-[min(48vh,420px)] md:h-[min(56vh,480px)]" : "aspect-[16/10] md:aspect-[16/9]",
        )}
      >
        <div
          ref={scroller}
          onScroll={onScroll}
          className="no-scrollbar absolute inset-0 flex w-full snap-x snap-mandatory overflow-x-auto"
        >
          {slides.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="flex h-full w-full min-w-full max-w-full shrink-0 snap-center basis-full items-center justify-center"
            >
              <SlideImage
                src={src}
                categoryId={categoryId}
                alt={i === index ? title : ""}
                className="h-full w-full object-contain object-center"
              />
            </div>
          ))}
        </div>
        {slides.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => goTo(index === 0 ? last : index - 1)}
              className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => goTo(index === last ? 0 : index + 1)}
              className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
            </button>
            <span className="absolute right-4 top-4 z-10 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm">
              {index + 1} / {slides.length}
            </span>
          </>
        ) : null}
      </div>

      {!hero && slides.length > 1 ? (
        <div className="no-scrollbar hidden gap-2 overflow-x-auto px-4 py-3 md:flex">
          {slides.map((src, i) => (
            <button
              key={`thumb-${src}-${i}`}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#f1f5f9] ring-2 ring-offset-1",
                i === index ? "ring-[var(--primary)]" : "ring-transparent",
              )}
            >
              <SlideImage src={src} categoryId={categoryId} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {viewerIndex !== null ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:hidden" role="dialog" aria-modal="true" aria-label={`${title} photos`} onClick={() => setViewerIndex(null)}>
          <button type="button" aria-label="Close photo viewer" onClick={() => setViewerIndex(null)} className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl text-white">&times;</button>
          <button type="button" aria-label="Previous photo" onClick={(event) => { event.stopPropagation(); setViewerIndex(viewerIndex === 0 ? last : viewerIndex - 1); }} className="absolute left-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"><ChevronLeft className="h-6 w-6" /></button>
          <div className="flex h-full w-full items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <SlideImage src={slides[viewerIndex]} categoryId={categoryId} alt={`${title} photo ${viewerIndex + 1}`} className="max-h-full max-w-full object-contain" />
          </div>
          <button type="button" aria-label="Next photo" onClick={(event) => { event.stopPropagation(); setViewerIndex(viewerIndex === last ? 0 : viewerIndex + 1); }} className="absolute right-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"><ChevronRight className="h-6 w-6" /></button>
          <span className="absolute bottom-5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">{viewerIndex + 1} / {slides.length}</span>
        </div>
      ) : null}
    </div>
  );
}
