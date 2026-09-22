import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { HotelDetailScreen } from "@/features/users/hotels/hotel-detail-screen";
import { publicListingMetadata, PublicListingPage } from "@/features/seo/public-listing-route";
import { getHotel } from "@/shared/lib/catalog-fetch";
import { listingIdFromSlug, slugify } from "@/shared/lib/public-paths";
import { publicPageMeta } from "@/shared/lib/seo";

type Props = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (listingIdFromSlug(slug)) return publicListingMetadata(slug);
  const hotel = await getHotel(slug);
  if (!hotel) return { title: "Hotel", robots: { index: false, follow: false } };
  const city = slugify(hotel.city) || "hyderabad";
  return publicPageMeta({
    title: `${hotel.name} | Book It All`,
    description: (hotel.description || `${hotel.name} in ${hotel.city}`).slice(0, 160),
    path: `/hotels/${city}/${hotel.slug}`,
    ogImage: hotel.coverImageUrl || "/opengraph-image",
  });
}

export default async function Page({ params }: Props) {
  const { city, slug } = await params;
  if (listingIdFromSlug(slug)) {
    return <PublicListingPage slug={slug} currentPath={`/hotels/${city}/${slug}`} />;
  }
  const hotel = await getHotel(slug);
  if (!hotel) notFound();
  const hotelCity = slugify(hotel.city) || "hyderabad";
  if (hotelCity !== city || hotel.slug !== slug) {
    permanentRedirect(`/hotels/${hotelCity}/${hotel.slug}`);
  }
  return <HotelDetailScreen hotel={hotel} />;
}
