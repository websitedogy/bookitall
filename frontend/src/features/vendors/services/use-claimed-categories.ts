"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAuth, useAuthHydrated } from "@/features/auth/store";

export function useClaimedCategories() {
  const token = useAuth((s) => s.accessToken);
  const ready = useAuthHydrated();
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      setClaimed(new Set());
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
        const json = await api<string[]>("/vendor-listings/claimed-categories", { token });
        if (!cancelled) setClaimed(new Set(json.data ?? []));
      } catch {
        if (!cancelled && !silent) setClaimed(new Set());
      } finally {
        if (!cancelled && !silent) setLoading(false);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(true), 12000);
    const onFocus = () => void load(true);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [ready, token]);

  return { claimed, loading: !ready || loading, signedIn: Boolean(token) };
}
