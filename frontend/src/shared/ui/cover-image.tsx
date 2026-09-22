"use client";

import { stableImage } from "@/shared/lib/stable-image";

export function CoverImage({
  src,
  alt,
  fallback = "/banners/hotels.jpg",
  className = "h-[min(72vh,560px)] w-full rounded-[2rem] bg-[#12241f]",
  fit = "contain",
  priority = true,
}: {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  fit?: "cover" | "contain";
  priority?: boolean;
}) {
  const url = stableImage(src, fallback);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-center ${fit === "contain" ? "object-contain" : "object-cover"}`}
      />
    </div>
  );
}
