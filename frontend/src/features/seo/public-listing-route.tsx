import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ListingDetailView, type ListingDetail } from "@/features/catalog/listing-detail";
import { getVendorListing } from "@/shared/lib/catalog-fetch";
import { listingCanonicalPath, listingIdFromSlug } from "@/shared/lib/public-paths";
import { publicPageMeta } from "@/shared/lib/seo";
import { categorySeo } from "@/features/seo/category-copy";

function asDetail(listing: NonNullable<Awaited<ReturnType<typeof getVendorListing>>>): ListingDetail {
  return {
    id: listing.id,
    categoryId: listing.categoryId,
    category: listing.category || listing.categoryId,
    title: listing.title,
    vendor: listing.vendor,
    location: listing.location,
    image: listing.image,
    status: listing.status || "ACCEPTED",
    mobileNumber: listing.mobileNumber,
    photoUrls: listing.photoUrls,
    description: listing.description,
    unitPrice: listing.unitPrice,
    priceUnit: listing.priceUnit,
    bookable: listing.bookable,
  };
}

export async function publicListingMetadata(slug: string): Promise<Metadata> {
  const id = listingIdFromSlug(slug) ?? slug;
  const listing = await getVendorListing(id);
  if (!listing) return { title: "Listing", robots: { index: false, follow: false } };
  const path = listingCanonicalPath(listing);
  const seo = categorySeo(listing.categoryId);
  const description = listing.description?.trim() || `${listing.title} — ${seo?.serviceType ?? listing.category} on Book It All.`;
  return publicPageMeta({
    title: `${listing.title} | Book It All`,
    description: description.slice(0, 160),
    path,
  });
}

export async function PublicListingPage({
  slug,
  currentPath,
}: {
  slug: string;
  currentPath: string;
}) {
  const id = listingIdFromSlug(slug) ?? slug;
  const listing = await getVendorListing(id);
  if (!listing) notFound();
  const canonical = listingCanonicalPath(listing);
  if (canonical !== currentPath) {
    permanentRedirect(canonical);
  }
  return <ListingDetailView id={listing.id} initial={asDetail(listing)} />;
}

export async function redirectListingById(id: string) {
  const listing = await getVendorListing(id);
  if (!listing) return;
  const path = listingCanonicalPath(listing);
  if (path === `/listings/${id}`) return;
  permanentRedirect(path);
}
