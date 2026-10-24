"use client";

import { useEffect, useState } from "react";
import { Building2, CarFront, Compass, Wrench } from "lucide-react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import type { HomeService, Hotel, Tour, Vehicle } from "@/shared/types/catalog";
import { CabSchedulesManager } from "@/features/vendors/services/cab-schedules-manager";

export default function PartnerListingsPage() {
  const token = useAuth((s) => s.accessToken);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<HomeService[]>([]);

  useEffect(() => {
    if (!token) return;
    api<Hotel[]>("/hotels/mine", { token }).then((r) => setHotels(r.data ?? [])).catch(() => undefined);
    api<Tour[]>("/tours/mine", { token }).then((r) => setTours(r.data ?? [])).catch(() => undefined);
    api<Vehicle[]>("/cabs/mine", { token }).then((r) => setVehicles(r.data ?? [])).catch(() => undefined);
    api<HomeService[]>("/home-services/mine", { token }).then((r) => setServices(r.data ?? [])).catch(() => undefined);
  }, [token]);

  return (
    <div>
      <div className="mb-8 border-b border-[var(--line)] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Partner workspace</p>
        <h1 className="serif mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your listings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
          Manage your services and share upcoming cab journeys with travellers.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Section title="Hotels" items={hotels.map((h) => h.name)} icon={Building2} />
        <Section title="Tours" items={tours.map((t) => t.name)} icon={Compass} />
        <Section title="Vehicles" items={vehicles.map((v) => `${v.name} · ${v.category}`)} icon={CarFront} />
        <Section title="Home services" items={services.map((s) => s.name)} icon={Wrench} />
      </div>
      <CabSchedulesManager vehicles={vehicles} />
    </div>
  );
}

function Section({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: typeof Building2;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_8px_24px_-22px_rgba(15,23,42,0.5)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="truncate text-sm font-semibold text-[var(--ink)]">{title}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-[var(--ink-soft)]">{items.length}</span>
      </div>
      <div className="mt-4 border-t border-[var(--border)] pt-3">
        {items.length ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item} className="break-words text-sm leading-5 text-[var(--ink-soft)]">{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">No listings yet.</p>
        )}
      </div>
    </section>
  );
}
