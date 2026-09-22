import { CatalogListPage } from "@/features/catalog/catalog-list-page";
import { electricianVertical } from "@/features/users/electrician";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Electrician",
  description: electricianVertical.description,
};

export default async function ElectricianPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; pro?: string }>;
}) {
  return <CatalogListPage vertical={electricianVertical} searchParams={searchParams} />;
}
