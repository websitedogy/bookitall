import { CatalogListPage } from "@/features/catalog/catalog-list-page";
import { carpenterVertical } from "@/features/users/carpenter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carpenter",
  description: carpenterVertical.description,
};

export default async function CarpenterPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; pro?: string }>;
}) {
  return <CatalogListPage vertical={carpenterVertical} searchParams={searchParams} />;
}
