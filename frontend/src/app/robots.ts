import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/partner",
        "/driver",
        "/technician",
        "/account",
        "/checkout",
        "/login",
        "/register",
        "/saved",
        "/my-bookings",
        "/vendors/my-orders",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
