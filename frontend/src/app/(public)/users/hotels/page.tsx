import type { Metadata } from "next";
import { ProfessionalsBrowse } from "@/features/users/professionals/professionals-browse";

export const metadata: Metadata = {
  title: "Hotels & resorts",
  description: "Book hotels and resorts across Hyderabad, Goa, Kerala and more on Book It All.",
};

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ pro?: string }>;
}) {
  const { pro } = await searchParams;
  return <ProfessionalsBrowse serviceId="hotels" selectedId={pro} />;
}
