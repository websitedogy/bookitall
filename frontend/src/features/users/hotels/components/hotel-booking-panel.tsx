"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { inr } from "@/shared/lib/format";
import type { Hotel } from "@/shared/types/catalog";

export function HotelBookingPanel({ hotel }: { hotel: Hotel }) {
  const token = useAuth((s) => s.accessToken);
  const router = useRouter();
  const rooms = hotel.roomTypes ?? [];
  const [roomTypeId, setRoomTypeId] = useState(rooms[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState("2026-09-12");
  const [checkOut, setCheckOut] = useState("2026-09-14");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selected = rooms.find((r) => r.id === roomTypeId);

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
          type: "HOTEL",
          details: { hotelId: hotel.id, roomTypeId, checkIn, checkOut, guests: 2 },
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
    <aside className="h-fit rounded-[2rem] bg-[var(--paper)] p-6 shadow-[0_30px_60px_-40px_rgba(20,32,28,0.6)]">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">Reserve</p>
      <h2 className="serif mt-2 text-3xl">Hold the room</h2>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          Room
          <select
            className="mt-1 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3"
            value={roomTypeId}
            onChange={(e) => setRoomTypeId(e.target.value)}
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} · {inr(room.pricePerNight)}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Check-in
            <input
              type="date"
              className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Check-out
            <input
              type="date"
              className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </label>
        </div>
        {selected ? (
          <p className="text-sm text-[var(--ink-soft)]">
            Sleeps {selected.maxGuests}. Tax added at checkout.
          </p>
        ) : null}
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <button
          disabled={loading || !rooms.length}
          className="w-full rounded-full bg-[var(--teal-dark)] py-3 text-[var(--paper)]"
        >
          {loading ? "Booking…" : "Pay and confirm"}
        </button>
      </form>
    </aside>
  );
}
