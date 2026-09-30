"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "./site-footer";

export function PublicFooter() {
  const pathname = usePathname() ?? "/";
  if (pathname !== "/") return null;
  return <SiteFooter />;
}
