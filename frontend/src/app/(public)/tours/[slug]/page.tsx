import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { TourDetailScreen } from "@/features/users/tours/tour-detail-screen";
import { publicListingMetadata, PublicListingPage } from "@/features/seo/public-listing-route";
import { getTour } from "@/shared/lib/catalog-fetch";
import { listingIdFromSlug } from "@/shared/lib/public-paths";
import { publicPageMeta } from "@/shared/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (listingIdFromSlug(slug)) return publicListingMetadata(slug);
  const tour = await getTour(slug);
  if (!tour) return { title: "Tour", robots: { index: false, follow: false } };
  return publicPageMeta({
    title: `${tour.name} | Book It All`,
    description: (tour.description || tour.name).slice(0, 160),
    path: `/tours/${tour.slug}`,
    ogImage: tour.coverImageUrl || "/opengraph-image",
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (listingIdFromSlug(slug)) {
    return <PublicListingPage slug={slug} currentPath={`/tours/${slug}`} />;
  }
  const tour = await getTour(slug);
  if (!tour) notFound();
  if (tour.slug !== slug) permanentRedirect(`/tours/${tour.slug}`);
  return <TourDetailScreen tour={tour} />;
}
