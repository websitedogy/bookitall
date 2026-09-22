const PRODUCTION_ORIGIN = "https://bookitall.com";

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/$/, "");
}

/** Public site origin for canonicals, sitemap, robots, and JSON-LD. Never localhost. */
export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured || /localhost|127\.0\.0\.1/i.test(configured)) {
    return PRODUCTION_ORIGIN;
  }
  return normalizeOrigin(configured);
}

export const SITE_URL = siteOrigin();
