import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicListingMetadata, PublicListingPage } from "@/features/seo/public-listing-route";
import { CatalogDetailPage, catalogDetailMetadata } from "@/features/catalog/catalog-detail-page";
import { serviceIdFromFolder } from "@/features/seo/service-folders";
import { HOME_VERTICALS } from "@/shared/lib/service-verticals";
import { listingIdFromSlug } from "@/shared/lib/public-paths";

type Props = { params: Promise<{ service: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service, slug } = await params;
  const id = serviceIdFromFolder(service);
  if (!id) return { title: "Listing" };
  if (listingIdFromSlug(slug)) return publicListingMetadata(slug);
  const vertical = HOME_VERTICALS.find((item) => item.id === id);
  if (!vertical) return { title: "Listing" };
  return catalogDetailMetadata(vertical)({ params: Promise.resolve({ slug }) });
}

export default async function Page({ params }: Props) {
  const { service, slug } = await params;
  const id = serviceIdFromFolder(service);
  if (!id) notFound();
  if (listingIdFromSlug(slug)) {
    return <PublicListingPage slug={slug} currentPath={`/${service}/hyderabad/${slug}`} />;
  }
  const vertical = HOME_VERTICALS.find((item) => item.id === id);
  if (!vertical) notFound();
  return <CatalogDetailPage vertical={vertical} params={Promise.resolve({ slug })} />;
}
