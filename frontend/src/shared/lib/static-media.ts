const BANNER_WEBP: Record<string, string> = {
  "/banners/hotels.png": "/banners/hotels.webp",
  "/banners/hotels.jpg": "/banners/hotels.webp",
  "/banners/tours.png": "/banners/tours.webp",
  "/banners/tours.jpg": "/banners/tours.webp",
  "/banners/cabs.png": "/banners/cabs.webp",
  "/banners/cabs.jpg": "/banners/cabs.webp",
  "/banners/home.png": "/banners/home.webp",
  "/banners/home.jpg": "/banners/home.webp",
};

const VECTOR = new Set(["goods-transport", "packers-movers", "cloud-kitchen"]);

/** Point known heavy public images at the small WebP copies. */
export function lightStaticSrc(src: string) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;
  const hashAt = src.indexOf("#");
  const hash = hashAt >= 0 ? src.slice(hashAt) : "";
  const withoutHash = hashAt >= 0 ? src.slice(0, hashAt) : src;
  const queryAt = withoutHash.indexOf("?");
  const path = queryAt >= 0 ? withoutHash.slice(0, queryAt) : withoutHash;
  const banner = BANNER_WEBP[path];
  if (banner) return `${banner}${hash}`;
  const category = path.match(/^\/categories\/([a-z0-9-]+)\.png$/);
  if (category && !VECTOR.has(category[1])) {
    const file = category[1] === "public-transport" ? "cabs" : category[1];
    return `/categories/${file}.webp?v=5${hash}`;
  }
  return src;
}
