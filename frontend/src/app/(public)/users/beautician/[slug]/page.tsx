import { CatalogDetailPage, catalogDetailMetadata } from "@/features/catalog/catalog-detail-page";
import { beauticianVertical } from "@/features/users/beautician";

export const generateMetadata = catalogDetailMetadata(beauticianVertical);

export default function BeauticianDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CatalogDetailPage vertical={beauticianVertical} params={params} />;
}
