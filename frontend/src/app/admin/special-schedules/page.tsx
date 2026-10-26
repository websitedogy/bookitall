"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAdminAuth } from "@/features/auth/store";
import { AdminHeader } from "@/features/admin/admin-shell";
import { StatusPill } from "@/features/admin/admin-ui";

type SpecialSchedule = {
  id: string;
  service: string;
  partnerName: string;
  partnerPhone: string | null;
  vehicle: string;
  fromPlace: string;
  toPlace: string;
  departureAt: string;
  details: string;
  note: string | null;
  status: string;
};

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminSpecialSchedulesPage() {
  const token = useAdminAuth((state) => state.accessToken);
  const [schedules, setSchedules] = useState<SpecialSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = () => api<SpecialSchedule[]>("/special-schedules/admin", { token })
      .then((result) => {
        if (active) setSchedules(result.data ?? []);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load special schedules.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [token]);

  return (
    <div>
      <AdminHeader title="Special Schedule" />
      {error ? <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-emerald-100">
        {loading ? <p className="px-4 py-8 text-center text-sm text-slate-500">Loading schedules…</p> : null}
        {!loading && !error && schedules.length ? (
          <div className="divide-y divide-emerald-50">
            {schedules.map((schedule) => (
              <article key={`${schedule.service}-${schedule.id}`} className="grid gap-3 px-4 py-4 md:grid-cols-[1.1fr_1fr_1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{schedule.fromPlace} <span aria-hidden>→</span> {schedule.toPlace}</p>
                  <p className="mt-1 text-xs text-slate-500">{dateTime(schedule.departureAt)}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{schedule.service} · {schedule.vehicle}</p>
                  <p className="mt-1 text-xs text-slate-500">{schedule.details}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{schedule.partnerName}</p>
                  {schedule.partnerPhone ? <p className="mt-1 text-xs text-slate-500">{schedule.partnerPhone}</p> : null}
                  {schedule.note ? <p className="mt-1 truncate text-xs text-slate-500">{schedule.note}</p> : null}
                </div>
                <StatusPill value={schedule.status} />
              </article>
            ))}
          </div>
        ) : null}
        {!loading && !error && !schedules.length ? <p className="px-4 py-8 text-center text-sm text-slate-500">No special schedules have been posted yet.</p> : null}
      </div>
    </div>
  );
}
