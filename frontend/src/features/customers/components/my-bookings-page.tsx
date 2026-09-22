"use client";

import { BookingsList } from "@/features/booking/components/bookings-list";
import { DesktopServicesLayout, InnerPageShell } from "@/features/public-site";

export function MyBookingsPage() {
  return (
    <DesktopServicesLayout>
      <InnerPageShell kicker="Account" title="My Bookings" subtitle="Track payment and work status for this account.">
        <div className="px-1 pb-4 md:px-2">
          <BookingsList scope="mine" emptyHint="No bookings" />
        </div>
      </InnerPageShell>
    </DesktopServicesLayout>
  );
}
