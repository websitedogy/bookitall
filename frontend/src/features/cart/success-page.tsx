"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { inr } from "@/shared/lib/format";
import { trackBookingConfirmed } from "@/shared/lib/analytics";
import {
  getLastOrderServerSnapshot,
  getLastOrderSnapshot,
  subscribeLastOrder,
} from "./checkout-payload";

export function CheckoutSuccessPage() {
  const order = useSyncExternalStore(subscribeLastOrder, getLastOrderSnapshot, getLastOrderServerSnapshot);

  useEffect(() => {
    if (!order?.bookings?.length) return;
    const id = order.bookings.map((booking) => booking.bookingNumber || booking.id).filter(Boolean).join(",");
    if (!id) return;
    const key = `bia-booking-confirmed:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Ignore storage failures; still send once this mount.
    }
    trackBookingConfirmed({
      transaction_id: id,
      value: order.total,
      paid: Boolean(order.paid),
    });
  }, [order]);

  const bookings = order?.bookings ?? [];

  return (
    <div className="mx-auto max-w-lg px-1 py-6 text-center md:py-10">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
        <CircleCheck className="h-8 w-8" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
        {order?.payAfterService ? "Booking placed" : order?.paid ? "Payment successful" : "Booking placed"}
      </h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {order?.payAfterService
          ? `Pay ${inr(order.total)} after the service. Track it in My Bookings.`
          : order
            ? `Paid ${inr(order.total)}. Your booking is in My Bookings.`
            : "Your booking is in My Bookings."}
      </p>

      {bookings.length ? (
        <ul className="mt-6 space-y-2 text-left">
          {bookings.map((booking) => (
            <li key={booking.id} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-[var(--border)]">
              <Link href={`/my-bookings/${booking.id}`} className="block">
                <p className="text-sm font-semibold">{booking.bookingNumber}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {String(booking.details?.listingTitle || booking.type)} · {booking.status.replaceAll("_", " ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <Link href="/my-bookings" className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
          View my bookings
        </Link>
        <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full text-sm font-semibold text-[var(--primary)] ring-1 ring-[var(--primary)]">
          Book another service
        </Link>
      </div>
    </div>
  );
}
