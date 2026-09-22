"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "./site-footer";

const HIDDEN_FOOTER_PATHS = new Set([
  "/account",
  "/checkout",
  "/login",
  "/register",
  "/saved",
  "/my-bookings",
  "/vendors/my-orders",
  "/admin",
  "/partner",
  "/driver",
  "/technician",
]);

export function PublicFooter() {
  const pathname = usePathname() ?? "/";

  if (HIDDEN_FOOTER_PATHS.has(pathname)) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/partner") || pathname.startsWith("/driver") || pathname.startsWith("/technician")) {
    return null;
  }

  return <SiteFooter />;
}
