"use client";

import { FormEvent, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { BookingsList } from "@/features/booking/components/bookings-list";

export default function TechnicianHomePage() {
  const token = useAuth((s) => s.accessToken);
  const [lat, setLat] = useState(17.442);
  const [lng, setLng] = useState(78.348);

  async function ping(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    await api("/gps/ping", {
      method: "POST",
      token,
      body: JSON.stringify({ latitude: Number(lat), longitude: Number(lng) }),
    });
  }

  return (
    <div>
      <h1 className="serif mt-2 text-4xl">Field jobs</h1>
      <form onSubmit={ping} className="mt-6 flex flex-wrap gap-3">
        <input value={lat} onChange={(e) => setLat(Number(e.target.value))} className="rounded-full border px-4 py-2" />
        <input value={lng} onChange={(e) => setLng(Number(e.target.value))} className="rounded-full border px-4 py-2" />
        <button className="rounded-full bg-[var(--gold)] px-5 py-2">Share location</button>
      </form>
      <div className="mt-8">
        <BookingsList scope="orders" emptyHint="No jobs" />
      </div>
    </div>
  );
}
