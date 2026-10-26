"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin } from "lucide-react";
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
  vehicleNumber?: string;
  loadCapacity?: string;
};

type Schedule = {
  id: string;
  listingId: string;
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
}: {
  approvedListings: GoodsTransportListing[];
}) {
  const token = useAuth((state) => state.accessToken);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [editingId, setEditingId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [scheduleView, setScheduleView] = useState<"upcoming" | "history">("upcoming");
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
  const visibleSchedules = schedules.filter((schedule) =>
    scheduleView === "upcoming" ? statusOf(schedule) === "ACTIVE" : statusOf(schedule) !== "ACTIVE",
  );

  async function refresh() {
    if (!token) return;
    const scheduleResult = await api<Schedule[]>("/special-schedules/mine/goods-transport", { token });
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
    void api<Schedule[]>("/special-schedules/mine/goods-transport", { token })
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
  }, [token, approvedListings]);

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
        editingId ? `/special-schedules/${editingId}` : "/special-schedules/goods-transport",
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
      setFormOpen(false);
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
    setFormOpen(true);
    setListingId(schedule.listingId);
    setFromPlace(schedule.fromPlace);
    setToPlace(schedule.toPlace);
    setDepartureAt(
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`,
    );
    setPrice(schedule.price);
    setNote(schedule.note ?? "");
    document.getElementById("goods-transport-schedules")?.scrollIntoView({ behavior: "smooth" });
  }

  function stopEditing() {
    setEditingId("");
    setFormOpen(false);
    setFromPlace("");
    setToPlace("");
    setDepartureAt("");
    setPrice("");
    setNote("");
  }

  return (
    <section id="goods-transport-schedules" className="mt-8 max-w-6xl">
      <div className="rounded-3xl border border-[var(--border)] bg-white shadow-sm">
        <div className="border-b border-[var(--border)] bg-[#f1faf8] px-5 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">Goods Transport</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)]">Special Schedule</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Post an upcoming route that customers can book.</p>
        </div>
        <div className="grid gap-8 p-5 sm:p-8">
          {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          {formOpen && approvedListings.length ? (
            <form onSubmit={(event) => void createSchedule(event)} className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-[var(--ink)]">
                Approved vehicle listing
                <select required value={listingId} onChange={(event) => setListingId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal">
                  {approvedListings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {[listing.vehicleType, listing.vehicleNumber, listing.title].filter(Boolean).join(" · ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-[var(--ink)]">
                Departure date &amp; time
                <input required type="datetime-local" min={minimumDeparture} value={departureAt} onChange={(event) => setDepartureAt(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold text-[var(--ink)]">
                Starting place
                <span className="relative mt-2 block">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" aria-hidden />
                  <input required minLength={2} maxLength={160} value={fromPlace} onChange={(event) => setFromPlace(event.target.value)} className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 font-normal" placeholder="e.g. Hyderabad" />
                </span>
              </label>
              <label className="text-sm font-semibold text-[var(--ink)]">
                Destination
                <span className="relative mt-2 block">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--primary)]" aria-hidden />
                  <input required minLength={2} maxLength={160} value={toPlace} onChange={(event) => setToPlace(event.target.value)} className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 font-normal" placeholder="e.g. Vijayawada" />
                </span>
              </label>
              <label className="text-sm font-semibold text-[var(--ink)]">
                Route price (₹)
                <input required type="number" min="1" max="1000000" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal" />
              </label>
              <label className="text-sm font-semibold text-[var(--ink)]">
                Schedule note <span className="font-normal text-[var(--ink-soft)]">(optional)</span>
                <input maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal" placeholder="Load or pickup details" />
              </label>
              <button disabled={busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2">
                {busy ? "Please wait…" : editingId ? "Save Changes" : "Post Special Schedule"}
                {!busy ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
              </button>
              {editingId ? (
                <button type="button" disabled={busy} onClick={stopEditing} className="h-12 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold text-[var(--ink)] md:col-span-2">
                  Stop editing
                </button>
              ) : null}
            </form>
          ) : formOpen ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--ink-soft)]">
              {waiting ? "Loading approved vehicle listings…" : "An approved Goods Transport listing is required before you can post a schedule."}
              {!waiting ? <Link href="/vendors/services/goods-transport" className="ml-1 font-semibold text-[var(--primary)] hover:underline">Add a vehicle</Link> : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-semibold text-white"
            >
              <CalendarClock className="h-4 w-4" aria-hidden />
              Add Special Schedule
            </button>
          )}

          <div>
            <div role="tablist" aria-label="Goods Transport special schedules" className="flex gap-2 border-b border-[var(--border)]">
              {([
                ["upcoming", "Special Schedules", schedules.filter((schedule) => statusOf(schedule) === "ACTIVE").length],
                ["history", "History", schedules.filter((schedule) => statusOf(schedule) !== "ACTIVE").length],
              ] as const).map(([view, label, count]) => (
                <button
                  key={view}
                  type="button"
                  role="tab"
                  aria-selected={scheduleView === view}
                  onClick={() => setScheduleView(view)}
                  className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
                    scheduleView === view
                      ? "border-[var(--primary)] text-[var(--primary)]"
                      : "border-transparent text-[var(--ink-soft)]"
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
            {waiting ? <p className="mt-4 text-sm text-[var(--ink-soft)]">Loading schedules…</p> : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {visibleSchedules.map((schedule) => (
                <article key={schedule.id} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{schedule.fromPlace} <span aria-hidden>→</span> {schedule.toPlace}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">{dateTime(schedule.departureAt)}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">{schedule.vehicle}{schedule.vehicleNumber ? ` · ${schedule.vehicleNumber}` : ""}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusOf(schedule) === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {statusOf(schedule).toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-3 font-semibold text-[var(--primary)]">{inr(Number(schedule.price))}</p>
                  {schedule.note ? <p className="mt-2 text-sm text-[var(--ink-soft)]">{schedule.note}</p> : null}
                  {statusOf(schedule) === "ACTIVE" ? (
                    <div className="mt-3 flex gap-4">
                      <button type="button" disabled={busy} onClick={() => editSchedule(schedule)} className="text-xs font-semibold text-[var(--primary)] hover:underline disabled:opacity-50">
                        Edit
                      </button>
                      <button type="button" disabled={busy} onClick={() => void cancelSchedule(schedule.id)} className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-50">
                        Cancel schedule
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
              {!waiting && !visibleSchedules.length ? (
                <p className="text-sm text-[var(--ink-soft)]">
                  {scheduleView === "upcoming"
                    ? "You have no upcoming Goods Transport special schedules."
                    : "Your past and cancelled schedules will appear here."}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
