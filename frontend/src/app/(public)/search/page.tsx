import type { Metadata } from "next";
import { SearchResults } from "@/features/public-site/components/search-results";
import { publicApi } from "@/shared/lib/api";
import type { PublicListingPost } from "@/shared/lib/catalog-fetch";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();
  return {
    title: query ? `Search “${query}” · Book It All` : "Search · Book It All",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  let listings: PublicListingPost[] = [];
  if (query) {
    const result = await publicApi<PublicListingPost[]>(`/vendor-listings?q=${encodeURIComponent(query)}`).catch(() => ({
      data: [] as PublicListingPost[],
    }));
    listings = result.data ?? [];
  }
  return <SearchResults query={query} listings={listings} />;
}
