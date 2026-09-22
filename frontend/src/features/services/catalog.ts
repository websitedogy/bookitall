import { SERVICE_NAV } from "@/features/home/service-nav";
import { API_URL } from "@/shared/lib/api";
import type { PlatformService } from "./types";

const STORAGE_KEY = "bookitall-service-catalog";

export type ServiceNavItem = (typeof SERVICE_NAV)[number];

export function parseCatalog(raw: unknown): PlatformService[] {
  const rows = Array.isArray(raw) ? raw : [];
  return rows
    .map((row) => {
      const item = row as Partial<PlatformService>;
      const slug = String(item.slug || item.id || "").trim();
      if (!slug) return null;
      return {
        id: slug,
        name: String(item.name || slug),
        slug,
        icon: String(item.icon || `/categories/${slug}.png`),
        isEnabled: item.isEnabled !== false,
      } satisfies PlatformService;
    })
    .filter((row): row is PlatformService => Boolean(row));
}

export function readCachedCatalog(): PlatformService[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseCatalog(JSON.parse(raw));
    return parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedCatalog(rows: PlatformService[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // ignore quota / private mode
  }
}

export async function fetchServiceCatalog(signal?: AbortSignal): Promise<PlatformService[]> {
  const res = await fetch(`${API_URL}/services`, {
    cache: "no-store",
    signal: signal ?? AbortSignal.timeout(8000),
  });
  const json = (await res.json().catch(() => ({}))) as { data?: unknown };
  const rows = parseCatalog(json.data);
  if (rows.length) writeCachedCatalog(rows);
  return rows;
}

export function catalogMap(catalog: PlatformService[] | null) {
  return new Map((catalog ?? []).map((row) => [row.slug, row]));
}

export function isServiceEnabled(catalog: PlatformService[] | null, slug: string) {
  if (!catalog) return true;
  const row = catalog.find((item) => item.slug === slug || item.id === slug);
  return row ? row.isEnabled : true;
}

export function visibleServiceNav(catalog: PlatformService[] | null): ServiceNavItem[] {
  if (!catalog) return [...SERVICE_NAV];
  return SERVICE_NAV.filter((item) => isServiceEnabled(catalog, item.id));
}

export async function getServiceCatalog(): Promise<PlatformService[]> {
  try {
    return await fetchServiceCatalog();
  } catch {
    return readCachedCatalog() ?? [];
  }
}
