import type { ReactNode } from "react";
import { NearbyProfessionals } from "@/features/catalog/nearby-listings";
import { ProfessionalPreview } from "@/features/users/professionals/professionals-screen";
import { PROFESSIONAL_META, type Professional } from "@/features/users/professionals/data";
import { DesktopServicesLayout, InnerPageShell } from "@/features/public-site";
import type { PublicListingPost } from "@/shared/lib/catalog-fetch";
import { categorySeo } from "@/features/seo/category-copy";
import { ServiceCategoryScreen } from "@/features/seo/service-category-screen";

export function ProfessionalsBrowse({
  serviceId,
  apiItems = [],
  selectedId,
  extra,
  listings = [],
  vehicleType,
}: {
  serviceId: string;
  apiItems?: Professional[];
  selectedId?: string;
  extra?: ReactNode;
  listings?: PublicListingPost[];
  vehicleType?: string;
}) {
  const selected = selectedId ? apiItems.find((item) => item.id === selectedId) : undefined;
  const seo = categorySeo(serviceId);

  if (selected) {
    return <ProfessionalPreview serviceId={serviceId} item={selected} />;
  }

  if (seo) {
    return (
      <>
        <ServiceCategoryScreen serviceId={serviceId} listings={listings} vehicleType={vehicleType} />
        {extra ? <div className="px-4 pb-8 md:mt-6 md:px-7">{extra}</div> : null}
      </>
    );
  }

  const meta = PROFESSIONAL_META[serviceId];
  return (
    <DesktopServicesLayout>
      <InnerPageShell title={meta?.bookingTitle ?? "Booking"} titleStyle="badge">
        <NearbyProfessionals category={serviceId} initialAds={listings} />
        {extra ? <div className="px-4 pb-8 md:mt-6 md:px-7">{extra}</div> : null}
      </InnerPageShell>
    </DesktopServicesLayout>
  );
}
