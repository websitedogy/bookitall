import { categoryMetadata } from "@/features/seo/category-copy";
import { BrowseServicePage } from "@/features/seo/browse-service-page";

export const generateMetadata = () => categoryMetadata("tours");

export default function Page({ searchParams }: { searchParams: Promise<{ pro?: string }> }) {
  return <BrowseServicePage serviceId="tours" searchParams={searchParams} />;
}
