import { CatalogDetailPage, catalogDetailMetadata } from "@/features/catalog/catalog-detail-page";
import { acRepairVertical } from "@/features/users/ac";

export const generateMetadata = catalogDetailMetadata(acRepairVertical);

export default function AcRepairDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CatalogDetailPage vertical={acRepairVertical} params={params} />;
}
