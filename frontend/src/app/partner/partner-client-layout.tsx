"use client";

import { AppShell } from "@/shared/ui/app-shell";
import { MobileTabBar } from "@/features/public-site";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/partner", label: "Overview" },
  { href: "/partner/listings", label: "My Services" },
  { href: "/partner/bookings", label: "Bookings" },
  { href: "/partner/wallet", label: "Wallet" },
];

export function PartnerClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageNav = pathname === "/partner/listings" ? [] : nav;

  return (
    <>
      <AppShell role="PARTNER" title="Partner" nav={pageNav}>
        <div className="pb-24">{children}</div>
      </AppShell>
      <MobileTabBar />
    </>
  );
}
