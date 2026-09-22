import { CatalogListPage } from "@/features/catalog/catalog-list-page";
import { applianceVertical } from "@/features/users/appliance";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appliance Repair",
  description: applianceVertical.description,
};

export default async function AppliancePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; pro?: string }>;
}) {
  return <CatalogListPage vertical={applianceVertical} searchParams={searchParams} />;
}
