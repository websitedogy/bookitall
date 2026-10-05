"use client";

import { ClaimedServiceGuard } from "./claimed-service-guard";
import { CloudKitchenRegistrationForm } from "./cloud-kitchen-registration-form";
import { FormBackButton } from "./form-back-button";
import { LocalMarketChoices } from "./local-market-choices";
import { LocalShopsRegistrationForm } from "./local-shops-registration-form";

export function LocalMarketPage({ selectedType }: { selectedType?: string }) {
  if (selectedType === "cloud-kitchen") {
    return (
      <ClaimedServiceGuard category="cloud-kitchen">
        <CloudKitchenRegistrationForm />
      </ClaimedServiceGuard>
    );
  }

  if (selectedType === "local-shops") {
    return (
      <ClaimedServiceGuard category="local-shops">
        <LocalShopsRegistrationForm />
      </ClaimedServiceGuard>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white pb-[calc(4.85rem+env(safe-area-inset-bottom))] md:h-auto md:overflow-visible">
      <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-[var(--border)] pl-12 pr-4 md:h-auto md:border-0 md:px-0 md:pb-2">
        <FormBackButton fallback="/vendors/services" />
        <h1 className="text-[17px] font-semibold tracking-tight md:text-3xl">Local Market</h1>
      </header>
      <p className="px-4 pt-4 text-sm text-[var(--text-muted)] md:px-0">Choose Cloud Kitchen or Local Shops, then fill that form.</p>
      <LocalMarketChoices respectClaims />
    </div>
  );
}
