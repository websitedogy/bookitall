import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionalsBrowse } from "@/features/users/professionals/professionals-browse";
import { getServiceCatalog, isServiceEnabled } from "@/features/services/catalog";

export const metadata: Metadata = {
  title: "Cabs & car rentals",
  description: "Book a cab on Book It All. Choose a listed vendor, then add pickup and drop.",
};

export default async function CabsPage({
  searchParams,
}: {
  searchParams: Promise<{ pro?: string }>;
}) {
  const { pro } = await searchParams;
  const catalog = await getServiceCatalog();
  if (catalog.length && !isServiceEnabled(catalog, "cabs")) notFound();
  return <ProfessionalsBrowse serviceId="cabs" selectedId={pro} />;
}
