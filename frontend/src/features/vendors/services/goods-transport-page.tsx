"use client";

import { FormBackButton } from "./form-back-button";
import { goodsTransportTypeById } from "./goods-transport-data";
import { GoodsTransportRegistrationForm } from "./goods-transport-registration-form";
import { GoodsTransportTypePicker } from "./goods-transport-type-picker";

export function GoodsTransportPage({ selectedType }: { selectedType?: string }) {
  const vehicle = goodsTransportTypeById(selectedType);
  if (vehicle) {
    return <GoodsTransportRegistrationForm vehicleId={vehicle.id} vehicleName={vehicle.name} />;
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white pb-[calc(4.85rem+env(safe-area-inset-bottom))] md:h-auto md:overflow-visible">
      <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-[var(--border)] pl-12 pr-4 md:h-auto md:border-0 md:px-0 md:pb-2">
        <FormBackButton fallback="/vendors/services" />
        <h1 className="text-[17px] font-semibold tracking-tight md:text-3xl">Goods Transport</h1>
      </header>
      <GoodsTransportTypePicker
        baseHref="/vendors/services/goods-transport"
        title="Register a vehicle"
        subtitle=""
        kicker={null}
      />
    </div>
  );
}
