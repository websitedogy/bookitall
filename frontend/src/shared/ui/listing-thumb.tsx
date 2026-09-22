"use client";

import { useState } from "react";
import { CategoryArt } from "@/features/home/components/category-art";
import { mediaUrl } from "@/shared/lib/stable-image";

export function ListingThumb({
  src,
  categoryId,
  className = "h-full w-full object-cover",
  alt,
}: {
  src?: string | null;
  categoryId: string;
  className?: string;
  alt?: string;
}) {
  const uploaded = Boolean(src && (src.startsWith("/uploads/") || src.includes("/uploads/")));
  const [failed, setFailed] = useState(false);

  if (!uploaded || failed) {
    return <CategoryArt id={categoryId} size={88} className={className} alt={alt} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={mediaUrl(src!)} alt={alt ?? ""} className={className} onError={() => setFailed(true)} />
  );
}
