"use client";

import { FormEvent, useState } from "react";
import { api } from "@/shared/lib/api";

const TOPICS = [
  "Booking help",
  "Payment or refund",
  "Vendor listing",
  "Partnership",
  "Careers",
  "Press / media",
  "Other",
];

export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [booking, setBooking] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          topic,
          subject: `${topic}${city.trim() ? ` · ${city.trim()}` : ""}`,
          message: city.trim() ? `${message.trim()}\n\nCity: ${city.trim()}` : message.trim(),
          bookingRef: booking.trim() || undefined,
        }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl bg-white p-6 ring-1 ring-[var(--border)] md:p-8">
        <h2 className="text-xl font-semibold tracking-tight">Message received</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Support will see this in the admin desk. Keep your mobile handy if we need to call.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-[var(--border)] md:p-8">
      <h2 className="text-xl font-semibold tracking-tight">Write to us</h2>
      <p className="text-sm text-[var(--text-muted)]">This creates a support ticket for the Hyderabad desk — not just an email draft.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={field} />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit mobile"
          inputMode="numeric"
          className={field}
        />
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={field} />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={field} />
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>
          {TOPICS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <input value={booking} onChange={(e) => setBooking(e.target.value)} placeholder="Booking number or listing (optional)" className={field} />
      </div>
      <textarea
        required
        minLength={8}
        rows={7}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe the issue or request in detail"
        className={field}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

const field = "w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm";
