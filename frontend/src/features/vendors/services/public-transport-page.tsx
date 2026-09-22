"use client";

import { FormBackButton } from "./form-back-button";
import { publicTransportTypeById } from "./public-transport-data";
import { PublicTransportRegistrationForm } from "./public-transport-registration-form";
import { PublicTransportTypePicker } from "./public-transport-type-picker";

export function PublicTransportPage({ selectedType }: { selectedType?: string }) {
  const vehicle = publicTransportTypeById(selectedType);
  if (vehicle) {
    return <PublicTransportRegistrationForm vehicleId={vehicle.id} vehicleName={vehicle.name} />;
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white pb-[calc(4.85rem+env(safe-area-inset-bottom))] md:h-auto md:overflow-visible">
      <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-[var(--border)] pl-12 pr-4 md:h-auto md:border-0 md:px-0 md:pb-2">
        <FormBackButton fallback="/vendors/services" />
        <h1 className="text-[17px] font-semibold tracking-tight md:text-3xl">Public Transport</h1>
      </header>
      <PublicTransportTypePicker
        baseHref="/vendors/services/public-transport"
        title="Register a vehicle"
        subtitle=""
        kicker={null}
      />
    </div>
  );
}
