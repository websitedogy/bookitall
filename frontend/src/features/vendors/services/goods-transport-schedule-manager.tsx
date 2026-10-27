"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Pencil } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { api } from "@/shared/lib/api";
import { inr } from "@/shared/lib/format";

export type GoodsTransportListing = {
  id: string;
  catalogId?: string | null;
  scheduleVehicleIds?: string[];
  title: string;
  status?: string;
  vehicleType?: string;
  serviceType?: string;
  vehicleNumber?: string;
  loadCapacity?: string;
};

type Schedule = {
  id: string;
  listingId: string;
  serviceCategory: "goods-transport" | "packers-movers";
  vehicle: string;
  vehicleNumber: string | null;
  loadCapacity: string | null;
  fromPlace: string;
  toPlace: string;
  departureAt: string;
  price: string;
  note: string | null;
  status: "ACTIVE" | "INACTIVE" | "CANCELLED";
};

function dateTime(value: string) {
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function GoodsTransportScheduleManager({
  approvedListings,
  serviceCategory = "goods-transport",
  activeTab,
  onTabChange,
}: {
  approvedListings: GoodsTransportListing[];
  serviceCategory?: "goods-transport" | "packers-movers";
  activeTab: "form" | "history";
  onTabChange: (tab: "form" | "history") => void;
}) {
  const token = useAuth((state) => state.accessToken);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [editingId, setEditingId] = useState("");
  const [listingId, setListingId] = useState("");
  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [departureAt, setDepartureAt] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [minimumDeparture] = useState(() => {
    const date = new Date(Date.now() + 60_000);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  });
  const waiting = loading && Boolean(token);
  const statusOf = (schedule: Schedule) =>
    schedule.status === "ACTIVE" && new Date(schedule.departureAt).getTime() <= now
      ? "INACTIVE"
      : schedule.status;
  async function refresh() {
    if (!token) return;
    const scheduleResult = await api<Schedule[]>(`/special-schedules/mine/${serviceCategory}`, { token });
    setListingId((current) =>
      approvedListings.some((listing) => listing.id === current)
        ? current
        : approvedListings[0]?.id ?? "",
    );
    setSchedules(scheduleResult.data ?? []);
  }

  useEffect(() => {
    if (!token) return;
    let active = true;
    void api<Schedule[]>(`/special-schedules/mine/${serviceCategory}`, { token })
      .then((scheduleResult) => {
        if (!active) return;
        setListingId(approvedListings[0]?.id ?? "");
        setSchedules(scheduleResult.data ?? []);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your schedules.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, approvedListings, serviceCategory]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      await api<Schedule>(
        editingId ? `/special-schedules/${editingId}` : `/special-schedules/${serviceCategory}`,
        {
          method: editingId ? "PATCH" : "POST",
          token,
          body: JSON.stringify({
            listingId,
            fromPlace,
            toPlace,
            departureAt: new Date(departureAt).toISOString(),
            price: Number(price),
            ...(note.trim() ? { note: note.trim() } : {}),
          }),
        },
      );
      setFromPlace("");
      setToPlace("");
      setDepartureAt("");
      setPrice("");
      setNote("");
      setEditingId("");
      onTabChange("history");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not post this schedule.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelSchedule(id: string) {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      await api(`/special-schedules/${id}/cancel`, { method: "POST", token });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not cancel this schedule.");
    } finally {
      setBusy(false);
    }
  }

  function editSchedule(schedule: Schedule) {
    const date = new Date(schedule.departureAt);
    const pad = (value: number) => String(value).padStart(2, "0");
    setEditingId(schedule.id);
    onTabChange("form");
    setListingId(schedule.listingId);
    setFromPlace(schedule.fromPlace);
    setToPlace(schedule.toPlace);
    setDepartureAt(
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`,
    );
    setPrice(schedule.price);
    setNote(schedule.note ?? "");
    document.getElementById(`${serviceCategory}-schedules`)?.scrollIntoView({ behavior: "smooth" });
  }

  function stopEditing() {
    setEditingId("");
    setFromPlace("");
    setToPlace("");
    setDepartureAt("");
    setPrice("");
    setNote("");
  }

  return (
    <section id={`${serviceCategory}-schedules`} className="mt-4 max-w-6xl">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6">
          {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          {activeTab === "form" ? approvedListings.length ? (
            <form onSubmit={(event) => void createSchedule(event)} className="grid gap-x-5 gap-y-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Approved vehicle listing
                <select required value={listingId} onChange={(event) => setListingId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]">
                  {approvedListings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {[listing.vehicleType, listing.serviceType, listing.vehicleNumber, listing.title].filter(Boolean).join(" · ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-[var(--ink)]">
                Departure date &amp; time
                <input required type="datetime-local" min={minimumDeparture} value={departureAt} onChange={(event) => setDepartureAt(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]" />
              </label>
              <label className="text-sm font-semibold text-[var(--ink)]">
                Starting place
                <span className="relative mt-2 block">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" aria-hidden />
                  <input required minLength={2} maxLength={160} value={fromPlace} onChange={(event) => setFromPlace(event.target.value)} className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 font-normal outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]" placeholder="e.g. Hyderabad" />
                </span>
              </label>
              <label className="text-sm font-semibold text-[var(--ink)]">
                Destination
                <span className="relative mt-2 block">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--primary)]" aria-hidden />
                  <input required minLength={2} maxLength={160} value={toPlace} onChange={(event) => setToPlace(event.target.value)} className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 font-normal outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]" placeholder="e.g. Vijayawada" />
                </span>
              </label>
              <label className="text-sm font-semibold text-[var(--ink)]">
                Route price (₹)
                <input required type="number" min="1" max="1000000" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]" />
              </label>
              <label className="text-sm font-semibold text-[var(--ink)]">
                Schedule note <span className="font-normal text-[var(--ink-soft)]">(optional)</span>
                <input maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]" placeholder="Load or pickup details" />
              </label>
              <button disabled={busy} className="inline-flex h-10 w-fit items-center justify-center gap-2 justify-self-start rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-hover)] disabled:opacity-60 md:col-span-2">
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
            <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--ink-soft)]">
              {waiting
                ? "Loading approved listings…"
                : `An approved ${serviceCategory === "packers-movers" ? "Packers & Movers" : "Goods Transport"} listing is required before you can post a schedule.`}
              {!waiting ? (
                <Link href={`/vendors/services/${serviceCategory}`} className="ml-1 font-semibold text-[var(--primary)] hover:underline">
                  Add a service
                </Link>
              ) : null}
            </div>
          ) : (

          <div>
            {waiting ? <p className="mt-4 text-sm text-[var(--ink-soft)]">Loading schedules…</p> : null}
            <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[680px] divide-y divide-[var(--border)] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Route</th>
                    <th scope="col" className="px-4 py-3">Vehicle</th>
                    <th scope="col" className="px-4 py-3">Departure date &amp; time</th>
                    <th scope="col" className="px-4 py-3">Price</th>
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
                        <td className="px-4 py-3 text-[var(--ink-soft)]">{schedule.vehicle}{schedule.vehicleNumber ? ` · ${schedule.vehicleNumber}` : ""}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">{dateTime(schedule.departureAt)}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{inr(Number(schedule.price))}</td>
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
                  {!waiting && !schedules.length ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--ink-soft)]">Your posted schedules will appear here.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
          )}
      </div>
    </section>
  );
}
