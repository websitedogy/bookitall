import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/lib/site-url";
import { getAcceptedListings } from "@/shared/lib/catalog-fetch";
import { getServiceCatalog, isServiceEnabled } from "@/features/services/catalog";
import { HOME_SERVICES_PATH, listingCanonicalPath, publicBrowsePath } from "@/shared/lib/public-paths";

export const revalidate = 3600;

const CATEGORIES = [
  "hotels",
  "tours",
  "cabs",
  "electrician",
  "plumber",
  "ac",
  "cleaning",
  "beautician",
  "painting",
  "carpenter",
  "appliance",
  "jobs",
  "public-transport",
  "goods-transport",
  "packers-movers",
  "cloud-kitchen",
];

const STATIC_PATHS = [
  "/",
  HOME_SERVICES_PATH,
  ...CATEGORIES.map((id) => publicBrowsePath(id)),
  "/about",
  "/contact",
  "/support",
  "/careers",
  "/terms",
  "/privacy",
  "/cookies",
  "/cancellation",
  "/refunds",
  "/guides",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getServiceCatalog();
  const live = CATEGORIES.filter((id) => isServiceEnabled(catalog, id));
  const staticEntries = STATIC_PATHS.filter((path) => {
    const category = CATEGORIES.find((id) => path === publicBrowsePath(id));
    return !category || live.includes(category);
  }).map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "/" ? ("daily" as const) : ("weekly" as const),
    priority: path === "/" ? 1 : 0.8,
  }));

  const listingEntries: MetadataRoute.Sitemap = [];
  const listingGroups = await Promise.all(live.map((category) => getAcceptedListings(category)));
  const listingPaths = new Set<string>();
  for (const listings of listingGroups) {
    for (const listing of listings) {
      if (listing.status !== "ACCEPTED") continue;
      const path = listingCanonicalPath(listing);
      if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/listings/") || listingPaths.has(path)) continue;
      listingPaths.add(path);
      const modifiedDate = listing.updatedAt || listing.createdAt;
      const lastModified = modifiedDate ? new Date(modifiedDate) : undefined;
      listingEntries.push({
        url: `${SITE_URL}${path}`,
        ...(lastModified && Number.isFinite(lastModified.getTime()) ? { lastModified } : {}),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return [...staticEntries, ...listingEntries];
}
