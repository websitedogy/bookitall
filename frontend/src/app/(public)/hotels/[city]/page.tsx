import { notFound, permanentRedirect } from "next/navigation";
import { BrowseServicePage } from "@/features/seo/browse-service-page";
import { getAcceptedListings, getHotel, getVendorListing } from "@/shared/lib/catalog-fetch";
import { listingCanonicalPath, listingIdFromSlug, slugify } from "@/shared/lib/public-paths";
import { publicPageMeta } from "@/shared/lib/seo";
import type { Metadata } from "next";

type Props = { params: Promise<{ city: string }>; searchParams: Promise<{ pro?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  if (city === "hyderabad") {
    return publicPageMeta({
      title: "Hotels in Hyderabad | Book It All",
      description:
        "Book hotels and resorts in Hyderabad from accepted listings. Compare nearby stays and reserve in one checkout.",
      path: "/hotels/hyderabad",
    });
  }
  const listings = await getAcceptedListings("hotels");
  const hasCity = listings.some((item) => slugify(item.location || "").includes(city));
  if (!hasCity) return { title: "Hotels", robots: { index: false, follow: false } };
  const label = city.replace(/-/g, " ");
  return publicPageMeta({
    title: `Hotels in ${label} | Book It All`,
    description: `Book hotels in ${label} on Book It All from accepted live listings.`,
    path: `/hotels/${city}`,
  });
}

export default async function Page({ params, searchParams }: Props) {
  const { city } = await params;
  const hotel = await getHotel(city);
  if (hotel) {
    permanentRedirect(`/hotels/${slugify(hotel.city) || "hyderabad"}/${hotel.slug}`);
  }
  const listingId = listingIdFromSlug(city);
  if (listingId) {
    const listing = await getVendorListing(listingId);
    if (listing) permanentRedirect(listingCanonicalPath(listing));
  }
  if (city !== "hyderabad") {
    const listings = await getAcceptedListings("hotels");
    const hasCity = listings.some((item) => slugify(item.location || "").includes(city));
    if (!hasCity) notFound();
  }
  return <BrowseServicePage serviceId="hotels" searchParams={searchParams} />;
}
