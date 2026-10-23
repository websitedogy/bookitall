import type { Metadata } from "next";
import { ScheduledCabTrips } from "@/features/users/cabs/components/scheduled-cab-trips";

export const metadata: Metadata = {
  title: "Scheduled cab trips",
  description: "Find and request seats on cab trips scheduled by vendors.",
};

export default async function ScheduledCabTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ partnerId?: string; vendor?: string }>;
}) {
  const { partnerId, vendor } = await searchParams;
  return <ScheduledCabTrips partnerId={partnerId} vendor={vendor} />;
}
