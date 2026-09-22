import { CatalogListPage } from "@/features/catalog/catalog-list-page";
import { paintingVertical } from "@/features/users/painting";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painting",
  description: paintingVertical.description,
};

export default async function PaintingPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; pro?: string }>;
}) {
  return <CatalogListPage vertical={paintingVertical} searchParams={searchParams} />;
}
