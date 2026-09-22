"use client";

import { AcRegistrationForm } from "./ac-registration-form";
import { ApplianceRegistrationForm } from "./appliance-registration-form";
import { BeauticianRegistrationForm } from "./beautician-registration-form";
import { CabRegistrationForm } from "./cab-registration-form";
import { CarpenterRegistrationForm } from "./carpenter-registration-form";
import { CleaningRegistrationForm } from "./cleaning-registration-form";
import { ElectricianRegistrationForm } from "./electrician-registration-form";
import { StayVendorPage } from "./stay-vendor-page";
import { ListingWizard } from "./listing-wizard";
import { PaintingRegistrationForm } from "./painting-registration-form";
import { PlumberRegistrationForm } from "./plumber-registration-form";
import { ToursRegistrationForm } from "./tours-registration-form";
import { PublicTransportPage } from "./public-transport-page";
import { GoodsTransportPage } from "./goods-transport-page";
import { PackersMoversRegistrationForm } from "./packers-movers-registration-form";
import { CloudKitchenRegistrationForm } from "./cloud-kitchen-registration-form";
import { ClaimedServiceGuard } from "./claimed-service-guard";
import type { VendorFormConfig } from "./vendor-form-config";

export function VendorListingForm({ config, selectedType }: { config: VendorFormConfig; selectedType?: string }) {
  const form =
    config.id === "electrician" ? (
      <ElectricianRegistrationForm />
    ) : config.id === "plumber" ? (
      <PlumberRegistrationForm />
    ) : config.id === "cleaning" ? (
      <CleaningRegistrationForm />
    ) : config.id === "ac" ? (
      <AcRegistrationForm />
    ) : config.id === "carpenter" ? (
      <CarpenterRegistrationForm />
    ) : config.id === "painting" ? (
      <PaintingRegistrationForm />
    ) : config.id === "appliance" ? (
      <ApplianceRegistrationForm />
    ) : config.id === "beautician" ? (
      <BeauticianRegistrationForm />
    ) : config.id === "cabs" ? (
      <CabRegistrationForm />
    ) : config.id === "hotels" ? (
      <StayVendorPage />
    ) : config.id === "tours" ? (
      <ToursRegistrationForm />
    ) : config.id === "public-transport" ? (
      <PublicTransportPage selectedType={selectedType} />
    ) : config.id === "goods-transport" ? (
      <GoodsTransportPage selectedType={selectedType} />
    ) : config.id === "packers-movers" ? (
      <PackersMoversRegistrationForm />
    ) : config.id === "cloud-kitchen" ? (
      <CloudKitchenRegistrationForm />
    ) : (
      <ListingWizard config={config} />
    );

  return <ClaimedServiceGuard category={config.id}>{form}</ClaimedServiceGuard>;
}
