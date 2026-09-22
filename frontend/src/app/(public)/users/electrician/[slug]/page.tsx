import { CatalogDetailPage, catalogDetailMetadata } from "@/features/catalog/catalog-detail-page";
import { electricianVertical } from "@/features/users/electrician";

export const generateMetadata = catalogDetailMetadata(electricianVertical);

export default function ElectricianDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CatalogDetailPage vertical={electricianVertical} params={params} />;
}
