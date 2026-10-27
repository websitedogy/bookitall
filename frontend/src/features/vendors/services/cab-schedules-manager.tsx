"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Armchair, ArrowRight, CalendarClock, MapPin, Pencil } from "lucide-react";
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
  status: "ACTIVE" | "INACTIVE" | "CANCELLED";
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

export function CabSchedulesManager({
  vehicles,
  activeTab,
  onTabChange,
}: {
  vehicles: Vehicle[];
  activeTab: "form" | "history";
  onTabChange: (tab: "form" | "history") => void;
}) {
  const token = useAuth((state) => state.accessToken);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [requests, setRequests] = useState<TripRequest[]>([]);
  const [editingId, setEditingId] = useState("");
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [departureAt, setDepartureAt] = useState("");
  const [seatsOffered, setSeatsOffered] = useState("1");
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
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
  const pendingRequests = requests.filter((request) => request.status === "PENDING").length;
  const statusOf = (schedule: Schedule) =>
    schedule.status === "ACTIVE" && new Date(schedule.departureAt).getTime() <= now
      ? "INACTIVE"
      : schedule.status;
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

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
      await api<Schedule>(editingId ? `/cabs/schedules/${editingId}` : "/cabs/schedules", {
        method: editingId ? "PATCH" : "POST",
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
      setEditingId("");
      onTabChange("history");
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

  function editSchedule(schedule: Schedule) {
    const date = new Date(schedule.departureAt);
    const pad = (value: number) => String(value).padStart(2, "0");
    setEditingId(schedule.id);
    onTabChange("form");
    setVehicleId(schedule.vehicleId);
    setFromPlace(schedule.fromPlace);
    setToPlace(schedule.toPlace);
    setDepartureAt(
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`,
    );
    setSeatsOffered(String(schedule.seatsOffered));
    setPricePerSeat(String(schedule.pricePerSeat));
    setNote(schedule.note ?? "");
    document.getElementById("scheduled-cab-trips")?.scrollIntoView({ behavior: "smooth" });
  }

  function stopEditing() {
    setEditingId("");
    setFromPlace("");
    setToPlace("");
    setDepartureAt("");
    setSeatsOffered("1");
    setPricePerSeat("");
    setNote("");
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
    <section id="scheduled-cab-trips" className="mx-auto mt-4 max-w-6xl scroll-mt-24">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <div className="p-4 sm:p-6">
          {error ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {activeTab === "form" ? (
          <div className="rounded-2xl border border-[var(--border)] bg-slate-50/70 p-5 sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <CalendarClock className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-semibold">{editingId ? "Edit schedule" : "Schedule details"}</h3>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">Enter the vehicle, route, and departure details.</p>
              </div>
            </div>

            {vehicles.length ? (
              <form onSubmit={(event) => void createSchedule(event)} className="grid gap-x-5 gap-y-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-[var(--ink)]">
                  Your vehicle
                  <select
                    required
                    value={selectedVehicle?.id ?? ""}
                    onChange={(event) => {
                      setVehicleId(event.target.value);
                      setSeatsOffered("1");
                    }}
                    className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"
                  >
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.category} · {vehicle.seats} seats</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-[var(--ink)]">
                  Departure date &amp; time
                  <input
                    required
                    type="datetime-local"
                    min={minimumDeparture}
                    value={departureAt}
                    onChange={(event) => setDepartureAt(event.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"
                  />
                </label>
                <label className="text-sm font-semibold text-[var(--ink)]">
                  Starting place
                  <span className="relative mt-2 block">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" aria-hidden />
                    <input required minLength={2} maxLength={160} value={fromPlace} onChange={(event) => setFromPlace(event.target.value)} className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 font-normal outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]" placeholder="e.g. Hyderabad" />
                  </span>
                </label>
                <label className="text-sm font-semibold text-[var(--ink)]">
                  Destination
                  <span className="relative mt-2 block">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--primary)]" aria-hidden />
                    <input required minLength={2} maxLength={160} value={toPlace} onChange={(event) => setToPlace(event.target.value)} className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 font-normal outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]" placeholder="e.g. Vijayawada" />
                  </span>
                </label>
                <label className="text-sm font-semibold text-[var(--ink)]">
                  Seats to offer
                  <span className="relative mt-2 block">
                    <Armchair className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" aria-hidden />
                    <input required type="number" min={1} max={selectedVehicle?.seats ?? 1} value={seatsOffered} onChange={(event) => setSeatsOffered(event.target.value)} className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 font-normal outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]" />
                  </span>
                </label>
                <label className="text-sm font-semibold text-[var(--ink)]">
                  Price per seat (₹)
                  <input required type="number" min="1" max="100000" step="0.01" value={pricePerSeat} onChange={(event) => setPricePerSeat(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]" />
                </label>
                <label className="text-sm font-semibold text-[var(--ink)] md:col-span-2">
                  Trip note <span className="font-normal text-[var(--ink-soft)]">(optional)</span>
                  <input maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]" placeholder="Pickup details or luggage information" />
                </label>
                <button disabled={busy} className="inline-flex h-10 w-fit items-center justify-center gap-2 justify-self-start rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2">
                  {busy ? "Please wait…" : editingId ? "Save Changes" : (
                    <>
                      <span className="sm:hidden">Post Schedule</span>
                      <span className="hidden sm:inline">Post Special Schedule</span>
                    </>
                  )}
                  {!busy ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
                </button>
                {editingId ? (
                  <button type="button" disabled={busy} onClick={stopEditing} className="h-12 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold text-[var(--ink)] md:col-span-2">
                    Stop editing
                  </button>
                ) : null}
              </form>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-5 text-sm text-[var(--ink-soft)]">
                <p>Register a cab first to post a trip.</p>
                <Link href="/vendors/services/cabs" className="mt-3 inline-flex font-semibold text-[var(--primary)] hover:underline">
                  Add a cab <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                </Link>
              </div>
            )}
          </div>
          ) : (

          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--border)] p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">Posted schedules</h3>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">Edit a schedule before its departure time.</p>
                </div>
                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">{schedules.length}</span>
              </div>
              <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full min-w-[760px] divide-y divide-[var(--border)] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                    <tr>
                      <th scope="col" className="px-4 py-3">Route</th>
                      <th scope="col" className="px-4 py-3">Vehicle</th>
                      <th scope="col" className="px-4 py-3">Departure date &amp; time</th>
                      <th scope="col" className="px-4 py-3">Seats</th>
                      <th scope="col" className="px-4 py-3">Fare</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                      <th scope="col" className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] bg-white">
                    {schedules.map((schedule) => {
                      const status = statusOf(schedule);
                      return (
                        <tr key={schedule.id} className="align-middle">
                          <td className="px-4 py-3 font-medium text-[var(--ink)]">{schedule.fromPlace} <span className="text-[var(--ink-soft)]">→</span> {schedule.toPlace}</td>
                          <td className="px-4 py-3 text-[var(--ink-soft)]">{schedule.vehicle?.name ?? "Cab"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-[var(--ink-soft)]">{dateTime(schedule.departureAt)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-[var(--ink-soft)]">{schedule.seatsRemaining}/{schedule.seatsOffered} left</td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">{inr(schedule.pricePerSeat)} <span className="font-normal text-[var(--ink-soft)]">/ seat</span></td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                              {status.toLowerCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {status === "ACTIVE" ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  aria-label={`Edit schedule from ${schedule.fromPlace} to ${schedule.toPlace}`}
                                  title="Edit schedule"
                                  disabled={busy}
                                  onClick={() => editSchedule(schedule)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--primary)] transition hover:bg-[var(--primary-soft)] disabled:opacity-50"
                                >
                                  <Pencil className="h-4 w-4" aria-hidden />
                                </button>
                                <button type="button" disabled={busy} onClick={() => void cancelSchedule(schedule.id)} className="rounded-lg px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                                  Cancel
                                </button>
                              </div>
                            ) : <span className="text-xs text-[var(--ink-soft)]">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {!schedules.length ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--ink-soft)]">Your posted schedules will appear here.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Seat requests</h3>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">Review passengers asking to join your trips.</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{pendingRequests} pending</span>
              </div>
              <div className="mt-5 grid gap-3">
                {requests.map((request) => (
                  <article key={request.id} className="rounded-xl border border-[var(--border)] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{request.customer.fullName}</p>
                        <p className="mt-0.5 text-sm text-[var(--ink-soft)]">{request.customer.phone}</p>
                        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium">
                          <span className="max-w-[40%] truncate">{request.schedule.fromPlace}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" aria-hidden />
                          <span className="max-w-[40%] truncate">{request.schedule.toPlace}</span>
                        </p>
                        <p className="mt-1 text-xs text-[var(--ink-soft)]">
                          {dateTime(request.schedule.departureAt)} · {request.seatsRequested} seat(s) · {inr(request.totalPrice)}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                        request.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {request.status.toLowerCase()}
                      </span>
                    </div>
                    {request.status === "PENDING" ? (
                      <div className="mt-4 flex gap-2 border-t border-[var(--border)] pt-3">
                        <button disabled={busy} onClick={() => void answerRequest(request.id, "ACCEPTED")} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-50">Accept</button>
                        <button disabled={busy} onClick={() => void answerRequest(request.id, "DECLINED")} className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-slate-50 disabled:opacity-50">Decline</button>
                      </div>
                    ) : null}
                  </article>
                ))}
                {!requests.length ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-[var(--ink-soft)]">Customer requests will appear here.</p>
                ) : null}
              </div>
            </div>
          </div>
            )}
        </div>
      </div>
    </section>
  );
}
