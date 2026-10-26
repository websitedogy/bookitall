"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { inr } from "@/shared/lib/format";

type GoodsTransportSchedule = {
  id: string;
  serviceCategory: "goods-transport" | "packers-movers";
  vehicle: string;
  vehicleNumber: string | null;
  loadCapacity: string | null;
  partnerName: string;
  mobileNumber: string | null;
  fromPlace: string;
  toPlace: string;
  departureAt: string;
  price: string;
  note: string | null;
};

function dateTime(value: string) {
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function GoodsTransportSpecialSchedules({
  serviceCategory = "goods-transport",
}: {
  serviceCategory?: "goods-transport" | "packers-movers";
}) {
  const token = useAuth((state) => state.accessToken);
  const user = useAuth((state) => state.user);
  const router = useRouter();
  const [schedules, setSchedules] = useState<GoodsTransportSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    void api<GoodsTransportSchedule[]>(`/special-schedules/${serviceCategory}`)
      .then((result) => {
        if (active) setSchedules(result.data ?? []);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load special schedules.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [serviceCategory]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(interval);
  }, []);

  const upcomingSchedules = schedules.filter(
    (schedule) => new Date(schedule.departureAt).getTime() > now,
  );

  async function bookSchedule(schedule: GoodsTransportSchedule) {
    if (!token || user?.role !== "CUSTOMER") {
      router.push(`/login?next=${encodeURIComponent(serviceCategory === "packers-movers" ? "/packers-movers" : "/goods-transport")}`);
      return;
    }
    setBusyId(schedule.id);
    setError("");
    try {
      const result = await api<{ id: string }>("/bookings", {
        method: "POST",
        token,
        body: JSON.stringify({
          type: "HOME_SERVICE",
          details: {
            specialScheduleId: schedule.id,
            specialScheduleType: "goods-transport",
            listingCategory: serviceCategory,
          },
        }),
      });
      router.push(result.data?.id ? `/my-bookings/${result.data.id}` : "/my-bookings");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not book this schedule.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="px-4 py-5 md:px-7 md:py-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
          {serviceCategory === "packers-movers" ? "Packers & Movers" : "Goods Transport"}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text)]">Special Schedule</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Upcoming {serviceCategory === "packers-movers" ? "moving service routes" : "goods vehicle routes"} shared by approved partners.
        </p>
      </div>

      {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="mt-5 text-sm text-[var(--text-muted)]">Loading schedules…</p> : null}

      {!loading && !error ? (
        <div className="mt-5 grid gap-3">
          {upcomingSchedules.map((schedule) => (
            <article key={schedule.id} className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[var(--text)]">
                    {schedule.fromPlace} <span aria-hidden>→</span> {schedule.toPlace}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{dateTime(schedule.departureAt)}</p>
                </div>
                <p className="font-semibold text-[var(--primary)]">{inr(Number(schedule.price))}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
                <span>{schedule.vehicle}{schedule.vehicleNumber ? ` · ${schedule.vehicleNumber}` : ""}</span>
                {schedule.loadCapacity ? <span>Load capacity: {schedule.loadCapacity}</span> : null}
                <span>{schedule.partnerName}</span>
              </div>
              {schedule.note ? <p className="mt-3 text-sm text-[var(--text-muted)]">{schedule.note}</p> : null}
              <button
                type="button"
                disabled={busyId === schedule.id}
                onClick={() => void bookSchedule(schedule)}
                className="mt-4 inline-flex rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyId === schedule.id ? "Booking…" : "Book this schedule"}
              </button>
            </article>
          ))}
          {!upcomingSchedules.length ? (
            <p className="rounded-xl bg-[var(--primary-soft)] px-4 py-5 text-sm text-[var(--text-muted)]">
              No upcoming {serviceCategory === "packers-movers" ? "Packers & Movers" : "Goods Transport"} schedules are available right now. Please check again soon.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
