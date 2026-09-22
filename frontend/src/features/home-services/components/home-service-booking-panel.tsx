"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import type { HomeService } from "@/shared/types/catalog";

export function HomeServiceBookingPanel({ service }: { service: HomeService }) {
  const token = useAuth((s) => s.accessToken);
  const router = useRouter();
  const [scheduledAt, setScheduledAt] = useState("2026-08-20T11:00");
  const [address, setAddress] = useState("12th floor, Raheja Mindspace, Madhapur");
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
          type: "HOME_SERVICE",
          details: { serviceId: service.id, scheduledAt, address },
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
      <h2 className="serif text-3xl">Book a slot</h2>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          When
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3"
          />
        </label>
        <label className="block text-sm">
          Address
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3"
            rows={3}
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
