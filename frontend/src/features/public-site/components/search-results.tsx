import Link from "next/link";
import { MapPin } from "lucide-react";
import type { PublicListingPost } from "@/shared/lib/catalog-fetch";
import { listingCanonicalPath } from "@/shared/lib/public-paths";
import { ListingThumb } from "@/shared/ui/listing-thumb";
import { PriceLabel } from "@/shared/ui/price-label";

export function SearchResults({ query, listings }: { query: string; listings: PublicListingPost[] }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text)]">
        {query ? `Results for “${query}”` : "Search"}
      </h1>
      <p className="mt-1 text-[13px] text-[var(--text-muted)]">
        {query
          ? `${listings.length} similar ${listings.length === 1 ? "listing" : "listings"}`
          : "Type a hotel, service, or place in the search bar."}
      </p>
      {listings.length ? (
        <ul className="mt-4 space-y-2.5">
          {listings.map((ad) => {
            const href = listingCanonicalPath(ad);
            return (
              <li key={ad.id}>
                <Link
                  href={href}
                  className="flex items-center gap-3.5 rounded-2xl bg-white px-3 py-3 ring-1 ring-[var(--border)] transition hover:ring-[var(--primary)]/30"
                >
                  <span className="h-14 w-[4.75rem] shrink-0 overflow-hidden rounded-xl bg-[var(--studio)]">
                    <ListingThumb src={ad.image} categoryId={ad.categoryId} alt={ad.title} className="h-full w-full object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-[var(--text)]">{ad.title}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-[var(--text-muted)]">{ad.category}</span>
                    {ad.location ? (
                      <span className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[var(--text-muted)]">
                        <MapPin className="h-3 w-3 shrink-0 text-[var(--primary)]" aria-hidden />
                        <span className="truncate">{ad.location}</span>
                      </span>
                    ) : null}
                  </span>
                  {ad.priceLabel ? <PriceLabel label={ad.priceLabel} /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : query ? (
        <p className="mt-6 rounded-2xl bg-white px-4 py-6 text-[14px] text-[var(--text-muted)] ring-1 ring-[var(--border)]">
          Nothing matches “{query}” yet. Try a shorter word, like the hotel or service name.
        </p>
      ) : null}
    </section>
  );
}
