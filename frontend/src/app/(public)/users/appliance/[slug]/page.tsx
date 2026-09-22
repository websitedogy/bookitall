import { CatalogDetailPage, catalogDetailMetadata } from "@/features/catalog/catalog-detail-page";
import { applianceVertical } from "@/features/users/appliance";

export const generateMetadata = catalogDetailMetadata(applianceVertical);

export default function ApplianceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CatalogDetailPage vertical={applianceVertical} params={params} />;
}
