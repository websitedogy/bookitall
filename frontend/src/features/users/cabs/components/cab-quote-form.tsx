"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { ArrowLeft, LocateFixed, MapPin, Plus, X } from "lucide-react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import { inr } from "@/shared/lib/format";
import {
  getExactPosition,
  getQuickPosition,
  locateExactPlace,
  readRecentLocations,
  readSavedLocation,
  rememberRecentLocation,
  type SavedLocation,
} from "@/shared/lib/geo";
import { loadLeaflet, placeLeafletPin, type LeafletMap, type LeafletMarker } from "@/shared/lib/leaflet-map";

type CategoryId = "car" | "auto" | "van";
type ClassId = "hatchback" | "sedan" | "suv" | "auto-3" | "auto-10" | "van-10";
type TripType = "now" | "schedule";
type Step = "category" | "class" | "trip" | "route" | "vehicles" | "fare";
type Pin = { label: string; lat: number; lng: number };
type MapTarget = "pickup" | "drop" | number | null;

type FareOption = {
  id: string;
  fareClass: ClassId;
  vehicleId: string | null;
  category: CategoryId;
  name: string;
  description: string;
  seats: number;
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  toll: number;
  tax: number;
  subtotal: number;
  total: number;
  fareKind: "estimated";
};

type Quote = {
  distanceKm: number;
  durationMinutes: number;
  fareKind: "estimated";
  notice: string;
  options: FareOption[];
};

const DRAFT_KEY = "bookitall-cab-booking";
const HYDERABAD = { lat: 17.385, lng: 78.4867 };

const CATEGORIES: { id: CategoryId; name: string; emoji: string; description: string; seats: string }[] = [
  { id: "car", name: "Car", emoji: "🚗", description: "Hatchback, Sedan, SUV", seats: "4–6 passengers" },
  { id: "auto", name: "Auto", emoji: "🛺", description: "3-Seater, 10-seater", seats: "3 or 10 passengers" },
  { id: "van", name: "10-Seater", emoji: "🚐", description: "Passenger van, subject to permitted seating capacity", seats: "10 passengers" },
];

const CLASSES: { id: ClassId; category: CategoryId; name: string; emoji: string; description: string; seats: string }[] = [
  { id: "hatchback", category: "car", name: "Hatchback", emoji: "🚗", description: "Compact car for city rides", seats: "4 passengers" },
  { id: "sedan", category: "car", name: "Sedan", emoji: "🚗", description: "Comfortable sedan", seats: "4 passengers" },
  { id: "suv", category: "car", name: "SUV", emoji: "🚙", description: "More space for family and luggage", seats: "6 passengers" },
  { id: "auto-3", category: "auto", name: "3-Seater", emoji: "🛺", description: "Auto rickshaw", seats: "3 passengers" },
  { id: "auto-10", category: "auto", name: "10-Seater", emoji: "🛺", description: "Shared auto, subject to permitted seats", seats: "10 passengers" },
  { id: "van-10", category: "van", name: "10-Seater", emoji: "🚐", description: "Passenger van, subject to permitted seating capacity", seats: "10 passengers" },
];

const LATER = [
  { name: "Round Trip", text: "A return journey is not open for this launch." },
  { name: "Outstation", text: "Intercity rides are not open for this launch." },
];

function classMeta(id: ClassId) {
  return CLASSES.find((item) => item.id === id) ?? CLASSES[0];
}

function localStamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CabBookingFlow() {
  const token = useAuth((s) => s.accessToken);
  const router = useRouter();
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [fareClass, setFareClass] = useState<ClassId | null>(null);
  const [tripType, setTripType] = useState<TripType>("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [pickup, setPickup] = useState<Pin | null>(null);
  const [drop, setDrop] = useState<Pin | null>(null);
  const [stops, setStops] = useState<Pin[]>([]);
  const [landmark, setLandmark] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selected, setSelected] = useState<FareOption | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mapTarget, setMapTarget] = useState<MapTarget>(null);
  const restored = useRef(false);
  const skipDraft = useRef(true);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as Partial<{
        step: Step;
        category: CategoryId;
        fareClass: ClassId;
        tripType: TripType;
        scheduledAt: string;
        pickup: Pin;
        drop: Pin;
        stops: Pin[];
        landmark: string;
        selected: FareOption;
      }>;
      if (draft.category) setCategory(draft.category);
      if (draft.fareClass) setFareClass(draft.fareClass);
      if (draft.tripType) setTripType(draft.tripType);
      if (draft.scheduledAt) setScheduledAt(draft.scheduledAt);
      if (draft.pickup) setPickup(draft.pickup);
      if (draft.drop) setDrop(draft.drop);
      if (draft.stops) setStops(draft.stops);
      if (draft.landmark) setLandmark(draft.landmark);
      if (draft.selected) setSelected(draft.selected);
      if (draft.step) setStep(draft.step);
    } catch {
      window.sessionStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (skipDraft.current) {
      skipDraft.current = false;
      return;
    }
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ step, category, fareClass, tripType, scheduledAt, pickup, drop, stops, landmark, selected }),
    );
  }, [step, category, fareClass, tripType, scheduledAt, pickup, drop, stops, landmark, selected]);

  function remember() {
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ step, category, fareClass, tripType, scheduledAt, pickup, drop, stops, landmark, selected }),
    );
  }

  function chooseCategory(next: CategoryId) {
    setError("");
    setCategory(next);
    setSelected(null);
    setQuote(null);
    if (next === "van") {
      setFareClass("van-10");
      setStep("trip");
      return;
    }
    setFareClass(null);
    setStep("class");
  }

  function chooseClass(next: ClassId) {
    setError("");
    setFareClass(next);
    setSelected(null);
    setQuote(null);
    setStep("trip");
  }

  function continueTrip() {
    setError("");
    if (tripType === "schedule") {
      const when = new Date(scheduledAt);
      if (!scheduledAt || Number.isNaN(when.getTime()) || when.getTime() < Date.now() - 60_000) {
        setError("Choose a future date and time.");
        return;
      }
    }
    setStep("route");
  }

  async function loadQuote() {
    if (!pickup || !drop || !category) return;
    if (Math.abs(pickup.lat - drop.lat) < 0.0004 && Math.abs(pickup.lng - drop.lng) < 0.0004) {
      setError("Pickup and destination need to be different places.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api<Quote>("/cabs/quote", {
        method: "POST",
        body: JSON.stringify({
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropLat: drop.lat,
          dropLng: drop.lng,
          category,
          stops: stops.filter((stop) => stop.lat && stop.lng).map((stop) => ({ lat: stop.lat, lng: stop.lng })),
        }),
      });
      const data = result.data;
      if (!data?.options?.length) {
        setError("No fare is available for this ride.");
        return;
      }
      setQuote(data);
      const match = data.options.find((option) => option.fareClass === fareClass) ?? data.options[0];
      setSelected(match);
      setStep("vehicles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate the fare");
    } finally {
      setBusy(false);
    }
  }

  async function confirmRide() {
    if (!selected || !pickup || !drop || !fareClass) return;
    remember();
    if (!token) {
      router.push("/login?next=/cabs");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await api<{ id: string }>("/bookings", {
        method: "POST",
        token,
        body: JSON.stringify({
          type: "CAB",
          details: {
            fareClass: selected.fareClass,
            ...(selected.vehicleId ? { vehicleId: selected.vehicleId } : {}),
            tripType,
            ...(tripType === "schedule" ? { scheduledAt } : {}),
            pickupLat: pickup.lat,
            pickupLng: pickup.lng,
            dropLat: drop.lat,
            dropLng: drop.lng,
            pickupLabel: pickup.label,
            dropLabel: drop.label,
            ...(landmark.trim() ? { landmark: landmark.trim() } : {}),
            stops: stops.map((stop) => ({ lat: stop.lat, lng: stop.lng, label: stop.label })),
            fareNotice: quote?.notice,
          },
        }),
      });
      window.sessionStorage.removeItem(DRAFT_KEY);
      router.push(created.data?.id ? `/my-bookings/${created.data.id}` : "/my-bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not book this ride");
      setBusy(false);
    }
  }

  function back() {
    setError("");
    if (step === "class") setStep("category");
    else if (step === "trip") setStep(category === "van" ? "category" : "class");
    else if (step === "route") setStep("trip");
    else if (step === "vehicles") setStep("route");
    else if (step === "fare") setStep("vehicles");
  }

  const mapPin = mapTarget === "pickup" ? pickup : mapTarget === "drop" ? drop : typeof mapTarget === "number" ? stops[mapTarget] : null;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 md:py-8">
      {step !== "category" ? (
        <button type="button" onClick={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f7d6e]">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
      ) : null}

      {step === "category" ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f7d6e]">Cab & Transport</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#12241f]">Where would you like to go?</h1>
          <p className="mt-1 text-sm text-[#5b6e68]">Choose a vehicle. The fare is estimated after pickup and destination.</p>
          <div className="mt-5 space-y-3">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => chooseCategory(item.id)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left ring-1 ring-emerald-100"
              >
                <span className="text-3xl" aria-hidden>
                  {item.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-[#12241f]">{item.name}</span>
                  <span className="mt-0.5 block text-sm text-[#5b6e68]">{item.description}</span>
                  <span className="mt-1 block text-xs font-medium text-[#0f7d6e]">{item.seats}</span>
                </span>
              </button>
            ))}
          </div>
          <Link href="/users/cabs" className="mt-5 inline-block text-sm font-semibold text-[#0f7d6e]">
            Browse listed cab services
          </Link>
        </section>
      ) : null}

      {step === "class" && category ? (
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-[#12241f]">
            {category === "car" ? "Choose a car" : "Choose an auto"}
          </h1>
          <div className="mt-5 space-y-3">
            {CLASSES.filter((item) => item.category === category).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => chooseClass(item.id)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left ring-1 ring-emerald-100"
              >
                <span className="text-3xl" aria-hidden>
                  {item.emoji}
                </span>
                <span>
                  <span className="block text-base font-semibold text-[#12241f]">{item.name}</span>
                  <span className="mt-0.5 block text-sm text-[#5b6e68]">{item.description}</span>
                  <span className="mt-1 block text-xs font-medium text-[#0f7d6e]">{item.seats}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === "trip" ? (
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-[#12241f]">How do you want to ride?</h1>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => {
                setTripType("now");
                setError("");
              }}
              className={`w-full rounded-2xl px-4 py-4 text-left ring-1 ${tripType === "now" ? "bg-[#f3faf7] ring-[#0f7d6e]" : "bg-white ring-emerald-100"}`}
            >
              <span className="block text-base font-semibold text-[#12241f]">Ride Now</span>
              <span className="mt-0.5 block text-sm text-[#5b6e68]">Find an available driver immediately.</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTripType("schedule");
                setError("");
                if (!scheduledAt) setScheduledAt(localStamp(new Date(Date.now() + 60 * 60 * 1000)));
              }}
              className={`w-full rounded-2xl px-4 py-4 text-left ring-1 ${tripType === "schedule" ? "bg-[#f3faf7] ring-[#0f7d6e]" : "bg-white ring-emerald-100"}`}
            >
              <span className="block text-base font-semibold text-[#12241f]">Schedule a Ride</span>
              <span className="mt-0.5 block text-sm text-[#5b6e68]">Select a future date and time.</span>
            </button>
            {tripType === "schedule" ? (
              <label className="block text-sm font-medium text-[#12241f]">
                Date and time
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  min={localStamp(new Date())}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-3"
                />
              </label>
            ) : null}
            {LATER.map((item) => (
              <div key={item.name} className="rounded-2xl bg-[#f7fbf9] px-4 py-4 ring-1 ring-emerald-50">
                <p className="text-base font-semibold text-[#8aa39b]">{item.name}</p>
                <p className="mt-0.5 text-sm text-[#8aa39b]">{item.text}</p>
              </div>
            ))}
          </div>
          {error ? <p className="mt-3 text-sm text-[#b91c1c]">{error}</p> : null}
          <button type="button" onClick={continueTrip} className="mt-5 h-12 w-full rounded-full bg-[#0f7d6e] text-base font-semibold text-white">
            Continue
          </button>
        </section>
      ) : null}

      {step === "route" ? (
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-[#12241f]">Pickup and destination</h1>
          <div className="mt-5 space-y-4">
            <PlaceField
              label="Pickup location"
              pin={pickup}
              allowCurrent
              onPick={setPickup}
              onMap={() => setMapTarget("pickup")}
            />
            <label className="block text-sm font-medium text-[#12241f]">
              Pickup landmark
              <input
                value={landmark}
                onChange={(event) => setLandmark(event.target.value)}
                placeholder="Near a shop, gate, or landmark"
                className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-3 text-sm"
              />
            </label>
            {stops.map((stop, index) => (
              <PlaceField
                key={`stop-${index}`}
                label={`Stop ${index + 1}`}
                pin={stop.label ? stop : null}
                onPick={(next) => setStops((current) => current.map((item, itemIndex) => (itemIndex === index ? next : item)))}
                onMap={() => setMapTarget(index)}
                onRemove={() => setStops((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              />
            ))}
            {stops.length < 3 ? (
              <button
                type="button"
                onClick={() => setStops((current) => [...current, { label: "", lat: 0, lng: 0 }])}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f7d6e]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add a stop
              </button>
            ) : null}
            <PlaceField label="Destination" pin={drop} onPick={setDrop} onMap={() => setMapTarget("drop")} />
          </div>
          {error ? <p className="mt-3 text-sm text-[#b91c1c]">{error}</p> : null}
          <button
            type="button"
            disabled={busy || !pickup || !drop || stops.some((stop) => !stop.label || !stop.lat || !stop.lng)}
            onClick={() => void loadQuote()}
            className="mt-5 h-12 w-full rounded-full bg-[#0f7d6e] text-base font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Calculating fare…" : "See vehicles"}
          </button>
        </section>
      ) : null}

      {step === "vehicles" && quote ? (
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-[#12241f]">Available vehicles</h1>
          <p className="mt-1 text-sm text-[#5b6e68]">
            {quote.distanceKm} km · about {quote.durationMinutes} min · estimated fare
          </p>
          <div className="mt-5 space-y-3">
            {quote.options.map((option) => {
              const meta = classMeta(option.fareClass);
              const active = selected?.id === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelected(option);
                    setFareClass(option.fareClass);
                    setStep("fare");
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left ring-1 ${active ? "bg-[#f3faf7] ring-[#0f7d6e]" : "bg-white ring-emerald-100"}`}
                >
                  <span className="text-3xl" aria-hidden>
                    {meta.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-[#12241f]">{option.name}</span>
                    <span className="mt-0.5 block text-sm text-[#5b6e68]">
                      {option.description} · {option.seats} seats
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-base font-semibold text-[#12241f]">{inr(option.total)}</span>
                    <span className="block text-[11px] font-medium uppercase tracking-wide text-[#0f7d6e]">Estimated</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === "fare" && selected && quote && pickup && drop ? (
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-[#12241f]">Fare details</h1>
          <p className="mt-2 rounded-2xl bg-[#fff8e8] px-3 py-3 text-sm text-[#7a5b12]">{quote.notice}</p>
          <dl className="mt-4 divide-y divide-emerald-50 rounded-2xl bg-white px-4 ring-1 ring-emerald-100">
            <FareRow label="Pickup" value={landmark.trim() ? `${pickup.label} · ${landmark.trim()}` : pickup.label} />
            {stops.map((stop, index) => (
              <FareRow key={`${stop.label}-${index}`} label={`Stop ${index + 1}`} value={stop.label} />
            ))}
            <FareRow label="Destination" value={drop.label} />
            <FareRow label="Estimated distance" value={`${quote.distanceKm} km`} />
            <FareRow label="Estimated duration" value={`${quote.durationMinutes} min`} />
            <FareRow label="Vehicle" value={`${selected.name} · ${selected.seats} seats`} />
            <FareRow label="Trip" value={tripType === "now" ? "Ride Now" : `Scheduled · ${new Date(scheduledAt).toLocaleString("en-IN")}`} />
            <FareRow label="Base fare" value={inr(selected.baseFare)} />
            <FareRow label="Distance charge" value={inr(selected.distanceCharge)} />
            {selected.timeCharge > 0 ? <FareRow label="Time charge" value={inr(selected.timeCharge)} /> : null}
            <FareRow label="Toll or parking" value="Extra only if the route charges them" />
            <FareRow label="Taxes and fees" value={inr(selected.tax)} />
            <FareRow label="Total estimated fare" value={inr(selected.total)} strong />
          </dl>
          {error ? <p className="mt-3 text-sm text-[#b91c1c]">{error}</p> : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmRide()}
            className="mt-5 h-12 w-full rounded-full bg-[#0f7d6e] text-base font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Booking…" : token ? "Confirm estimated fare" : "Sign in to confirm"}
          </button>
        </section>
      ) : null}

      <PinMap
        open={mapTarget !== null}
        title={mapTarget === "drop" ? "Destination" : typeof mapTarget === "number" ? `Stop ${mapTarget + 1}` : "Pickup"}
        lat={mapPin?.lat || HYDERABAD.lat}
        lng={mapPin?.lng || HYDERABAD.lng}
        onClose={() => setMapTarget(null)}
        onConfirm={(pin) => {
          if (mapTarget === "pickup") setPickup(pin);
          else if (mapTarget === "drop") setDrop(pin);
          else if (typeof mapTarget === "number") {
            setStops((current) => current.map((item, index) => (index === mapTarget ? pin : item)));
          }
          rememberRecentLocation({ line1: pin.label, line2: "", full: pin.label, lat: pin.lat, lng: pin.lng, source: "search" });
          setMapTarget(null);
        }}
      />
    </div>
  );
}

function FareRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 text-sm">
      <dt className="text-[#5b6e68]">{label}</dt>
      <dd className={`max-w-[60%] text-right ${strong ? "text-base font-semibold text-[#12241f]" : "font-medium text-[#12241f]"}`}>{value}</dd>
    </div>
  );
}

function PlaceField({
  label,
  pin,
  allowCurrent,
  onPick,
  onMap,
  onRemove,
}: {
  label: string;
  pin: Pin | null;
  allowCurrent?: boolean;
  onPick: (pin: Pin) => void;
  onMap: () => void;
  onRemove?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Pin[]>([]);
  const [saved, setSaved] = useState<SavedLocation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const recent = readRecentLocations().filter((place) => place.lat != null && place.lng != null);
    const current = readSavedLocation();
    const list = current?.lat != null && current.lng != null ? [current, ...recent] : recent;
    const seen = new Set<string>();
    setSaved(
      list.filter((place) => {
        const key = (place.full || place.line1).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    );
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { full?: string; line1?: string; lat?: number; lng?: number }[];
        setHits(
          (Array.isArray(data) ? data : [])
            .filter((item) => item.lat != null && item.lng != null)
            .map((item) => ({ label: item.full || item.line1 || q, lat: Number(item.lat), lng: Number(item.lng) })),
        );
      } catch {
        setHits([]);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  async function useCurrent() {
    setBusy(true);
    setError("");
    try {
      const position = await getExactPosition(12000).catch(() => getQuickPosition(6000));
      const place = await locateExactPlace(position.coords.latitude, position.coords.longitude);
      const next = {
        label: place.full || place.line1,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      onPick(next);
      rememberRecentLocation({ ...place, lat: next.lat, lng: next.lng, source: "gps" });
      setQuery("");
      setOpen(false);
    } catch {
      setError("Could not read your current location.");
    } finally {
      setBusy(false);
    }
  }

  function choose(next: Pin) {
    onPick(next);
    rememberRecentLocation({ line1: next.label, line2: "", full: next.label, lat: next.lat, lng: next.lng, source: "search" });
    setQuery("");
    setHits([]);
    setOpen(false);
  }

  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-emerald-100">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0f7d6e]">{label}</p>
        <span className="flex items-center gap-3">
          {onRemove ? (
            <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b6e68]">
              <X className="h-3.5 w-3.5" aria-hidden />
              Remove
            </button>
          ) : null}
          <button type="button" onClick={onMap} className="text-xs font-semibold text-[#0f7d6e]">
            Map
          </button>
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-[#0f7d6e]" aria-hidden />
        <input
          value={open ? query : pin?.label || ""}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          placeholder="Search an address"
          className="w-full border-0 bg-transparent text-sm text-[#12241f] outline-none placeholder:text-[#8aa39b]"
        />
      </div>
      {allowCurrent ? (
        <button type="button" onClick={() => void useCurrent()} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0f7d6e]">
          <LocateFixed className="h-3.5 w-3.5" aria-hidden />
          {busy ? "Finding you…" : "Use current location"}
        </button>
      ) : null}
      {error ? <p className="mt-1 text-xs text-[#b91c1c]">{error}</p> : null}
      {open && hits.length ? (
        <ul className="mt-2 max-h-48 overflow-auto rounded-xl bg-[#f7fbf9]">
          {hits.map((hit) => (
            <li key={`${hit.lat}-${hit.lng}-${hit.label}`}>
              <button type="button" onClick={() => choose(hit)} className="block w-full px-3 py-2 text-left text-sm text-[#12241f]">
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && !query.trim() && saved.length ? (
        <ul className="mt-2 space-y-1">
          {saved.slice(0, 4).map((place) => (
            <li key={place.full || place.line1}>
              <button
                type="button"
                onClick={() => choose({ label: place.full || place.line1, lat: Number(place.lat), lng: Number(place.lng) })}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-[#3d4f4a]"
              >
                {place.full || place.line1}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PinMap({
  open,
  title,
  lat,
  lng,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  lat: number;
  lng: number;
  onClose: () => void;
  onConfirm: (pin: Pin) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const centerRef = useRef({ lat, lng });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const el = hostRef.current;
    if (!el) return;
    let cancelled = false;
    let cleanup = () => {};
    centerRef.current = { lat, lng };
    async function boot() {
      const L = await loadLeaflet();
      if (cancelled || !el) return;
      const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([lat, lng], 16);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      markerRef.current = await placeLeafletPin(map, null, lat, lng, title);
      const onMoveEnd = () => {
        const center = map.getCenter();
        centerRef.current = { lat: center.lat, lng: center.lng };
        markerRef.current?.setLatLng([center.lat, center.lng]);
      };
      map.on("moveend", onMoveEnd);
      requestAnimationFrame(() => map.invalidateSize());
      cleanup = () => {
        map.off("moveend", onMoveEnd);
        markerRef.current?.remove();
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    }
    void boot();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [open, lat, lng, title]);

  if (!open) return null;

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const center = centerRef.current;
      const place = await locateExactPlace(center.lat, center.lng);
      onConfirm({ label: place.full || place.line1, lat: center.lat, lng: center.lng });
    } catch {
      setError("Could not read that pin. Search the address instead.");
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#e7eeea]">
      <div ref={hostRef} className="min-h-0 flex-1" />
      <div className="bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <h2 className="text-lg font-semibold text-[#12241f]">Move the map to set {title.toLowerCase()}</h2>
        {error ? <p className="mt-2 text-sm text-[#b91c1c]">{error}</p> : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-full bg-[#f3f6f4] text-sm font-semibold text-[#12241f]">
            Cancel
          </button>
          <button type="button" disabled={busy} onClick={() => void confirm()} className="h-11 rounded-full bg-[#0f7d6e] text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Reading pin…" : "Use this pin"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
