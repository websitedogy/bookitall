import type { Metadata } from "next";
import { ServicesCatalog } from "@/features/home/components/services-catalog";

export const metadata: Metadata = {
  title: "Travel Services | Book It All",
  description: "Explore hotels, tours and cab services available near your selected location.",
};

export default function TravelServicesPage() {
  return (
    <ServicesCatalog
      heading="Travel services"
      serviceIds={["hotels", "tours", "public-transport"]}
      locationAware
      showHeading={false}
    />
  );
}
