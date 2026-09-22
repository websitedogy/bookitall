"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  fetchServiceCatalog,
  isServiceEnabled,
  readCachedCatalog,
  visibleServiceNav,
  type ServiceNavItem,
} from "./catalog";
import type { PlatformService } from "./types";

type CatalogContextValue = {
  catalog: PlatformService[] | null;
  ready: boolean;
  refresh: () => Promise<void>;
  isEnabled: (slug: string) => boolean;
  visibleNav: ServiceNavItem[];
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function ServiceCatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<PlatformService[] | null>(() => readCachedCatalog());
  const [ready, setReady] = useState(() => Boolean(readCachedCatalog()));

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const rows = await fetchServiceCatalog(signal);
      if (rows.length) setCatalog(rows);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Ignore abort errors from component unmount
        return;
      }
      // keep last known catalog for other errors
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const timer = window.setInterval(() => void load(), 20000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      catalog,
      ready,
      refresh: () => load(),
      isEnabled: (slug: string) => isServiceEnabled(catalog, slug),
      visibleNav: visibleServiceNav(catalog),
    }),
    [catalog, ready, load],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useServiceCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    return {
      catalog: null,
      ready: false,
      refresh: async () => undefined,
      isEnabled: () => true,
      visibleNav: visibleServiceNav(null),
    } satisfies CatalogContextValue;
  }
  return ctx;
}

export function useVisibleServices() {
  return useServiceCatalog().visibleNav;
}
