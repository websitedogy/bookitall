import { CatalogDetailPage, catalogDetailMetadata } from "@/features/catalog/catalog-detail-page";
import { plumberVertical } from "@/features/users/plumber";

export const generateMetadata = catalogDetailMetadata(plumberVertical);

export default function PlumberDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CatalogDetailPage vertical={plumberVertical} params={params} />;
}
