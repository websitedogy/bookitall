import { CatalogListPage } from "@/features/catalog/catalog-list-page";
import { acRepairVertical } from "@/features/users/ac";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AC Repair",
  description: acRepairVertical.description,
};

export default async function AcRepairPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; pro?: string }>;
}) {
  return <CatalogListPage vertical={acRepairVertical} searchParams={searchParams} />;
}
