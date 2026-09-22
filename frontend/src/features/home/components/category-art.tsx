const ART_V = "2";

export const CATEGORY_ART: Record<string, string> = {
  hotels: `/categories/hotels.png?v=${ART_V}`,
  tours: `/categories/tours.png?v=${ART_V}`,
  cabs: `/categories/cabs.png?v=${ART_V}`,
  electrician: `/categories/electrician.png?v=${ART_V}`,
  plumber: `/categories/plumber.png?v=${ART_V}`,
  ac: `/categories/ac.png?v=${ART_V}`,
  cleaning: `/categories/cleaning.png?v=${ART_V}`,
  jobs: `/categories/jobs.png?v=${ART_V}`,
  beautician: `/categories/beautician.png?v=${ART_V}`,
  painting: `/categories/painting.png?v=${ART_V}`,
  carpenter: `/categories/carpenter.png?v=${ART_V}`,
  appliance: `/categories/appliance.png?v=${ART_V}`,
  "public-transport": `/categories/public-transport.svg?v=${ART_V}`,
  "goods-transport": `/categories/goods-transport.svg?v=${ART_V}`,
  "packers-movers": `/categories/packers-movers.svg?v=${ART_V}`,
  "cloud-kitchen": `/categories/cloud-kitchen.svg?v=${ART_V}`,
};

export function categoryArtSrc(id: string) {
  return CATEGORY_ART[id] ?? `/categories/${id}.png?v=${ART_V}`;
}

export function CategoryArt({
  id,
  size = 72,
  className = "",
  priority = false,
  alt = "",
}: {
  id: string;
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  const src = categoryArtSrc(id);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      decoding={priority ? "sync" : "async"}
      className={className || "h-full w-full object-cover"}
      style={className ? undefined : { width: size, height: size }}
    />
  );
}
