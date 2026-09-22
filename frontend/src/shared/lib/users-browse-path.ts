import { isCategoryBrowse } from "@/shared/lib/public-paths";

/** Exact category browse pages (not listing detail slugs). */
export function isUsersCategoryBrowse(pathname: string) {
  return isCategoryBrowse(pathname);
}
