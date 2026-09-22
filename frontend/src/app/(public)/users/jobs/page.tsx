import { CatalogListPage } from "@/features/catalog/catalog-list-page";
import { jobConsultancyVertical } from "@/features/users/jobs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job Consultancy",
  description: jobConsultancyVertical.description,
};

export default async function JobConsultancyPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; pro?: string }>;
}) {
  return <CatalogListPage vertical={jobConsultancyVertical} searchParams={searchParams} />;
}
