"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPinned, Star } from "lucide-react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { inr } from "@/shared/lib/format";
import type { Booking } from "@/shared/types/catalog";
import { VendorRejectPanel } from "@/features/vendors/my-orders/vendor-reject-panel";
import { VendorRouteMap } from "@/features/vendors/my-orders/vendor-route-map";
import { cn } from "@/shared/lib/cn";

export function titleOf(booking: Booking) {
  const details = booking.details ?? {};
  return String(
    details.listingTitle || details.hotelName || details.tourName || details.serviceName || details.vehicleName || booking.type,
  );
}

export function customerNameOf(booking: Booking) {
  const details = booking.details ?? {};
  return String(details.customerName || "").trim();
}

export function customerPhoneOf(booking: Booking) {
  const details = booking.details ?? {};
  return String(details.customerPhone || "").trim();
}

export function serviceLabelOf(booking: Booking) {
  const details = booking.details ?? {};
  const category = String(details.listingCategory || details.category || "").trim();
  if (category && category !== "all") return category.replace(/-/g, " ");
  const title = titleOf(booking);
  const vendor = String(details.vendorName || "").trim();
  if (title && vendor && title.toLowerCase() === vendor.toLowerCase()) {
    return String(booking.type).replaceAll("_", " ").toLowerCase();
  }
  return title;
}

export function stayDatesOf(booking: Booking) {
  const details = booking.details ?? {};
  const inn = String(details.checkIn ?? "").slice(0, 10);
  const out = String(details.checkOut ?? "").slice(0, 10);
  if (!inn || !out) return "";
  return `${inn} → ${out}`;
}

export function hotelStatusLabel(booking: Booking) {
  if (booking.type !== "HOTEL") return "";
  if (booking.status === "CONFIRMED") return "Stay booked";
  if (booking.status === "IN_PROGRESS") return "Guest staying";
  if (booking.status === "COMPLETED") return "Vacated · room free";
  return "";
}

export function serviceLocationOf(booking: Booking) {
  const details = booking.details ?? {};
  const address = String(details.address || details.pickupAddress || "").trim();
  const drop = String(details.dropAddress || "").trim();
  if (address && drop && drop !== address) return `${address} → ${drop}`;
  return address;
}

function customerRouteUrl(booking: Booking) {
  const details = booking.details ?? {};
  const coordinates = customerCoordinatesOf(booking);
  const destination = coordinates
    ? `${coordinates.lat},${coordinates.lng}`
    : String(details.address || details.pickupAddress || "").trim();
  if (!destination) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function customerCoordinatesOf(booking: Booking) {
  const details = booking.details ?? {};
  const lat = Number(details.customerLat);
  const lng = Number(details.customerLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function customerFeedbackOf(booking: Booking) {
  const details = booking.details ?? {};
  const rating = Number(details.customerRating ?? details.rating);
  const review = String(details.customerReview ?? details.review ?? "").trim();
  return {
    rating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null,
    review,
  };
}

export function vendorSeesCustomerLocation(booking: Booking) {
  if (booking.status === "CONFIRMED" || booking.status === "ASSIGNED" || booking.status === "IN_PROGRESS" || booking.status === "COMPLETED") {
    return true;
  }
  if (booking.status !== "PENDING" || booking.escalatedToAdmin) return false;
  if (!booking.vendorRespondBy) return true;
  return new Date(booking.vendorRespondBy).getTime() > Date.now();
}

function statusBadgeClass(status: string) {
  if (status === "CONFIRMED" || status === "ASSIGNED" || status === "COMPLETED") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (status === "AWAITING_PAYMENT" || status === "PENDING") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  if (status === "CANCELLED" || status === "REFUNDED") {
    return "bg-red-50 text-red-600 ring-red-200";
  }
  if (status === "IN_PROGRESS") return "bg-sky-50 text-sky-700 ring-sky-200";
  return "bg-slate-50 text-slate-600 ring-slate-200";
}

function formatDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function vendorOpen(booking: Booking) {
  if (booking.status !== "PENDING" || booking.escalatedToAdmin) return false;
  if (!booking.vendorRespondBy) return true;
  return new Date(booking.vendorRespondBy).getTime() > Date.now();
}

const PAGE_SIZE = 8;

export function BookingsList({
  emptyHint = "No orders",
  scope = "mine",
}: {
  emptyHint?: string;
  scope?: "mine" | "orders";
}) {
  const token = useAuth((s) => s.accessToken);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState("");
  const [rejectingId, setRejectingId] = useState("");
  const [routeBooking, setRouteBooking] = useState<Booking | null>(null);
  const [paymentNoticeId, setPaymentNoticeId] = useState("");

  useEffect(() => {
    setPage(1);
  }, [scope]);

  async function load(nextPage = page) {
    if (!token) return;
    const res = await api<Booking[]>(`/bookings?scope=${scope}&page=${nextPage}&limit=${PAGE_SIZE}`, { token });
    const rows = res.data ?? [];
    const count = res.meta?.total ?? rows.length;
    const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
    if (nextPage > pages) {
      setPage(pages);
      return;
    }
    setBookings(rows);
    setTotal(count);
  }

  useEffect(() => {
    if (!token) return;
    void load(page).catch(() => {
      setBookings([]);
      setTotal(0);
    });
    const timer = window.setInterval(() => void load(page).catch(() => undefined), 4000);
    return () => window.clearInterval(timer);
  }, [token, scope, page]);

  async function decide(id: string, action: "accept" | "reject", payload?: { reason: string; comment: string }) {
    if (!token) return;
    setBusy(id);
    try {
      await api(`/bookings/${id}/${action}`, {
        method: "POST",
        token,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      setRejectingId("");
      await load(page);
    } finally {
      setBusy("");
    }
  }

  async function stayAction(id: string, status: "IN_PROGRESS" | "COMPLETED", note: string) {
    if (!token) return;
    setBusy(id);
    try {
      await api(`/bookings/${id}/status`, { method: "PATCH", token, body: JSON.stringify({ status, note }) });
      await load(page);
    } finally {
      setBusy("");
    }
  }

  if (!token) {
    return (
      <div className="px-4 py-6 md:px-0">
        <Link href="/login?next=/my-bookings" className="text-sm font-medium text-[var(--primary)]">
          Sign in
        </Link>
      </div>
    );
  }

  if (!bookings.length) {
    return <p className="px-4 py-8 text-sm text-slate-500 md:px-0">{emptyHint}</p>;
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <ul className="space-y-2">
      {bookings.map((booking) => {
        const open = scope === "orders" && vendorOpen(booking);
        const location =
          scope === "orders" && !vendorSeesCustomerLocation(booking) ? "" : serviceLocationOf(booking);
        const customerCoordinates = customerCoordinatesOf(booking);
        const summaryLine = scope === "orders"
          ? [serviceLabelOf(booking), customerPhoneOf(booking)].filter(Boolean).join(" · ")
          : "";
        const feedback = customerFeedbackOf(booking);
        return (
          <li key={booking.id} className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_-22px_rgba(15,23,42,0.8)] transition-colors hover:border-slate-300">
            <div className="px-4 py-3.5 md:px-0">
              <Link href={`/my-bookings/${booking.id}`} className="flex items-start justify-between gap-4 hover:opacity-80">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-200">
                      Service used
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[10px] font-medium capitalize text-slate-500">{serviceLabelOf(booking)}</span>
                  </div>
                  <p className="truncate text-[15px] font-semibold text-slate-900">
                    {scope === "orders" ? customerNameOf(booking) || serviceLabelOf(booking) : titleOf(booking)}
                  </p>
                  {summaryLine ? <p className="mt-0.5 truncate text-xs text-slate-500">{summaryLine}</p> : null}
                  {scope === "orders" && location ? (
                    <p className="mt-1 line-clamp-2 text-[12px] text-slate-600">{location}</p>
                  ) : null}
                  {stayDatesOf(booking) ? (
                    <p className="mt-1 text-[12px] text-slate-600">Stay {stayDatesOf(booking)}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[15px] font-semibold text-slate-900">{inr(booking.total)}</p>
                  <span className={cn("mt-1.5 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1", statusBadgeClass(booking.status))}>
                    {booking.escalatedToAdmin && booking.status === "PENDING"
                      ? "Admin"
                      : hotelStatusLabel(booking) || booking.status.replaceAll("_", " ")}
                  </span>
                </div>
              </Link>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex shrink-0 whitespace-nowrap text-[9px] font-bold text-slate-900">
                    Booking No · {booking.bookingNumber}
                  </span>
                  {booking.createdAt ? <p className="shrink-0 text-[11px] text-slate-400">{formatDay(booking.createdAt)}</p> : null}
                </div>
                {scope === "orders" && location ? (
                  customerCoordinates ? (
                    <button
                      type="button"
                      aria-label="Open route to customer"
                      onClick={() => setRouteBooking(booking)}
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-[#e6f5ec] px-3 text-[12px] font-semibold text-[#1b8a4a] hover:bg-[#d8efdf]"
                    >
                      <MapPinned className="h-4 w-4" />
                      Route to customer
                    </button>
                  ) : customerRouteUrl(booking) ? (
                    <a
                      href={customerRouteUrl(booking)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-[12px] font-semibold text-[var(--primary)] hover:underline"
                    >
                      Open location in Maps
                    </a>
                  ) : null
                ) : null}
                {scope === "mine" && booking.status === "CONFIRMED" ? (
                  <div className="flex items-center gap-2">
                    {paymentNoticeId === booking.id ? <span className="text-[11px] font-semibold text-slate-500">Coming soon</span> : null}
                    <button
                      type="button"
                      onClick={() => setPaymentNoticeId(booking.id)}
                      className="inline-flex h-7 items-center rounded-full bg-[var(--primary)] px-2.5 text-[10px] font-semibold text-white"
                    >
                      Pay online
                    </button>
                  </div>
                ) : null}
              </div>
              {scope === "orders" && (feedback.rating || feedback.review) ? (
                <div className="mt-3 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {feedback.rating ? feedback.rating.toFixed(1) : "Review"}
                    <span className="font-normal text-slate-400">Customer feedback</span>
                  </div>
                  {feedback.review ? <p className="mt-1 text-[12px] leading-5 text-slate-600">{feedback.review}</p> : null}
                </div>
              ) : null}
              {open ? (
                rejectingId === booking.id ? (
                  <VendorRejectPanel
                    busy={busy === booking.id}
                    onCancel={() => setRejectingId("")}
                    onConfirm={(payload) => void decide(booking.id, "reject", payload)}
                  />
                ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busy === booking.id}
                    onClick={() => void decide(booking.id, "accept")}
                    className="inline-flex h-9 flex-1 items-center justify-center bg-[var(--primary)] text-xs font-semibold text-white disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy === booking.id}
                    onClick={() => setRejectingId(booking.id)}
                    className="inline-flex h-9 flex-1 items-center justify-center border border-slate-300 text-xs font-semibold text-red-600 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
                )
              ) : null}
              {scope === "orders" && booking.type === "HOTEL" && booking.status === "CONFIRMED" ? (
                <button
                  type="button"
                  disabled={busy === booking.id}
                  onClick={() => void stayAction(booking.id, "IN_PROGRESS", "Guest checked in")}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center bg-[var(--primary)] text-xs font-semibold text-white disabled:opacity-60"
                >
                  Guest checked in
                </button>
              ) : null}
              {scope === "orders" && booking.type === "HOTEL" && booking.status === "IN_PROGRESS" ? (
                <button
                  type="button"
                  disabled={busy === booking.id}
                  onClick={() => void stayAction(booking.id, "COMPLETED", "Guest vacated")}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center bg-[var(--primary)] text-xs font-semibold text-white disabled:opacity-60"
                >
                  Guest vacated — room free
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-0">
          <p className="text-xs text-slate-500">
            {from}–{to} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="inline-flex h-8 cursor-pointer items-center rounded-full px-3 text-xs font-semibold ring-1 ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-600">
              {page} / {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
              className="inline-flex h-8 cursor-pointer items-center rounded-full px-3 text-xs font-semibold ring-1 ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
      {routeBooking ? (
        <VendorRouteMap
          destination={customerCoordinatesOf(routeBooking)!}
          address={serviceLocationOf(routeBooking)}
          externalUrl={customerRouteUrl(routeBooking)}
          onClose={() => setRouteBooking(null)}
        />
      ) : null}
    </div>
  );
}
