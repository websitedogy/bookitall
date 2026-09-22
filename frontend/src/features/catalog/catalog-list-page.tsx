import type { HomeVertical } from "@/shared/lib/service-verticals";
import { ProfessionalsBrowse } from "@/features/users/professionals/professionals-browse";
import { getAcceptedListings } from "@/shared/lib/catalog-fetch";

export async function CatalogListPage({
  vertical,
  searchParams,
}: {
  vertical: HomeVertical;
  searchParams: Promise<{ city?: string; pro?: string }>;
}) {
  const { pro } = await searchParams;
  const listings = await getAcceptedListings(vertical.id);

  return <ProfessionalsBrowse serviceId={vertical.id} selectedId={pro} listings={listings} />;
}
