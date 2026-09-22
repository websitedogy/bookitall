import { CatalogDetailPage, catalogDetailMetadata } from "@/features/catalog/catalog-detail-page";
import { cleaningVertical } from "@/features/users/cleaning";

export const generateMetadata = catalogDetailMetadata(cleaningVertical);

export default function CleaningDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CatalogDetailPage vertical={cleaningVertical} params={params} />;
}
