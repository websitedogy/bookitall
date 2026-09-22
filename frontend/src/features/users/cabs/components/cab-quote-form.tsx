"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { inr } from "@/shared/lib/format";
import type { Vehicle } from "@/shared/types/catalog";

type Quote = {
  vehicle: Vehicle;
  distanceKm: number;
  estimatedFare: number;
  etaMinutes: number;
};

export function CabQuoteForm() {
  const token = useAuth((s) => s.accessToken);
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState("");
  const pickup = { lat: 17.4483, lng: 78.3915, label: "HITEC City" };
  const drop = { lat: 17.3616, lng: 78.4747, label: "Charminar" };

  async function quote(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await api<Quote[]>("/cabs/quote", {
        method: "POST",
        body: JSON.stringify({
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropLat: drop.lat,
          dropLng: drop.lng,
        }),
      });
      setQuotes(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quote failed");
    }
  }

  async function book(vehicleId: string) {
    if (!token) {
      router.push("/login");
      return;
    }
    const created = await api<{ id: string }>("/bookings", {
      method: "POST",
      token,
      body: JSON.stringify({
        type: "CAB",
        details: {
          vehicleId,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropLat: drop.lat,
          dropLng: drop.lng,
          pickupLabel: pickup.label,
          dropLabel: drop.label,
        },
      }),
    });
    await api(`/bookings/${created.data?.id}/pay`, {
      method: "POST",
      token,
      body: JSON.stringify({ method: "UPI" }),
    });
    router.push("/my-bookings");
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={quote} className="rounded-[2rem] bg-[var(--paper)] p-6">
        <label className="block text-sm">
          Pickup
          <input readOnly value={pickup.label} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
        </label>
        <label className="mt-4 block text-sm">
          Drop
          <input readOnly value={drop.label} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
        </label>
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        <button className="mt-6 w-full rounded-full bg-[var(--teal-dark)] py-3 text-[var(--paper)]">Get fares</button>
      </form>
      <div className="space-y-4">
        {quotes.map((quoteItem) => (
          <div key={quoteItem.vehicle.id} className="flex items-center justify-between rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-5">
            <div>
              <p className="serif text-2xl">{quoteItem.vehicle.name}</p>
              <p className="text-sm text-[var(--ink-soft)]">
                {quoteItem.vehicle.category} · {quoteItem.distanceKm} km · {quoteItem.etaMinutes} min
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{inr(quoteItem.estimatedFare)}</p>
              <button
                type="button"
                onClick={() => book(quoteItem.vehicle.id)}
                className="mt-2 rounded-full bg-[var(--gold)] px-4 py-2 text-sm"
              >
                Book
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
