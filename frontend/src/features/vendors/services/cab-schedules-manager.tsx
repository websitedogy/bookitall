"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { inr } from "@/shared/lib/format";
import type { Vehicle } from "@/shared/types/catalog";

type Schedule = {
  id: string;
  vehicleId: string;
  fromPlace: string;
  toPlace: string;
  departureAt: string;
  seatsOffered: number;
  seatsRemaining: number;
  pricePerSeat: string;
  note: string | null;
  status: "OPEN" | "CANCELLED";
  vehicle: { name: string; category: string; color: string; seats: number } | null;
};

type TripRequest = {
  id: string;
  seatsRequested: number;
  totalPrice: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  createdAt: string;
  customer: { fullName: string; phone: string };
  schedule: Schedule;
};

function dateTime(value: string) {
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function CabSchedulesManager({ vehicles }: { vehicles: Vehicle[] }) {
  const token = useAuth((state) => state.accessToken);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [departureAt, setDepartureAt] = useState("");
  const [seatsOffered, setSeatsOffered] = useState("1");
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [minimumDeparture] = useState(() => {
    const date = new Date(Date.now() + 60_000);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  });

  useEffect(() => {
    if (!token) return;
    let active = true;
    void Promise.all([
      api<Schedule[]>("/cabs/schedules/mine", { token }),
      api<TripRequest[]>("/cabs/schedules/mine/requests", { token }),
    ]).then(([scheduleResult, requestResult]) => {
      if (!active) return;
      setSchedules(scheduleResult.data ?? []);
      setRequests(requestResult.data ?? []);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Could not load your scheduled trips.");
    });
    return () => {
      active = false;
    };
  }, [token]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId) ?? vehicles[0];

  async function refresh() {
    if (!token) return;
    const [scheduleResult, requestResult] = await Promise.all([
      api<Schedule[]>("/cabs/schedules/mine", { token }),
      api<TripRequest[]>("/cabs/schedules/mine/requests", { token }),
    ]);
    setSchedules(scheduleResult.data ?? []);
    setRequests(requestResult.data ?? []);
  }

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedVehicle) {
      setError("Register an active vehicle before posting a trip.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api<Schedule>("/cabs/schedules", {
        method: "POST",
        token,
        body: JSON.stringify({
          vehicleId: selectedVehicle.id,
          fromPlace,
          toPlace,
          departureAt: new Date(departureAt).toISOString(),
          seatsOffered: Number(seatsOffered),
          pricePerSeat: Number(pricePerSeat),
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      setFromPlace("");
      setToPlace("");
      setDepartureAt("");
      setPricePerSeat("");
      setNote("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not post your trip.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelSchedule(id: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/cabs/schedules/${id}/cancel`, { method: "POST", token });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not cancel this trip.");
    } finally {
      setBusy(false);
    }
  }

  async function answerRequest(id: string, status: "ACCEPTED" | "DECLINED") {
    setBusy(true);
    setError("");
    try {
      await api(`/cabs/schedule-requests/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-3xl bg-[var(--paper)] p-5 md:p-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--teal)]">Share your route</p>
        <h2 className="serif mt-1 text-3xl">Scheduled cab trips</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
          Going somewhere? Post your route and departure time. Travellers can request seats, and you decide which requests to accept.
        </p>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {vehicles.length ? (
        <form onSubmit={(event) => void createSchedule(event)} className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium">
            Your vehicle
            <select
              required
              value={selectedVehicle?.id ?? ""}
              onChange={(event) => {
                setVehicleId(event.target.value);
                setSeatsOffered("1");
              }}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-3"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.category} · {vehicle.seats} seats</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Departure
            <input
              required
              type="datetime-local"
              min={minimumDeparture}
              value={departureAt}
              onChange={(event) => setDepartureAt(event.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-3"
            />
          </label>
          <label className="text-sm font-medium">
            Starting place
            <input required minLength={2} maxLength={160} value={fromPlace} onChange={(event) => setFromPlace(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-3" placeholder="e.g. Hyderabad" />
          </label>
          <label className="text-sm font-medium">
            Going to
            <input required minLength={2} maxLength={160} value={toPlace} onChange={(event) => setToPlace(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-3" placeholder="e.g. Vijayawada" />
          </label>
          <label className="text-sm font-medium">
            Seats available
            <input required type="number" min={1} max={selectedVehicle?.seats ?? 1} value={seatsOffered} onChange={(event) => setSeatsOffered(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-3" />
          </label>
          <label className="text-sm font-medium">
            Price per seat (₹)
            <input required type="number" min="1" max="100000" step="0.01" value={pricePerSeat} onChange={(event) => setPricePerSeat(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-3" />
          </label>
          <label className="text-sm font-medium md:col-span-2">
            Trip note (optional)
            <input maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-3" placeholder="Pickup details or luggage information" />
          </label>
          <button disabled={busy} className="rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 md:col-span-2">
            {busy ? "Please wait…" : "Post scheduled trip"}
          </button>
        </form>
      ) : (
        <p className="mt-5 text-sm text-[var(--ink-soft)]">
          Register a cab first to post a trip. <Link href="/vendors/services/cabs" className="font-semibold text-[var(--teal)]">Add a cab</Link>
        </p>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Your trips</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {schedules.map((schedule) => (
            <article key={schedule.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <p className="font-semibold">{schedule.fromPlace} → {schedule.toPlace}</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{dateTime(schedule.departureAt)} · {schedule.seatsRemaining}/{schedule.seatsOffered} seats left</p>
              <p className="mt-1 text-sm">{schedule.vehicle?.name ?? "Cab"} · {inr(schedule.pricePerSeat)} per seat · {schedule.status.toLowerCase()}</p>
              {schedule.status === "OPEN" ? (
                <button disabled={busy} onClick={() => void cancelSchedule(schedule.id)} className="mt-3 text-sm font-semibold text-red-700 disabled:opacity-50">
                  Cancel trip
                </button>
              ) : null}
            </article>
          ))}
          {!schedules.length ? <p className="text-sm text-[var(--ink-soft)]">Your posted trips will appear here.</p> : null}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Seat requests</h3>
        <div className="mt-3 grid gap-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{request.customer.fullName} · {request.customer.phone}</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{request.schedule.fromPlace} → {request.schedule.toPlace} · {dateTime(request.schedule.departureAt)}</p>
                  <p className="mt-1 text-sm">{request.seatsRequested} seat(s) · {inr(request.totalPrice)} · {request.status.toLowerCase()}</p>
                </div>
                {request.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <button disabled={busy} onClick={() => void answerRequest(request.id, "ACCEPTED")} className="rounded-full bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Accept</button>
                    <button disabled={busy} onClick={() => void answerRequest(request.id, "DECLINED")} className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold disabled:opacity-50">Decline</button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
          {!requests.length ? <p className="text-sm text-[var(--ink-soft)]">Customer requests will appear here.</p> : null}
        </div>
      </div>
    </section>
  );
}
