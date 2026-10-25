import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionalsBrowse } from "@/features/users/professionals/professionals-browse";
import { SpecialScheduleTabs } from "@/features/public-site/components/special-schedule-tabs";
import { ScheduledCabTrips } from "@/features/users/cabs/components/scheduled-cab-trips";
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
  return (
    <SpecialScheduleTabs
      service="cabs"
      serviceContent={<ProfessionalsBrowse serviceId="cabs" selectedId={pro} />}
      scheduleContent={<ScheduledCabTrips embedded />}
    />
  );
}
