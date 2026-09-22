"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import type { Tour } from "@/shared/types/catalog";

export function TourBookingPanel({ tour }: { tour: Tour }) {
  const token = useAuth((s) => s.accessToken);
  const router = useRouter();
  const [travelers, setTravelers] = useState(2);
  const [travelDate, setTravelDate] = useState("2026-10-02");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await api<{ id: string }>("/bookings", {
        method: "POST",
        token,
        body: JSON.stringify({
          type: "TOUR",
          details: { tourId: tour.id, travelers, travelDate },
        }),
      });
      await api(`/bookings/${created.data?.id}/pay`, {
        method: "POST",
        token,
        body: JSON.stringify({ method: "UPI" }),
      });
      router.push("/my-bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="h-fit rounded-[2rem] bg-[var(--paper)] p-6">
      <h2 className="serif text-3xl">Join this trip</h2>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          Travelers
          <input
            type="number"
            min={1}
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3"
          />
        </label>
        <label className="block text-sm">
          Date
          <input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3"
          />
        </label>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <button disabled={loading} className="w-full rounded-full bg-[var(--teal-dark)] py-3 text-[var(--paper)]">
          {loading ? "Booking…" : "Pay and confirm"}
        </button>
      </form>
    </aside>
  );
}
