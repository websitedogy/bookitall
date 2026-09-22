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
  "/hotels/hyderabad",
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
  "/vendors/services",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getServiceCatalog();
  const live = CATEGORIES.filter((id) => !catalog.length || isServiceEnabled(catalog, id));
  const now = new Date();
  const staticEntries = STATIC_PATHS.filter((path) => {
    const category = CATEGORIES.find((id) => path === publicBrowsePath(id) || (path === "/hotels/hyderabad" && id === "hotels"));
    return !category || live.includes(category);
  }).map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? ("daily" as const) : ("weekly" as const),
    priority: path === "/" ? 1 : 0.8,
  }));

  const listingEntries: MetadataRoute.Sitemap = [];
  for (const category of live) {
    const listings = await getAcceptedListings(category);
    for (const listing of listings) {
      if (listing.status && listing.status !== "ACCEPTED") continue;
      const path = listingCanonicalPath(listing);
      if (path.startsWith("/listings/")) continue;
      listingEntries.push({
        url: `${SITE_URL}${path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return [...staticEntries, ...listingEntries];
}
