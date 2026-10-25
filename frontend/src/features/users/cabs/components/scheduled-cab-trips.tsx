"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { inr } from "@/shared/lib/format";

type TripSchedule = {
  id: string;
  fromPlace: string;
  toPlace: string;
  departureAt: string;
  seatsOffered: number;
  seatsRemaining: number;
  pricePerSeat: string;
  note: string | null;
  vehicle: { name: string; category: string; color: string; seats: number } | null;
};

type TripRequest = {
  id: string;
  seatsRequested: number;
  totalPrice: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  schedule: Omit<TripSchedule, "seatsRemaining">;
};

function dateTime(value: string) {
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function ScheduledCabTrips({ partnerId, vendor }: { partnerId?: string; vendor?: string }) {
  const token = useAuth((state) => state.accessToken);
  const user = useAuth((state) => state.user);
  const router = useRouter();
  const schedulePath = partnerId
    ? `/cabs/scheduled?${new URLSearchParams({ partnerId, ...(vendor ? { vendor } : {}) }).toString()}`
    : "/cabs/scheduled";
  const schedulesApiPath = partnerId ? `/cabs/schedules?${new URLSearchParams({ partnerId }).toString()}` : "/cabs/schedules";
  const [trips, setTrips] = useState<TripSchedule[]>([]);
  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [seatCounts, setSeatCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;
    const loadRequests =
      token && user?.role === "CUSTOMER"
        ? api<TripRequest[]>("/cabs/schedule-requests/mine", { token })
        : Promise.resolve({ data: [] as TripRequest[] });
    void Promise.all([api<TripSchedule[]>(schedulesApiPath), loadRequests]).then(([tripResult, requestResult]) => {
      if (!active) return;
      setTrips(tripResult.data ?? []);
      setRequests(requestResult.data ?? []);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Could not load scheduled trips.");
    });
    return () => {
      active = false;
    };
  }, [schedulesApiPath, token, user?.role]);

  async function refresh() {
    const result = await api<TripSchedule[]>(schedulesApiPath);
    setTrips(result.data ?? []);
    if (token && user?.role === "CUSTOMER") {
      const mine = await api<TripRequest[]>("/cabs/schedule-requests/mine", { token });
      setRequests(mine.data ?? []);
    }
  }

  async function requestSeats(trip: TripSchedule) {
    if (!token || user?.role !== "CUSTOMER") {
      router.push(`/login?next=${encodeURIComponent(schedulePath)}`);
      return;
    }
    const seatsRequested = seatCounts[trip.id] ?? 1;
    setBusyId(trip.id);
    setError("");
    try {
      await api(`/cabs/schedules/${trip.id}/requests`, {
        method: "POST",
        token,
        body: JSON.stringify({ seatsRequested }),
      });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request these seats.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/cabs" className="text-sm font-semibold text-[#0f7d6e]">← Cab booking</Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f7d6e]">Special Schedule · Cabs</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#12241f]">
        {partnerId ? `Scheduled trips${vendor ? ` by ${vendor}` : " from this cab vendor"}` : "Find a cab already going your way"}
      </h1>
      <p className="mt-2 text-sm text-[#5b6e68]">
        {partnerId
          ? "See the route, departure time, and available seats for this vendor's trips."
          : "Request the seats you need. The cab vendor will confirm or decline your request."}
      </p>

      {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="mt-6 grid gap-4">
        {trips.map((trip) => {
          const alreadyRequested = requests.some(
            (request) => request.schedule.id === trip.id && ["PENDING", "ACCEPTED"].includes(request.status),
          );
          return (
            <article key={trip.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-emerald-100">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[#12241f]">{trip.fromPlace} <span aria-hidden>→</span> {trip.toPlace}</p>
                  <p className="mt-1 text-sm text-[#5b6e68]">{dateTime(trip.departureAt)}</p>
                  <p className="mt-1 text-sm text-[#5b6e68]">{trip.vehicle?.name ?? "Cab"} · {trip.vehicle?.category ?? "Vehicle"}</p>
                </div>
                <p className="font-semibold text-[#0f7d6e]">{inr(trip.pricePerSeat)} <span className="text-sm font-normal text-[#5b6e68]">/ seat</span></p>
              </div>
              {trip.note ? <p className="mt-3 text-sm text-[#5b6e68]">{trip.note}</p> : null}
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <label className="text-sm font-medium text-[#12241f]">
                  Seats ({trip.seatsRemaining} available)
                  <select
                    value={Math.min(seatCounts[trip.id] ?? 1, trip.seatsRemaining)}
                    onChange={(event) => setSeatCounts((current) => ({ ...current, [trip.id]: Number(event.target.value) }))}
                    disabled={trip.seatsRemaining < 1 || alreadyRequested}
                    className="ml-2 rounded-xl border border-emerald-100 bg-white px-3 py-2"
                  >
                    {Array.from({ length: Math.min(trip.seatsRemaining, 20) }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </select>
                </label>
                {alreadyRequested ? (
                  <span className="text-sm font-semibold text-[#0f7d6e]">Request sent</span>
                ) : (
                  <button
                    type="button"
                    disabled={trip.seatsRemaining < 1 || busyId === trip.id}
                    onClick={() => void requestSeats(trip)}
                    className="rounded-full bg-[#0f7d6e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busyId === trip.id ? "Sending…" : token ? "Request seats" : "Sign in to request"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {!trips.length ? (
          <p className="rounded-2xl bg-[#f3faf7] px-5 py-6 text-sm text-[#5b6e68]">
            {partnerId ? "This cab vendor has no future trips posted right now." : "No future cab trips are posted right now. Check back soon."}
          </p>
        ) : null}
      </section>

      {user?.role === "CUSTOMER" && requests.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#12241f]">Your seat requests</h2>
          <div className="mt-3 grid gap-3">
            {requests.map((request) => (
              <article key={request.id} className="rounded-2xl bg-[#f3faf7] p-4">
                <p className="font-semibold">{request.schedule.fromPlace} → {request.schedule.toPlace}</p>
                <p className="mt-1 text-sm text-[#5b6e68]">
                  {request.seatsRequested} seat(s) · {inr(request.totalPrice)} · {dateTime(request.schedule.departureAt)}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#0f7d6e]">{request.status.toLowerCase()}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
