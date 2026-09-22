const CITY_BROWSE: Record<string, string> = {
  electrician: "/electrician/hyderabad",
  plumber: "/plumber/hyderabad",
  ac: "/ac-repair/hyderabad",
  cleaning: "/cleaning/hyderabad",
  beautician: "/beautician/hyderabad",
  painting: "/painting/hyderabad",
  carpenter: "/carpenter/hyderabad",
  appliance: "/appliance/hyderabad",
  jobs: "/jobs/hyderabad",
  "public-transport": "/public-transport/hyderabad",
  "goods-transport": "/goods-transport/hyderabad",
  "packers-movers": "/packers-movers/hyderabad",
  "cloud-kitchen": "/cloud-kitchen/hyderabad",
};

export const TRAVEL_BROWSE: Record<string, string> = {
  hotels: "/hotels",
  tours: "/tours",
  cabs: "/cabs",
};

export const HOME_SERVICES_PATH = "/home-services";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function publicBrowsePath(categoryId: string) {
  return TRAVEL_BROWSE[categoryId] ?? CITY_BROWSE[categoryId] ?? `/${categoryId}`;
}

export function listingIdFromSlug(slug: string) {
  const match = slug.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  return match?.[0] ?? null;
}

export function listingCanonicalPath(listing: {
  id: string;
  title: string;
  categoryId: string;
  href?: string;
  canonicalPath?: string;
  city?: string;
}) {
  const published = listing.canonicalPath || listing.href;
  if (published && published.startsWith("/") && !published.startsWith("/listings/")) {
    return published;
  }
  const slug = `${slugify(listing.title) || listing.categoryId}-${listing.id}`;
  if (listing.categoryId === "hotels") {
    const city = slugify(listing.city || "Hyderabad") || "hyderabad";
    return `/hotels/${city}/${slug}`;
  }
  if (listing.categoryId === "tours") return `/tours/${slug}`;
  if (listing.categoryId === "cabs") return `/cabs/${slug}`;
  return `${publicBrowsePath(listing.categoryId)}/${slug}`;
}

const USER_CATEGORIES = new Set([
  "hotels",
  "tours",
  "cabs",
  "electrician",
  "plumber",
  "ac",
  "cleaning",
  "jobs",
  "beautician",
  "painting",
  "carpenter",
  "appliance",
  "public-transport",
  "goods-transport",
  "packers-movers",
  "cloud-kitchen",
]);

const CITY_FOLDER: Record<string, string> = {
  electrician: "electrician",
  plumber: "plumber",
  "ac-repair": "ac",
  cleaning: "cleaning",
  beautician: "beautician",
  painting: "painting",
  carpenter: "carpenter",
  appliance: "appliance",
  jobs: "jobs",
  "public-transport": "public-transport",
  "goods-transport": "goods-transport",
  "packers-movers": "packers-movers",
  "cloud-kitchen": "cloud-kitchen",
};

export function isCategoryBrowse(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "users" && parts.length === 2) return USER_CATEGORIES.has(parts[1]);
  if (parts.length === 1 && (parts[0] === "hotels" || parts[0] === "tours" || parts[0] === "cabs")) return true;
  if (parts.length === 2 && parts[0] === "hotels") return true;
  if (parts.length === 2 && parts[1] === "hyderabad" && parts[0] in CITY_FOLDER) return true;
  return false;
}

export function isPublicListingPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "listings" && parts.length === 2) return true;
  if (parts.length === 2 && (parts[0] === "tours" || parts[0] === "cabs")) return true;
  if (parts.length === 3 && parts[0] === "hotels") return true;
  if (parts.length === 3 && parts[0] in CITY_FOLDER) return true;
  return false;
}

export function isHomeServicesPath(pathname: string) {
  return pathname === "/services" || pathname === HOME_SERVICES_PATH;
}
