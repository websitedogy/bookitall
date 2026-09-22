import { notFound } from "next/navigation";
import { getAcceptedListings } from "@/shared/lib/catalog-fetch";
import { ProfessionalsBrowse } from "@/features/users/professionals/professionals-browse";
import { getServiceCatalog, isServiceEnabled } from "@/features/services/catalog";

export async function BrowseServicePage({
  serviceId,
  searchParams,
}: {
  serviceId: string;
  searchParams: Promise<{ pro?: string; type?: string }>;
}) {
  const catalog = await getServiceCatalog();
  if (catalog.length && !isServiceEnabled(catalog, serviceId)) notFound();
  const { pro, type } = await searchParams;
  const listings = await getAcceptedListings(serviceId);
  return <ProfessionalsBrowse serviceId={serviceId} selectedId={pro} listings={listings} vehicleType={type} />;
}
