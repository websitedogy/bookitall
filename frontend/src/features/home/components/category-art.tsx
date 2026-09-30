import { cn } from "@/shared/lib/cn";

const VECTOR_ART = new Set(["public-transport", "goods-transport", "packers-movers", "cloud-kitchen"]);

export function categoryArtSrc(id: string) {
  const file = VECTOR_ART.has(id) ? `${id}.svg` : `${id}.png`;
  return `/categories/${file}?v=2`;
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
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn("object-contain", className)}
      />
    </span>
  );
}
