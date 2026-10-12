import { cn } from "@/shared/lib/cn";

const VECTOR_ART = new Set(["public-transport", "goods-transport", "packers-movers", "cloud-kitchen"]);

export function categoryArtSrc(id: string) {
  const file = VECTOR_ART.has(id) ? `${id}.svg` : `${id}.png`;
  const version = id === "public-transport" ? 3 : 2;
  return `/categories/${file}?v=${version}`;
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
        className={cn("object-contain brightness-110 saturate-125", className)}
      />
    </span>
  );
}
