import { cn } from "@/shared/lib/cn";

const VECTOR_ART = new Set(["goods-transport", "packers-movers", "cloud-kitchen"]);

const SERVICE_ART: Record<string, string> = {
  hotels: "/services/home/hotels.png",
  tours: "/services/home/tours.png",
  electrician: "/services/home/electrician.png",
  plumber: "/services/home/plumber.png",
  ac: "/services/home/ac.png",
  cleaning: "/services/home/cleaning.png",
  beautician: "/services/home/beauty.png",
  painting: "/services/home/painting.png",
  carpenter: "/services/home/carpenter.png",
  appliance: "/services/home/appliance.png",
  "public-transport": "/services/home/cabs.png",
  "goods-transport": "/services/home/goods-transport.png",
  "packers-movers": "/categories/movers.png?v=5",
};

export function serviceArtSrc(id: string) {
  return SERVICE_ART[id];
}

export function categoryArtSrc(id: string) {
  const serviceArt = serviceArtSrc(id);
  if (serviceArt) return serviceArt;
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
        {...(priority ? {} : { loading: "lazy" as const })}
        className={cn("object-contain", className)}
      />
    </span>
  );
}
