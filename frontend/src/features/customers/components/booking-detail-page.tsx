"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useAuthHydrated } from "@/features/auth/store";
import { api, ApiError } from "@/shared/lib/api";
import { inr } from "@/shared/lib/format";
import type { Booking } from "@/shared/types/catalog";
import { cn } from "@/shared/lib/cn";
import { serviceLocationOf, vendorSeesCustomerLocation, customerNameOf, customerPhoneOf, serviceLabelOf, hotelStatusLabel } from "@/features/booking/components/bookings-list";
import { VendorRejectPanel } from "@/features/vendors/my-orders/vendor-reject-panel";
import {
  emptyPayment,
  PaymentFields,
  paymentPayload,
  validatePaymentDraft,
} from "@/features/cart/payment-fields";

export function BookingDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const ready = useAuthHydrated();
  const token = useAuth((s) => s.accessToken);
  const userId = useAuth((s) => s.user?.id);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [draft, setDraft] = useState(emptyPayment());

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace(`/login?next=/my-bookings/${id}`);
      return;
    }
    api<Booking>(`/bookings/${id}`, { token })
      .then((res) => setBooking(res.data ?? null))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load booking"));
  }, [id, token, ready, router]);

  async function pay() {
    if (!token || !booking) return;
    const invalid = validatePaymentDraft(draft, Number.MAX_SAFE_INTEGER, Number(booking.total));
    if (invalid && draft.method !== "WALLET") {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api<Booking>(`/bookings/${booking.id}/pay`, {
        method: "POST",
        token,
        body: JSON.stringify(paymentPayload(draft)),
      });
      setBooking(res.data ?? booking);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!token || !booking) return;
    setBusy(true);
    setError("");
    try {
      const res = await api<Booking>(`/bookings/${booking.id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "CANCELLED", note: "Cancelled by customer" }),
      });
      setBooking(res.data ?? booking);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not cancel");
    } finally {
      setBusy(false);
    }
  }

  async function decide(action: "accept" | "reject", payload?: { reason: string; comment: string }) {
    if (!token || !booking) return;
    setBusy(true);
    setError("");
    try {
      const res = await api<Booking>(`/bookings/${booking.id}/${action}`, {
        method: "POST",
        token,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      setRejecting(false);
      setBooking(res.data ?? booking);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !token) return <p className="text-sm text-[var(--text-muted)]">Loading…</p>;
  if (!booking) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center ring-1 ring-[var(--border)]">
        <p className="font-semibold">{error || "Booking not found"}</p>
        <Link href="/my-bookings" className="mt-4 inline-flex text-sm font-medium text-[var(--primary)]">
          Back to bookings
        </Link>
      </div>
    );
  }

  const isVendorView = booking.partnerId === userId;
  const title = isVendorView
    ? customerNameOf(booking) || serviceLabelOf(booking)
    : String(
        booking.details?.listingTitle || booking.details?.hotelName || booking.details?.tourName || booking.details?.serviceName || booking.type,
      );
  const unpaid = booking.payment?.status === "PENDING" || booking.payment?.status === "FAILED" || !booking.payment;
  const canPay = unpaid && !["CANCELLED", "REFUNDED", "COMPLETED"].includes(booking.status) && booking.status === "AWAITING_PAYMENT";
  const canCancel = ["AWAITING_PAYMENT", "PENDING", "CONFIRMED", "ASSIGNED"].includes(booking.status) && booking.customerId === userId;
  const waitingVendor = booking.status === "PENDING" && !booking.escalatedToAdmin;
  const waitingAdmin = booking.status === "PENDING" && Boolean(booking.escalatedToAdmin);
  const vendorCanDecide =
    waitingVendor && (booking.partnerId === userId) && (!booking.vendorRespondBy || new Date(booking.vendorRespondBy).getTime() > Date.now());
  const isHotel = booking.type === "HOTEL";
  const stayIn = String(booking.details?.checkIn ?? "").slice(0, 10);
  const stayOut = String(booking.details?.checkOut ?? "").slice(0, 10);
  const vendorCanCheckIn = isVendorView && isHotel && booking.status === "CONFIRMED";
  const vendorCanVacate =
    isVendorView && isHotel && (booking.status === "IN_PROGRESS" || booking.status === "CONFIRMED");

  async function setStayStatus(status: "IN_PROGRESS" | "COMPLETED", note: string) {
    if (!token || !booking) return;
    setBusy(true);
    setError("");
    try {
      const res = await api<Booking>(`/bookings/${booking.id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status, note }),
      });
      setBooking(res.data ?? booking);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not update stay");
    } finally {
      setBusy(false);
    }
  }

  const backHref = booking.partnerId === userId ? "/vendors/my-orders" : "/my-bookings";
  const backLabel = booking.partnerId === userId ? "My Orders" : "My Bookings";

  return (
    <div className="mx-auto max-w-lg">
      <Link href={backHref} className="text-sm font-medium text-[var(--primary)]">
        ← {backLabel}
      </Link>
      <article className="mt-4 border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
          {isVendorView ? serviceLabelOf(booking) : booking.type.replaceAll("_", " ")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{booking.bookingNumber}</p>
        <span className="mt-3 inline-flex text-[11px] font-semibold uppercase tracking-wide text-amber-700">
          {waitingAdmin ? "Admin" : waitingVendor ? "Waiting vendor" : hotelStatusLabel(booking) || booking.status.replaceAll("_", " ")}
        </span>
        <dl className="mt-5 divide-y divide-[var(--border)] text-sm">
          <Row label="Total" value={inr(booking.total)} />
          {stayIn && stayOut ? <Row label="Stay" value={`${stayIn} → ${stayOut}`} /> : booking.scheduledAt ? <Row label="When" value={new Date(booking.scheduledAt).toLocaleString("en-IN")} /> : null}
          {isVendorView && customerPhoneOf(booking) ? <Row label="Customer phone" value={customerPhoneOf(booking)} /> : null}
          {serviceLocationOf(booking) && (booking.partnerId !== userId || vendorSeesCustomerLocation(booking)) ? (
            <Row label={booking.partnerId === userId ? "Customer location" : "Service location"} value={serviceLocationOf(booking)} />
          ) : waitingAdmin && booking.partnerId === userId ? (
            <Row label="Customer location" value="Visible after admin accepts this order." />
          ) : null}
          {!isVendorView && booking.details?.vendorName ? <Row label="Vendor" value={String(booking.details.vendorName)} /> : null}
          {booking.status === "CANCELLED" && booking.cancellationReason ? (
            <Row label="Reject reason" value={booking.cancellationReason.replace(/^Rejected by (vendor|admin):\s*/i, "")} />
          ) : null}
          {booking.payment?.status ? (
            <Row
              label="Payment"
              value={[booking.payment.method, booking.payment.status].filter(Boolean).join(" · ")}
            />
          ) : null}
        </dl>
        {error ? <p className="mt-4 text-sm text-[var(--error)]">{error}</p> : null}
        {canPay ? (
          <div className="mt-5">
            <div className="flex flex-wrap gap-2">
              {["UPI", "CARD", "NET_BANKING", "WALLET", "CASH"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, method: method as typeof prev.method }))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
                    draft.method === method
                      ? "bg-[var(--primary)] text-white ring-[var(--primary)]"
                      : "bg-white text-slate-600 ring-[var(--border)]",
                  )}
                >
                  {method === "NET_BANKING" ? "Net banking" : method === "CASH" ? "Pay later" : method}
                </button>
              ))}
            </div>
            <PaymentFields draft={draft} onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))} />
            <button
              type="button"
              disabled={busy}
              onClick={() => void pay()}
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Paying…" : draft.method === "CASH" ? "Confirm pay later" : `Pay ${inr(booking.total)}`}
            </button>
          </div>
        ) : null}
        {vendorCanDecide ? (
          rejecting ? (
            <VendorRejectPanel
              busy={busy}
              error={error}
              onCancel={() => setRejecting(false)}
              onConfirm={(payload) => void decide("reject", payload)}
            />
          ) : (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={() => void decide("accept")} className="inline-flex h-12 items-center justify-center bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60">
              Accept
            </button>
            <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="inline-flex h-12 items-center justify-center border border-slate-300 text-sm font-semibold text-red-600 disabled:opacity-60">
              Reject
            </button>
          </div>
          )
        ) : null}
        {vendorCanCheckIn ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void setStayStatus("IN_PROGRESS", "Guest checked in")}
            className="mt-5 inline-flex h-12 w-full items-center justify-center bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
          >
            Guest checked in
          </button>
        ) : null}
        {vendorCanVacate && booking.status !== "CONFIRMED" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void setStayStatus("COMPLETED", "Guest vacated")}
            className="mt-3 inline-flex h-12 w-full items-center justify-center bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
          >
            Guest vacated — room free
          </button>
        ) : null}
        {canCancel ? (
          <button type="button" disabled={busy} onClick={cancel} className="mt-3 inline-flex h-11 w-full items-center justify-center text-sm font-semibold text-[var(--error)]">
            Cancel booking
          </button>
        ) : null}
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="max-w-[65%] text-right font-medium">{value}</dd>
    </div>
  );
}
