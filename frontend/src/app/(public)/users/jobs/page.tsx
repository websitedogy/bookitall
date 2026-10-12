import { notFound } from "next/navigation";
import { CatalogListPage } from "@/features/catalog/catalog-list-page";
import { jobConsultancyVertical } from "@/features/users/jobs";
import { getServiceCatalog, isServiceEnabled } from "@/features/services/catalog";
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
  const catalog = await getServiceCatalog();
  if (catalog.length && !isServiceEnabled(catalog, "jobs")) notFound();
  return <CatalogListPage vertical={jobConsultancyVertical} searchParams={searchParams} />;
}
