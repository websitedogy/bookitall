"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Pencil } from "lucide-react";
import { api, ApiError } from "@/shared/lib/api";
import { ListingThumb } from "@/shared/ui/listing-thumb";
import { PriceLabel } from "@/shared/ui/price-label";
import { cn } from "@/shared/lib/cn";
import { useAuth, useAuthHydrated } from "@/features/auth/store";
import { readSavedLocation } from "@/shared/lib/geo";

type Post = {
  id: string;
  categoryId: string;
  category: string;
  title: string;
  vendor: string;
  location: string;
  image: string;
  href: string;
  status?: string;
  priceLabel?: string;
  distanceKm?: number | null;
};

function statusText(status?: string) {
  if (status === "ACCEPTED") return { text: "Accepted", className: "bg-emerald-50 text-emerald-700" };
  if (status === "HOLD") return { text: "Hold", className: "bg-amber-50 text-amber-800" };
  if (status === "REJECTED") return { text: "Rejected", className: "bg-red-50 text-red-600" };
  return { text: "Pending", className: "bg-amber-50 text-amber-800" };
}

function formatKm(km: number) {
  if (km < 1) return `${Math.max(100, Math.round(km * 1000))} m`;
  return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
}

export function VendorPostsFeed({ compact = false }: { compact?: boolean }) {
  const token = useAuth((s) => s.accessToken);
  const ready = useAuthHydrated();
  const [ads, setAds] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load(silent = false) {
      if (!token) {
        setAds([]);
        setError("");
        setLoading(false);
        return;
      }
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const saved = readSavedLocation();
        const params = new URLSearchParams();
        if (saved?.lat != null && saved.lng != null) {
          params.set("lat", String(saved.lat));
          params.set("lng", String(saved.lng));
        }
        const qs = params.toString();
        const path = `/vendor-listings/mine${qs ? `?${qs}` : ""}`;
        const json = await api<Post[]>(path, { token, signal: AbortSignal.timeout(12000) });
        if (!cancelled) {
          setAds(Array.from(json.data ?? []));
          setError("");
        }
      } catch (err: unknown) {
        if (!cancelled && !silent) {
          setAds([]);
          setError(err instanceof ApiError && err.status === 401 ? "sign-in" : err instanceof Error ? err.message : "Could not load posts");
        }
      } finally {
        if (!cancelled && !silent) setLoading(false);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(true), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [ready, token]);

  return (
    <div>
      {compact ? null : (
        <div className="flex items-center justify-between px-4 pt-3 md:px-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            {loading ? "My Services" : `${ads.length} ${ads.length === 1 ? "service" : "services"}`}
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2.5 px-3 py-3 md:px-7">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex items-center gap-3.5 rounded-2xl bg-white px-3 py-3 ring-1 ring-[var(--studio-line)]">
              <span className="h-14 w-[4.75rem] shrink-0 animate-pulse rounded-xl bg-[var(--studio)]" />
              <span className="min-w-0 flex-1 space-y-2">
                <span className="block h-3.5 w-2/3 animate-pulse rounded bg-[var(--studio)]" />
                <span className="block h-3 w-1/3 animate-pulse rounded bg-[var(--studio)]" />
              </span>
            </div>
          ))}
        </div>
      ) : error === "sign-in" || (!token && ready) ? (
        <div className="px-4 py-8 md:px-0">
          <Link href="/login?next=/vendors/posts" className="text-sm font-medium text-[var(--primary)]">
            Sign in
          </Link>
        </div>
      ) : error ? (
        <p className="px-4 py-8 text-sm text-slate-500 md:px-0">Could not load services</p>
      ) : ads.length === 0 ? (
        <div className="px-4 py-8 md:px-0">
          <Link href="/vendors/services" className="text-sm font-medium text-[var(--primary)]">
            Place Register
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5 px-3 py-3 md:px-7 md:pb-7">
          {ads.map((ad) => {
            const badge = statusText(ad.status);
            return (
              <li key={ad.id}>
                <div className="flex w-full items-center gap-3.5 rounded-2xl bg-white px-3 py-3 text-left ring-1 ring-[var(--studio-line)] transition md:hover:ring-[var(--primary)]/25">
                  <Link href={ad.status === "ACCEPTED" && ad.href ? ad.href : `/listings/${ad.id}`} className="flex min-w-0 flex-1 items-center gap-3.5">
                  <span className="relative h-14 w-[4.75rem] shrink-0 overflow-hidden rounded-xl bg-[var(--studio)] ring-1 ring-[var(--studio-line)]">
                    <ListingThumb src={ad.image} categoryId={ad.categoryId} className="h-full w-full object-cover object-center" />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold tracking-tight text-[var(--studio-ink)]">{ad.title}</span>
                      <span className="mt-0.5 block truncate text-[13px] text-[var(--studio-muted)]">{ad.category || ad.vendor}</span>
                      {ad.location ? (
                        <span className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[var(--studio-muted)]">
                          <MapPin className="h-3 w-3 shrink-0 text-[var(--primary)]" aria-hidden />
                          <span className="truncate">{ad.location}</span>
                          {ad.distanceKm != null ? <span className="shrink-0 tabular-nums">· {formatKm(ad.distanceKm)}</span> : null}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      {ad.priceLabel ? <PriceLabel label={ad.priceLabel} /> : null}
                      <span className={cn("rounded-full px-1.5 py-px text-[8px] font-semibold uppercase leading-none tracking-normal", badge.className)}>{badge.text}</span>
                    </span>
                  </span>
                  </Link>
                  <Link href={`/vendors/posts/${ad.id}/edit`} aria-label={`Edit ${ad.title}`} title="Edit service" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--primary)] ring-1 ring-[var(--border)] transition hover:bg-[var(--primary-soft)]">
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
