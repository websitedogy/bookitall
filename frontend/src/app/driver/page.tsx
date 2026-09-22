"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { BookingsList } from "@/features/booking/components/bookings-list";
import { io } from "socket.io-client";
import { WS_URL } from "@/shared/lib/api";

export default function DriverHomePage() {
  const token = useAuth((s) => s.accessToken);
  const [lat, setLat] = useState(17.448);
  const [lng, setLng] = useState(78.391);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!token || !online) return;
    const socket = io(WS_URL, { auth: { token } });
    const timer = setInterval(() => {
      socket.emit("gps:ping", { latitude: lat, longitude: lng });
    }, 5000);
    return () => {
      clearInterval(timer);
      socket.disconnect();
    };
  }, [token, online, lat, lng]);

  async function ping(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    await api("/gps/ping", {
      method: "POST",
      token,
      body: JSON.stringify({ latitude: Number(lat), longitude: Number(lng) }),
    });
    setOnline(true);
  }

  return (
    <div>
      <h1 className="serif mt-2 text-4xl">On the road</h1>
      <form onSubmit={ping} className="mt-6 flex flex-wrap gap-3">
        <input value={lat} onChange={(e) => setLat(Number(e.target.value))} className="rounded-full border px-4 py-2" />
        <input value={lng} onChange={(e) => setLng(Number(e.target.value))} className="rounded-full border px-4 py-2" />
        <button className="rounded-full bg-[var(--gold)] px-5 py-2">{online ? "Sharing GPS" : "Go online"}</button>
      </form>
      <div className="mt-8">
        <BookingsList scope="orders" emptyHint="No rides" />
      </div>
    </div>
  );
}
