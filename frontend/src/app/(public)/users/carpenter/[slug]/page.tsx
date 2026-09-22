import { CatalogDetailPage, catalogDetailMetadata } from "@/features/catalog/catalog-detail-page";
import { carpenterVertical } from "@/features/users/carpenter";

export const generateMetadata = catalogDetailMetadata(carpenterVertical);

export default function CarpenterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CatalogDetailPage vertical={carpenterVertical} params={params} />;
}
