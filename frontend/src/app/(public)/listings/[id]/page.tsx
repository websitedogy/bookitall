import type { Metadata } from "next";
import { redirectListingById } from "@/features/seo/public-listing-route";
import { ListingDetailView } from "@/features/catalog/listing-detail";
import { NOINDEX } from "@/shared/lib/seo";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Listing",
  ...NOINDEX,
};

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  await redirectListingById(id);
  return <ListingDetailView id={id} />;
}
