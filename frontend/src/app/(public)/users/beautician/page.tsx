import { CatalogListPage } from "@/features/catalog/catalog-list-page";
import { beauticianVertical } from "@/features/users/beautician";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beauticians",
  description: beauticianVertical.description,
};

export default async function BeauticianPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; pro?: string }>;
}) {
  return <CatalogListPage vertical={beauticianVertical} searchParams={searchParams} />;
}
