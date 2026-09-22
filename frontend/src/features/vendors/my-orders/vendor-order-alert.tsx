"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api, WS_URL } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { inr } from "@/shared/lib/format";
import type { Booking } from "@/shared/types/catalog";
import { MapPin } from "lucide-react";
import { titleOf, serviceLocationOf, vendorSeesCustomerLocation, customerNameOf, customerPhoneOf, serviceLabelOf } from "@/features/booking/components/bookings-list";
import { VendorRejectPanel } from "@/features/vendors/my-orders/vendor-reject-panel";
import { playOrderChime, unlockOrderChime } from "@/shared/lib/order-chime";

function isVendor(role?: string) {
  return role === "PARTNER" || role === "DRIVER" || role === "TECHNICIAN";
}

function openOrder(booking: Booking, now: number) {
  if (booking.status !== "PENDING" || booking.escalatedToAdmin) return false;
  if (!booking.vendorRespondBy) return true;
  return new Date(booking.vendorRespondBy).getTime() > now;
}

export function VendorOrderAlert() {
  const token = useAuth((s) => s.accessToken);
  const user = useAuth((s) => s.user);
  const [orders, setOrders] = useState<Booking[]>([]);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const beep = useRef<ReturnType<typeof setInterval> | null>(null);
  const beepTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const incoming = useMemo(() => orders.filter((row) => openOrder(row, now)), [orders, now]);
  const current = incoming[0] ?? null;

  useEffect(() => {
    setRejecting(false);
  }, [current?.id]);

  async function load() {
    if (!token || !isVendor(user?.role)) return;
    const res = await api<Booking[]>("/bookings?scope=orders&limit=50", { token });
    setOrders(res.data ?? []);
  }

  useEffect(() => {
    if (!token || !isVendor(user?.role)) return;
    const unlock = () => unlockOrderChime();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    void load().catch(() => undefined);
    const poll = window.setInterval(() => void load().catch(() => undefined), 3000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const socket = io(WS_URL, { auth: { token } });
    socket.on("booking:vendor-request", () => {
      playOrderChime();
      void load().catch(() => undefined);
    });
    socket.on("booking:updated", () => void load().catch(() => undefined));
    const onPushMessage = (event: MessageEvent) => {
      if (event.data?.type !== "vendor-order") return;
      playOrderChime();
      void load().catch(() => undefined);
    };
    navigator.serviceWorker?.addEventListener("message", onPushMessage);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.clearInterval(poll);
      window.clearInterval(tick);
      socket.disconnect();
      navigator.serviceWorker?.removeEventListener("message", onPushMessage);
    };
  }, [token, user?.role]);

  useEffect(() => {
    if (!current) {
      if (beep.current) window.clearInterval(beep.current);
      if (beepTimeout.current) window.clearTimeout(beepTimeout.current);
      beep.current = null;
      beepTimeout.current = null;
      return;
    }

    playOrderChime();
    beep.current = setInterval(playOrderChime, 2000);
    beepTimeout.current = setTimeout(() => {
      if (beep.current) window.clearInterval(beep.current);
      beep.current = null;
      beepTimeout.current = null;
    }, 120_000);

    return () => {
      if (beep.current) window.clearInterval(beep.current);
      if (beepTimeout.current) window.clearTimeout(beepTimeout.current);
      beep.current = null;
      beepTimeout.current = null;
    };
  }, [current?.id]);

  async function decide(action: "accept" | "reject", payload?: { reason: string; comment: string }) {
    if (!token || !current) return;
    setBusy(true);
    try {
      await api(`/bookings/${current.id}/${action}`, {
        method: "POST",
        token,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      setRejecting(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!current) return null;

  const leftMs = Math.max(0, new Date(current.vendorRespondBy ?? Date.now()).getTime() - now);
  const mins = Math.floor(leftMs / 60000);
  const secs = Math.floor((leftMs % 60000) / 1000);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 md:items-center">
      <div className="w-full max-w-md border border-slate-200 bg-white p-5 shadow-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">New order</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
          {customerNameOf(current) || serviceLabelOf(current)}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {[serviceLabelOf(current), current.bookingNumber, customerPhoneOf(current)].filter(Boolean).join(" · ")}
        </p>
        {vendorSeesCustomerLocation(current) && serviceLocationOf(current) ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-800">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
            <span>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Customer location</span>
              {serviceLocationOf(current)}
            </span>
          </p>
        ) : null}
        <p className="mt-4 text-2xl font-semibold tabular-nums text-slate-900">{inr(current.total)}</p>
        <p className="mt-2 text-sm font-semibold text-amber-700">
          {mins}:{String(secs).padStart(2, "0")} to accept or reject
        </p>
        {rejecting ? (
          <VendorRejectPanel
            busy={busy}
            onCancel={() => setRejecting(false)}
            onConfirm={(payload) => void decide("reject", payload)}
          />
        ) : (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void decide("accept")}
            className="inline-flex h-12 items-center justify-center bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
          >
            Accept
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRejecting(true)}
            className="inline-flex h-12 items-center justify-center border border-slate-300 text-sm font-semibold text-red-600 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
