"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CategoryArt } from "@/features/home/components/category-art";
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
  const [failed, setFailed] = useState(false);
  const direct = src.startsWith("/uploads/") || src.startsWith("http");
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);
  if (!direct || failed) {
    if (failed || !src) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#f4efe4]">
          <CategoryArt id={categoryId} size={72} className="h-12 w-12" alt={alt} />
        </div>
      );
    }
    return <ListingThumb src={src} categoryId={categoryId} alt={alt} className={className} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} src={mediaUrl(src)} alt={alt ?? ""} className={className} onError={() => setFailed(true)} />
  );
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
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const slides = photos.length ? photos : fallback ? [fallback] : [];
  const last = Math.max(0, slides.length - 1);
  const many = slides.length > 1;

  useEffect(() => {
    if (viewerIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setViewerIndex(null);
      if (event.key === "ArrowLeft") setViewerIndex((current) => (current === null ? null : current === 0 ? last : current - 1));
      if (event.key === "ArrowRight") setViewerIndex((current) => (current === null ? null : current === last ? 0 : current + 1));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [last, viewerIndex]);

  function step(direction: -1 | 1) {
    setViewerIndex((current) => {
      if (current === null) return null;
      if (direction === -1) return current === 0 ? last : current - 1;
      return current === last ? 0 : current + 1;
    });
  }

  const modal =
    viewerIndex !== null && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} photos`}
            onClick={() => setViewerIndex(null)}
          >
            <button
              type="button"
              aria-label="Close photo"
              onClick={() => setViewerIndex(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl text-white"
            >
              &times;
            </button>
            {many ? (
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#12241f] shadow-lg"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : null}
            <div className="flex max-h-[85vh] max-w-[92vw] items-center justify-center" onClick={(event) => event.stopPropagation()}>
              <SlideImage
                src={slides[viewerIndex]}
                categoryId={categoryId}
                alt={`${title} photo ${viewerIndex + 1}`}
                className="max-h-[85vh] max-w-[92vw] object-contain"
              />
            </div>
            {many ? (
              <button
                type="button"
                aria-label="Next photo"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#12241f] shadow-lg"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            ) : null}
            {many ? (
              <span className="absolute bottom-24 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white md:bottom-6">
                {viewerIndex + 1} / {slides.length}
              </span>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  if (!slides.length) return null;

  return (
    <div className={variant === "hero" ? "bg-transparent" : "bg-white"}>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {slides.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setViewerIndex(i)}
            aria-label={`Open photo ${i + 1}`}
            className={cn(
              "h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-xl bg-[#f4efe4] ring-2 ring-offset-1",
              viewerIndex === i ? "ring-[var(--primary)]" : "ring-transparent",
            )}
          >
            <SlideImage src={src} categoryId={categoryId} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {modal}
    </div>
  );
}
