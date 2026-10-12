import { cn } from "@/shared/lib/cn";

const VECTOR_ART = new Set(["goods-transport", "packers-movers", "cloud-kitchen"]);

export function categoryArtSrc(id: string) {
  if (VECTOR_ART.has(id)) return `/categories/${id}.svg?v=2`;
  const file = id === "public-transport" ? "cabs.webp" : `${id}.webp`;
  return `/categories/${file}?v=5`;
}

export function CategoryArt({
  id,
  size = 72,
  className = "",
  alt = "",
  priority = false,
}: {
  id: string;
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    <span className="inline-flex overflow-hidden rounded-2xl">
      <img
        src={categoryArtSrc(id)}
        alt={alt}
        width={size}
        height={size}
        draggable={false}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn("object-contain brightness-110 saturate-125", className)}
      />
    </span>
  );
}
