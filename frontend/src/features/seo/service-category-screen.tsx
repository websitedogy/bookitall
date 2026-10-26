import type { PublicListingPost } from "@/shared/lib/catalog-fetch";
import { JsonLd } from "@/shared/ui/json-ld";
import { SITE_URL } from "@/shared/lib/site-url";
import { faqJsonLd, serviceJsonLd } from "@/features/seo/json-ld";
import { categorySeo } from "@/features/seo/category-copy";
import { NearbyProfessionals } from "@/features/catalog/nearby-listings";
import { DesktopServicesLayout, InnerPageShell } from "@/features/public-site";
import { SERVICE_NAV } from "@/features/home/service-nav";
import { PublicTransportTypePicker } from "@/features/vendors/services/public-transport-type-picker";
import { publicTransportTypeById } from "@/features/vendors/services/public-transport-data";
import { GoodsTransportTypePicker } from "@/features/vendors/services/goods-transport-type-picker";
import { goodsTransportTypeById } from "@/features/vendors/services/goods-transport-data";
import { PackersMoversTypePicker } from "@/features/vendors/services/packers-movers-type-picker";
import { packersServiceById } from "@/features/vendors/services/packers-movers-data";
import { LocalMarketChoices } from "@/features/vendors/services/local-market-choices";
import { SpecialScheduleTabs } from "@/features/public-site/components/special-schedule-tabs";
import { GoodsTransportSpecialSchedules } from "@/features/users/cabs/components/goods-transport-special-schedules";
import { ScheduledCabTrips } from "@/features/users/cabs/components/scheduled-cab-trips";

export function ServiceCategoryScreen({
  serviceId,
  listings,
  vehicleType,
}: {
  serviceId: string;
  listings: PublicListingPost[];
  vehicleType?: string;
}) {
  const seo = categorySeo(serviceId);
  const publicVehicle = publicTransportTypeById(vehicleType);
  const goodsVehicle = goodsTransportTypeById(vehicleType);
  const packersType = packersServiceById(vehicleType);
  const vehicle = serviceId === "goods-transport" ? goodsVehicle : serviceId === "packers-movers" ? packersType : publicVehicle;
  const badge =
    vehicle?.name ?? SERVICE_NAV.find((item) => item.id === serviceId)?.name ?? seo?.h1 ?? "Booking";
  const pickingType =
    ((serviceId === "public-transport" || serviceId === "goods-transport") && !vehicle) ||
    (serviceId === "packers-movers" && !packersType);
  const hasListings = listings.length > 0;
  const prices = listings.map((item) => item.unitPrice).filter((value): value is number => typeof value === "number" && value > 0);
  const low = prices.length ? Math.min(...prices) : undefined;
  const high = prices.length ? Math.max(...prices) : undefined;
  const serviceContent = (
    <>
      {serviceId === "public-transport" && publicVehicle?.id !== "auto" ? (
        <PublicTransportTypePicker
          baseHref={seo?.path || "/public-transport/hyderabad"}
          selected={publicVehicle?.id}
          compact={Boolean(vehicleType)}
          title="Choose a ride"
          subtitle="Auto, Car, Mini Bus, Bus, or Van."
        />
      ) : null}
      {serviceId === "goods-transport" ? (
        <GoodsTransportTypePicker
          baseHref={seo?.path || "/goods-transport/hyderabad"}
          selected={goodsVehicle?.id}
          compact={Boolean(vehicleType)}
          title="Choose a vehicle"
          subtitle="Tata Ace, Mini Lorry, Light / Medium / Heavy Truck, Other, or Packers & Movers."
        />
      ) : null}
      {hasListings && serviceId === "packers-movers" ? (
        <PackersMoversTypePicker
          baseHref={seo?.path || "/packers-movers/hyderabad"}
          selected={packersType?.id}
          compact={Boolean(vehicleType)}
          title="Choose a service"
          subtitle="Home, office, local or long-distance shifting."
        />
      ) : null}
      {serviceId === "cloud-kitchen" ? <LocalMarketChoices /> : null}
      {serviceId === "cloud-kitchen" && !hasListings ? null : pickingType && hasListings ? null : (
        <NearbyProfessionals category={serviceId} initialAds={listings} vehicleType={vehicleType} />
      )}
    </>
  );
  const pageContent =
    serviceId === "goods-transport" ||
    serviceId === "public-transport" ||
    serviceId === "packers-movers" ? (
      <SpecialScheduleTabs
        service={
          serviceId === "goods-transport"
            ? "goods-transport"
            : serviceId === "packers-movers"
              ? "packers-movers"
              : "cabs"
        }
        serviceContent={serviceContent}
        scheduleContent={
          serviceId === "public-transport" ? (
            <ScheduledCabTrips embedded />
          ) : (
            <GoodsTransportSpecialSchedules
              serviceCategory={
                serviceId === "packers-movers" ? "packers-movers" : "goods-transport"
              }
            />
          )
        }
      />
    ) : (
      serviceContent
    );

  return (
    <DesktopServicesLayout>
      {seo ? (
        <>
          <JsonLd
            data={serviceJsonLd({
              name: seo.h1,
              serviceType: seo.serviceType,
              url: `${SITE_URL}${seo.path}`,
              description: seo.description,
              lowPrice: low,
              highPrice: high,
            })}
          />
          {seo.faqs.length ? <JsonLd data={faqJsonLd(seo.faqs)} /> : null}
        </>
      ) : null}
      <InnerPageShell title={badge} titleStyle="badge">
        {pageContent}
      </InnerPageShell>
    </DesktopServicesLayout>
  );
}
