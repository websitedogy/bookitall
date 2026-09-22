"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import type { HomeService, Hotel, Tour, Vehicle } from "@/shared/types/catalog";

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
      <h1 className="serif mt-2 text-4xl">Listings</h1>
      <Section title="Hotels" items={hotels.map((h) => h.name)} />
      <Section title="Tours" items={tours.map((t) => t.name)} />
      <Section title="Vehicles" items={vehicles.map((v) => `${v.name} · ${v.category}`)} />
      <Section title="Home services" items={services.map((s) => s.name)} />
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--teal)]">{title}</h2>
      <div className="mt-3 grid gap-2">
        {items.length ? items.map((item) => (
          <div key={item} className="rounded-2xl bg-[var(--paper)] px-4 py-3">
            {item}
          </div>
        )) : <p className="text-sm text-[var(--ink-soft)]">None on this account.</p>}
      </div>
    </section>
  );
}
