import { CatalogListPage } from "@/features/catalog/catalog-list-page";
import { cleaningVertical } from "@/features/users/cleaning";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "House Cleaning",
  description: cleaningVertical.description,
};

export default async function CleaningPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; pro?: string }>;
}) {
  return <CatalogListPage vertical={cleaningVertical} searchParams={searchParams} />;
}
