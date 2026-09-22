"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/store";
import { api, ApiError } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { ListingBookingCard } from "@/features/cart/listing-booking-card";
import { listingSlides, PhotoCarousel } from "./photo-carousel";
import { ListingInfoTabs } from "./listing-info-tabs";
import { trackViewItem } from "@/shared/lib/analytics";
import { listingCanonicalPath, publicBrowsePath } from "@/shared/lib/public-paths";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { categorySeo } from "@/features/seo/category-copy";
import { SERVICE_NAV } from "@/features/home/service-nav";
import { InnerPageShell } from "@/features/public-site";

export type ListingDetail = {
  id: string;
  categoryId: string;
  category: string;
  title: string;
  vendor: string;
  location: string;
  image: string;
  status: string;
  mobileNumber?: string | null;
  photoUrls?: string[];
  description?: string;
  price?: string;
  priceUnit?: string;
  unitPrice?: number | null;
  bookable?: boolean;
  isOwner?: boolean;
  details?: { key: string; label: string; value: string }[];
};

const HIDE_DETAIL = new Set([
  "description",
  "listedBy",
  "coords",
  "latitude",
  "longitude",
  "servicesCount",
  "serviceCount",
  "licenseDocument",
  "rcDocument",
  "insuranceDocument",
  "pucDocument",
  "permitDocument",
  "ownerSame",
]);

function listingCrumbs(listing: ListingDetail) {
  const browseHref = publicBrowsePath(listing.categoryId);
  const seo = categorySeo(listing.categoryId);
  const categoryName = seo?.h1.replace(/ in Hyderabad$/, "") || listing.category;
  const items = [{ name: "Home", href: "/" }];
  if (listing.categoryId === "hotels") {
    items.push({ name: "Hotels", href: "/hotels" }, { name: "Hyderabad", href: "/hotels/hyderabad" });
  } else if (listing.categoryId === "tours") {
    items.push({ name: "Tours", href: "/tours" });
  } else if (listing.categoryId === "cabs") {
    items.push({ name: "Cabs", href: "/cabs" });
  } else if (browseHref.includes("/hyderabad")) {
    items.push({ name: categoryName, href: browseHref }, { name: "Hyderabad", href: browseHref });
  } else {
    items.push({ name: listing.category, href: browseHref });
  }
  items.push({ name: listing.title, href: listingCanonicalPath(listing) });
  return items;
}

function statusCopy(status: string) {
  if (status === "ACCEPTED") return { text: "Live", hint: "Accepted and open for booking.", className: "bg-[#1d4a3f] text-[#c8f0e4]" };
  if (status === "HOLD") return { text: "Hold", hint: "This vendor is on hold.", className: "bg-[#5c4316] text-[#f6e7c2]" };
  if (status === "REJECTED") return { text: "Rejected", hint: "Admin rejected this listing.", className: "bg-[#5c1d1d] text-[#f8d0d0]" };
  return { text: "Pending", hint: "Waiting for admin review.", className: "bg-[#5c4316] text-[#f6e7c2]" };
}

function serviceBadgeTitle(categoryId?: string, fallback?: string) {
  return SERVICE_NAV.find((item) => item.id === categoryId)?.name ?? fallback ?? "Booking";
}

function ListingPageChrome({
  title,
  breadcrumbs,
  children,
}: {
  title: string;
  breadcrumbs?: ReactNode;
  children: ReactNode;
}) {
  return (
    <InnerPageShell title={title} titleStyle="badge" breadcrumbs={breadcrumbs}>
      {children}
    </InnerPageShell>
  );
}

export function ListingDetailView({ id, initial }: { id: string; initial?: ListingDetail | null }) {
  const token = useAuth((s) => s.accessToken);
  const [listing, setListing] = useState<ListingDetail | null>(initial ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial && !token) return;
    let cancelled = false;
    api<ListingDetail>(`/vendor-listings/${id}`, { token: token || undefined })
      .then((res) => {
        if (!cancelled) setListing(res.data ?? null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          if (!initial) setListing(null);
          setError(err instanceof ApiError && err.status === 404 ? "not-found" : err instanceof Error ? err.message : "Could not load listing");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, token, initial]);

  useEffect(() => {
    if (!listing || listing.status !== "ACCEPTED") return;
    trackViewItem({
      item_id: listing.id,
      item_name: listing.title,
      item_category: listing.categoryId,
      value: listing.unitPrice ?? undefined,
    });
  }, [listing]);

  useEffect(() => {
    if (!listing || typeof window === "undefined") return;
    if (window.location.hash !== "#book") return;
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [listing]);

  const shellTitle = serviceBadgeTitle(listing?.categoryId ?? initial?.categoryId, listing?.category ?? initial?.category);

  if (loading) {
    return (
      <ListingPageChrome title={shellTitle}>
        <div className="h-[min(48vh,420px)] animate-pulse bg-[#12241f] md:h-[min(56vh,480px)] md:rounded-[28px]" />
      </ListingPageChrome>
    );
  }

  if (error === "not-found" || !listing) {
    return (
      <ListingPageChrome title={shellTitle}>
        <div className="mx-4 my-10 rounded-[28px] bg-[#fffdf8] px-5 py-12 text-center ring-1 ring-[#e6dcc8]">
          <p className="text-lg font-semibold text-[#12241f]">Listing not available</p>
          <p className="mt-2 text-sm text-[#5b6e68]">It is pending, rejected, or no longer live.</p>
          <Link href="/" className="mt-5 inline-flex h-11 items-center rounded-full bg-[#0f766e] px-5 text-sm font-semibold text-white">
            Back home
          </Link>
        </div>
      </ListingPageChrome>
    );
  }

  const badge = statusCopy(listing.status);
  const photos = listingSlides(listing.photoUrls, listing.image);
  const phoneDigits = listing.mobileNumber?.replace(/\D/g, "") ?? "";
  const rows = (listing.details ?? []).filter((item) => {
    if (HIDE_DETAIL.has(item.key)) return false;
    if (item.key === "servicesOffered" && /^\d+\s*(services?)?$/i.test(item.value.trim())) return false;
    if (phoneDigits && (item.key === "phone" || item.key === "mobileNumber") && item.value.replace(/\D/g, "") === phoneDigits) {
      return false;
    }
    return true;
  });
  const detailRows = listing.mobileNumber
    ? [{ key: "phone", label: "Phone", value: listing.mobileNumber }, ...rows]
    : rows;
  const crumbs = listingCrumbs(listing);

  return (
    <ListingPageChrome title={shellTitle} breadcrumbs={<Breadcrumbs items={crumbs} visual={false} />}>
    <div className="overflow-x-hidden pb-4">
      <article className="lg:grid lg:grid-cols-[1.45fr_0.9fr] lg:items-start lg:gap-7">
      <div className="relative w-full overflow-hidden md:rounded-[28px]">
        <PhotoCarousel
          photos={photos}
          fallback={listing.image}
          categoryId={listing.categoryId}
          title={listing.title}
          variant="hero"
        />
      </div>

      <aside
        id="book"
        className="relative z-10 mx-3 mt-4 overflow-hidden rounded-[28px] bg-[#fffdf8] shadow-[0_18px_40px_-28px_rgba(7,22,20,0.35)] ring-1 ring-[#e6dcc8] md:mx-0 md:mt-5 lg:mt-0 lg:sticky lg:top-24"
      >
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 text-left text-[22px] font-semibold tracking-[-0.03em] text-[#12241f] md:text-[26px]">{listing.title}</h1>
            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", badge.className)}>
              {badge.text}
            </span>
          </div>
        </div>
        <ListingInfoTabs
          listingId={listing.id}
          listingTitle={listing.title}
          categoryId={listing.categoryId}
          location={listing.location}
          description={listing.description}
          rows={detailRows}
        >
          {listing.isOwner ? (
            <p className="mb-4 rounded-2xl bg-[#f4efe4] px-3 py-2 text-sm text-[#5b6e68]">
              {listing.status === "ACCEPTED"
                ? "This is your post. Nearby customers can book it."
                : "This is your post. Customers see it after admin accepts."}
            </p>
          ) : null}
          <ListingBookingCard listing={listing} />
        </ListingInfoTabs>
      </aside>
      </article>
    </div>
    </ListingPageChrome>
  );
}
