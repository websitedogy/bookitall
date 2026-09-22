import { CatalogDetailPage, catalogDetailMetadata } from "@/features/catalog/catalog-detail-page";
import { paintingVertical } from "@/features/users/painting";

export const generateMetadata = catalogDetailMetadata(paintingVertical);

export default function PaintingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CatalogDetailPage vertical={paintingVertical} params={params} />;
}
