import { notFound } from "next/navigation";
import { categoryMetadata } from "@/features/seo/category-copy";
import { CabBookingFlow } from "@/features/users/cabs/components/cab-quote-form";
import { ScheduledCabTrips } from "@/features/users/cabs/components/scheduled-cab-trips";
import { getServiceCatalog, isServiceEnabled } from "@/features/services/catalog";

export const generateMetadata = () => categoryMetadata("cabs");

export default async function Page() {
  const catalog = await getServiceCatalog();
  if (catalog.length && !isServiceEnabled(catalog, "cabs")) notFound();
  return (
    <>
      <CabBookingFlow />
      <ScheduledCabTrips />
    </>
  );
}
