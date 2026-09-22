import type { Metadata } from "next";
import { ProfessionalsBrowse } from "@/features/users/professionals/professionals-browse";

export const metadata: Metadata = {
  title: "Tours & packages",
  description: "Book guided tours and travel packages on Book It All.",
};

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<{ pro?: string }>;
}) {
  const { pro } = await searchParams;
  return <ProfessionalsBrowse serviceId="tours" selectedId={pro} />;
}
