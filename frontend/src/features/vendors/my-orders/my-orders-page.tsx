"use client";

import Link from "next/link";
import { BookingsList } from "@/features/booking/components/bookings-list";
import { useAuth } from "@/features/auth/store";
import { DesktopServicesLayout, InnerPageShell } from "@/features/public-site";

export function MyOrdersPage() {
  const user = useAuth((s) => s.user);
  const isVendor = user?.role === "PARTNER" || user?.role === "DRIVER" || user?.role === "TECHNICIAN";

  return (
    <DesktopServicesLayout>
      <InnerPageShell kicker="Vendor" title="My Orders" subtitle="Accept the booking. For hotels, mark guest checked in, then vacated.">
        <div className="px-1 pb-4 md:px-2">
          {!user ? (
            <div className="px-4 py-6">
              <Link href="/login" className="text-sm font-medium text-[var(--primary)]">
                Sign in
              </Link>
            </div>
          ) : !isVendor ? (
            <div className="px-4 py-6">
              <Link href="/my-bookings" className="text-sm font-medium text-[var(--primary)]">
                My Bookings
              </Link>
            </div>
          ) : (
            <BookingsList scope="orders" />
          )}
        </div>
      </InnerPageShell>
    </DesktopServicesLayout>
  );
}
