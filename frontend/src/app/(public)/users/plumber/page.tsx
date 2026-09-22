import { CatalogListPage } from "@/features/catalog/catalog-list-page";
import { plumberVertical } from "@/features/users/plumber";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plumber",
  description: plumberVertical.description,
};

export default async function PlumberPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; pro?: string }>;
}) {
  return <CatalogListPage vertical={plumberVertical} searchParams={searchParams} />;
}
