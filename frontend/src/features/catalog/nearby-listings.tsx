"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { API_URL } from "@/shared/lib/api";
import { ListingThumb } from "@/shared/ui/listing-thumb";
import { PriceLabel } from "@/shared/ui/price-label";
import { getExactPosition, readSavedLocation } from "@/shared/lib/geo";

import type { PublicListingPost } from "@/shared/lib/catalog-fetch";
import { listingCanonicalPath } from "@/shared/lib/public-paths";
import { ComingSoonServices } from "@/shared/ui/coming-soon-services";
import { matchesGoodsType } from "@/features/vendors/services/goods-transport-data";
import { matchesPackersType } from "@/features/vendors/services/packers-movers-data";

function formatKm(km: number) {
  if (km < 1) return `${Math.max(100, Math.round(km * 1000))} m`;
  return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
}

function listingHref(ad: PublicListingPost) {
  return listingCanonicalPath(ad);
}

function bookHref(ad: PublicListingPost) {
  return `${listingHref(ad)}#book`;
}

function matchesVehicle(ad: PublicListingPost, vehicleType?: string, category?: string) {
  if (!vehicleType) return true;
  if (category === "goods-transport") return matchesGoodsType(ad.vehicleType, vehicleType);
  if (category === "packers-movers") return matchesPackersType(ad.serviceType, vehicleType);
  const wanted = vehicleType.trim().toLowerCase();
  return (ad.vehicleType || "").trim().toLowerCase() === wanted || (ad.vehicleType || "").trim().toLowerCase().replace(/\s+/g, "-") === wanted;
}

export function NearbyProfessionals({
  category,
  city,
  initialAds = [],
  vehicleType,
}: {
  category: string;
  city?: string;
  initialAds?: PublicListingPost[];
  vehicleType?: string;
}) {
  const [ads, setAds] = useState<PublicListingPost[]>(() =>
    vehicleType ? initialAds.filter((ad) => matchesVehicle(ad, vehicleType, category)) : initialAds,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let lat = "";
      let lng = "";
      const saved = readSavedLocation();
      if (saved?.lat != null && saved.lng != null) {
        lat = String(saved.lat);
        lng = String(saved.lng);
      } else {
        try {
          const pos = await getExactPosition(12000);
          lat = String(pos.coords.latitude);
          lng = String(pos.coords.longitude);
        } catch {
          // Still load accepted listings without GPS.
        }
      }
      const params = new URLSearchParams({ category });
      if (lat) params.set("lat", lat);
      if (lng) params.set("lng", lng);
      if (city) params.set("city", city);
      const res = await fetch(`${API_URL}/vendor-listings?${params.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as { data?: PublicListingPost[] };
      if (!cancelled) {
        const rows = Array.isArray(json.data) ? json.data : [];
        setAds(vehicleType ? rows.filter((ad) => matchesVehicle(ad, vehicleType, category)) : rows);
      }
      if (!cancelled) setLoading(false);
    }
    load().catch(() => {
      if (!cancelled) {
        if (!initialAds.length) setAds([]);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [category, city, initialAds.length, vehicleType]);

  if (loading) {
    return (
      <div className="space-y-2.5 px-3 py-3 md:px-7 md:pb-7">
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
    );
  }

  if (!ads.length) {
    return <ComingSoonServices category={category} />;
  }

  return (
    <ul className="space-y-2.5 px-3 py-3 md:px-7 md:pb-7">
      {ads.map((ad) => {
        const href = listingHref(ad);
        const book = bookHref(ad);
        return (
          <li key={ad.id}>
            <article className="flex items-center gap-3.5 rounded-2xl bg-white px-3 py-3 ring-1 ring-[var(--studio-line)] transition md:hover:ring-[var(--primary)]/25">
              <Link href={href} className="relative h-14 w-[4.75rem] shrink-0 overflow-hidden rounded-xl bg-[var(--studio)] ring-1 ring-[var(--studio-line)]">
                <ListingThumb src={ad.image} categoryId={ad.categoryId || category} alt={ad.title} className="h-full w-full object-cover object-center" />
              </Link>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <Link href={href} className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold tracking-tight text-[var(--studio-ink)]">{ad.title}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-[var(--studio-muted)]">
                    {[ad.vehicleType, ad.loadCapacity, ad.serviceType].filter(Boolean).join(" · ") || ad.category || ad.vendor}
                  </span>
                  {ad.location || ad.distanceKm != null ? (
                    <span className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[var(--studio-muted)]">
                      <MapPin className="h-3 w-3 shrink-0 text-[var(--primary)]" aria-hidden />
                      <span className="truncate">{ad.location}</span>
                      {ad.distanceKm != null ? <span className="shrink-0 tabular-nums">· {formatKm(ad.distanceKm)}</span> : null}
                    </span>
                  ) : null}
                </Link>
                <span className="flex shrink-0 flex-col items-end gap-2">
                  {ad.priceLabel ? <PriceLabel label={ad.priceLabel} /> : null}
                  <Link
                    href={book}
                    className="inline-flex h-8 items-center justify-center rounded-full bg-[var(--primary)] px-3 text-[11px] font-semibold text-white"
                  >
                    Book now
                  </Link>
                </span>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
