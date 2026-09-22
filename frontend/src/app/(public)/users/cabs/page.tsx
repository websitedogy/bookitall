import type { Metadata } from "next";
import { ProfessionalsBrowse } from "@/features/users/professionals/professionals-browse";

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
  return <ProfessionalsBrowse serviceId="cabs" selectedId={pro} />;
}
