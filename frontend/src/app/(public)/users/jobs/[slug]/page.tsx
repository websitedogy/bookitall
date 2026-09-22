import { CatalogDetailPage, catalogDetailMetadata } from "@/features/catalog/catalog-detail-page";
import { jobConsultancyVertical } from "@/features/users/jobs";

export const generateMetadata = catalogDetailMetadata(jobConsultancyVertical);

export default function JobConsultancyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CatalogDetailPage vertical={jobConsultancyVertical} params={params} />;
}
