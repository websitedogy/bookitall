import { categoryMetadata } from "@/features/seo/category-copy";
import { BrowseServicePage } from "@/features/seo/browse-service-page";

export const generateMetadata = () => categoryMetadata("hotels");

export default function Page({ searchParams }: { searchParams: Promise<{ pro?: string }> }) {
  return <BrowseServicePage serviceId="hotels" searchParams={searchParams} />;
}
