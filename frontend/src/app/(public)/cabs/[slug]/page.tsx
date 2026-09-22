import type { Metadata } from "next";
import { publicListingMetadata, PublicListingPage } from "@/features/seo/public-listing-route";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return publicListingMetadata(slug);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <PublicListingPage slug={slug} currentPath={`/cabs/${slug}`} />;
}
