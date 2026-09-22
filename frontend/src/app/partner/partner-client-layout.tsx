"use client";

import { AppShell } from "@/shared/ui/app-shell";
import { MobileTabBar } from "@/features/public-site";

const nav = [
  { href: "/partner", label: "Overview" },
  { href: "/partner/listings", label: "Listings" },
  { href: "/partner/bookings", label: "Bookings" },
  { href: "/partner/wallet", label: "Wallet" },
];

export function PartnerClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell role="PARTNER" title="Partner" nav={nav}>
        <div className="pb-24">{children}</div>
      </AppShell>
      <MobileTabBar />
    </>
  );
}
