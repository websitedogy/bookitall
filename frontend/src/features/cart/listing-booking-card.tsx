"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { LocateFixed, MapPin, X } from "lucide-react";
import { useCart } from "@/features/cart/store";
import { PickupMapPicker } from "@/features/cart/pickup-map-picker";
import { defaultDate, defaultSlot, pad } from "@/features/cart/pricing";
import { inr, priceUnitWord } from "@/shared/lib/format";
import { getExactPosition, locateExactPlace, writeSavedLocation } from "@/shared/lib/geo";
import { withBuildingDetails } from "@/shared/lib/format-address";

export type BookableListing = {
  id: string;
  title: string;
  vendor: string;
  location: string;
  image: string;
  categoryId: string;
  category: string;
  unitPrice?: number | null;
  price?: string;
  priceUnit?: string;
  bookable?: boolean;
  status?: string;
};

function soonSlot() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ListingBookingCard({ listing }: { listing: BookableListing }) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const unitPrice = listing.unitPrice ?? (listing.price ? Number(listing.price) : 0);
  const canBook = Boolean(listing.bookable && unitPrice > 0);
  const isHotel = listing.categoryId === "hotels";
  const isTour = listing.categoryId === "tours";
  const isCab = listing.categoryId === "cabs";
  const isStay = isHotel || isTour;

  const [scheduledAt, setScheduledAt] = useState(defaultSlot(1));
  const [checkIn, setCheckIn] = useState(defaultDate(1));
  const [checkOut, setCheckOut] = useState(defaultDate(2));
  const [address, setAddress] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropAddress, setDropAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [phase, setPhase] = useState<"idle" | "ask" | "locating" | "map" | "choose" | "schedule">("idle");
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);
  const moveTimer = useRef<number | null>(null);

  const estimate = useMemo(() => {
    if (isHotel) {
      const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
      return unitPrice * nights;
    }
    return unitPrice;
  }, [isHotel, checkIn, checkOut, unitPrice]);

  function exactAddress() {
    return withBuildingDetails(houseNumber, buildingName, isCab ? pickupAddress || address : address);
  }

  function toCartItem(when: string, extras?: { address?: string; lat?: number; lng?: number }) {
    if (isHotel && new Date(checkOut).getTime() <= new Date(checkIn).getTime()) {
      throw new Error("Check-out must be after check-in");
    }
    return {
      listingId: listing.id,
      title: listing.title,
      vendor: listing.vendor,
      location: listing.location,
      image: listing.image,
      categoryId: listing.categoryId,
      category: listing.category,
      unitPrice,
      priceUnit: listing.priceUnit || "",
      quantity: 1,
      scheduledAt: isHotel ? undefined : when,
      address: isHotel ? extras?.address || exactAddress() : isTour ? undefined : exactAddress(),
      notes,
      checkIn: isHotel ? checkIn : undefined,
      checkOut: isHotel ? checkOut : undefined,
      travelers: isTour ? 1 : undefined,
      pickupAddress: isCab ? exactAddress() : undefined,
      dropAddress: isCab ? dropAddress : undefined,
      customerLat: extras?.lat,
      customerLng: extras?.lng,
    };
  }

  function goCheckout(when: string) {
    try {
      setFormError("");
      if (!isStay && !houseNumber.trim() && !buildingName.trim()) {
        setFormError("Add house / flat number or building name.");
        return;
      }
      if (!isStay && !exactAddress().trim()) {
        setFormError("Add house / building number and the service location first.");
        return;
      }
      addItem(toCartItem(when));
      router.push("/checkout");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not book");
    }
  }

  async function applyCoords(lat: number, lng: number, persistGps = false) {
    setCustomerLat(lat);
    setCustomerLng(lng);
    setResolving(true);
    let full = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    try {
      const place = await locateExactPlace(lat, lng);
      full = place.full || [place.line1, place.line2].filter(Boolean).join(", ") || full;
      if (place.houseNumber?.trim()) setHouseNumber(place.houseNumber);
      if (place.buildingName?.trim()) setBuildingName(place.buildingName);
      if (persistGps) writeSavedLocation({ ...place, lat, lng, source: "gps" });
    } catch {
      if (persistGps) writeSavedLocation({ line1: full, line2: "", full, lat, lng, source: "gps" });
    }
    setAddress(full);
    if (isCab) setPickupAddress(full);
    setResolving(false);
    return { lat, lng, address: full };
  }

  async function captureLiveLocation() {
    const pos = await getExactPosition(15000);
    return applyCoords(pos.coords.latitude, pos.coords.longitude, true);
  }

  function onMapMoved(lat: number, lng: number) {
    if (moveTimer.current) window.clearTimeout(moveTimer.current);
    moveTimer.current = window.setTimeout(() => {
      void applyCoords(lat, lng);
    }, 450);
  }

  function openLocationPopup() {
    setFormError("");
    setPhase("ask");
  }

  function stayCheckout() {
    const loc = exactAddress().trim();
    if (!houseNumber.trim() && !buildingName.trim()) {
      setFormError("Add house / flat number or building name so the vendor can find the door.");
      return;
    }
    if (!loc) {
      setFormError("Add the area and city too.");
      return;
    }
    addItem(
      toCartItem(scheduledAt, {
        address: loc,
        lat: customerLat ?? undefined,
        lng: customerLng ?? undefined,
      }),
    );
    router.push("/checkout");
  }

  async function detectLocation() {
    setFormError("");
    setPhase("locating");
    try {
      await captureLiveLocation();
      setPhase("map");
    } catch {
      setFormError(isStay ? "Turn on location, or enter house / flat details below." : "Turn on location so we can send the vendor to you.");
      setPhase("ask");
    }
  }

  function confirmMapLocation() {
    try {
      setFormError("");
      if (!houseNumber.trim() && !buildingName.trim()) {
        setFormError("Add house / flat number or building name so the vendor can find the door.");
        return;
      }
      if (isStay) {
        stayCheckout();
        return;
      }
      setPhase("choose");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not book");
    }
  }

  if (listing.status && listing.status !== "ACCEPTED") {
    return (
      <p className="mt-4 text-sm text-[var(--text-muted)]">
        {listing.status === "HOLD" ? "This vendor is on hold, so the listing cannot be booked." : "This listing is not live yet, so it cannot be booked."}
      </p>
    );
  }

  if (!canBook) {
    return <p className="mt-4 text-sm text-[var(--text-muted)]">This listing has no bookable price yet.</p>;
  }

  if (isStay) {
    return (
      <div className="space-y-3">
        <PriceLine unitPrice={unitPrice} priceUnit={listing.priceUnit} />
        {isHotel ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Check-in">
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={stayInput} />
            </Field>
            <Field label="Check-out">
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={stayInput} />
            </Field>
          </div>
        ) : (
          <Field label="Travel date">
            <input
              type="date"
              value={scheduledAt.slice(0, 10)}
              onChange={(e) => setScheduledAt(`${e.target.value}T10:00`)}
              className={stayInput}
            />
          </Field>
        )}
        <Field label="Notes">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special request" className={stayInput} />
        </Field>
        <p className="text-[13px] text-[#7a6a52]">Estimated {inr(estimate)} before tax.</p>
        {formError && phase === "idle" ? <p className="text-sm text-[var(--error)]">{formError}</p> : null}
        <button type="button" onClick={openLocationPopup} className={stayBtn}>
          Book now
        </button>
        {phase === "ask" || phase === "locating" ? (
          <LocationPopup
            locating={phase === "locating"}
            houseNumber={houseNumber}
            buildingName={buildingName}
            address={address}
            error={formError}
            title={isTour ? "Where should we pick you up?" : "Where are you staying?"}
            subtitle={isTour ? "Share your pickup area for this tour." : "Use GPS, or add your stay address."}
            onClose={() => setPhase("idle")}
            onDetect={() => void detectLocation()}
            onHouse={setHouseNumber}
            onBuilding={setBuildingName}
            onAddress={(value) => {
              setAddress(value);
              setCustomerLat(null);
              setCustomerLng(null);
            }}
            onContinue={() => {
              try {
                setFormError("");
                stayCheckout();
              } catch (err) {
                setFormError(err instanceof Error ? err.message : "Could not book");
              }
            }}
          />
        ) : null}
        {!isHotel && phase === "map" ? (
          <PickupMapPicker
            lat={customerLat}
            lng={customerLng}
            houseNumber={houseNumber}
            buildingName={buildingName}
            address={address}
            locating={customerLat == null}
            resolving={resolving}
            error={formError}
            pickup
            onBack={() => setPhase("ask")}
            onConfirm={confirmMapLocation}
            onHouse={setHouseNumber}
            onBuilding={setBuildingName}
            onMoved={onMapMoved}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      <PriceLine unitPrice={unitPrice} priceUnit={listing.priceUnit} />

      {phase === "idle" || phase === "ask" || phase === "locating" ? (
        <button type="button" onClick={() => setPhase("ask")} className={primaryBtn}>
          Book now
        </button>
      ) : null}

      {phase === "ask" || phase === "locating" ? (
        <LocationPopup
          locating={phase === "locating"}
          houseNumber={houseNumber}
          buildingName={buildingName}
          address={isCab ? pickupAddress || address : address}
          error={formError}
          title="Where should the vendor come?"
          subtitle="Use GPS, or add house / flat details."
          onClose={() => setPhase("idle")}
          onDetect={() => void detectLocation()}
          onHouse={setHouseNumber}
          onBuilding={setBuildingName}
          onAddress={(value) => {
            setAddress(value);
            if (isCab) setPickupAddress(value);
          }}
          onContinue={() => {
            const value = address.trim() || pickupAddress.trim();
            if (!houseNumber.trim() && !buildingName.trim()) {
              setFormError("Add house / flat number or building name.");
              return;
            }
            if (!value) {
              setFormError("Type the area and city too.");
              return;
            }
            setFormError("");
            if (isCab) setPickupAddress(value);
            setAddress(value);
            setPhase("choose");
          }}
        />
      ) : null}

      {phase === "map" ? (
        <PickupMapPicker
          lat={customerLat}
          lng={customerLng}
          houseNumber={houseNumber}
          buildingName={buildingName}
          address={isCab ? pickupAddress || address : address}
          locating={customerLat == null}
          resolving={resolving}
          error={formError}
          pickup
          onBack={() => setPhase("ask")}
          onConfirm={confirmMapLocation}
          onHouse={setHouseNumber}
          onBuilding={setBuildingName}
          onMoved={onMapMoved}
        />
      ) : null}

      {phase === "choose" || phase === "schedule" ? (
        <>
          <div className="rounded-2xl bg-[var(--background-blue)] px-3 py-3">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Service location
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="House / flat no."
                className={`${inputClass} mt-0 bg-white`}
              />
              <input
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                placeholder="Building name"
                className={`${inputClass} mt-0 bg-white`}
              />
            </div>
            <textarea
              value={isCab ? pickupAddress : address}
              onChange={(e) => {
                const value = e.target.value;
                if (isCab) setPickupAddress(value);
                setAddress(value);
              }}
              rows={2}
              placeholder="Street, area, city"
              className={`${inputClass} mt-2 bg-white`}
            />
            <button type="button" onClick={() => void detectLocation()} className="mt-2 text-xs font-semibold text-[var(--primary)]">
              Detect again
            </button>
          </div>

          {isCab ? (
            <Field label="Drop">
              <input value={dropAddress} onChange={(e) => setDropAddress(e.target.value)} placeholder="Drop location" className={inputClass} />
            </Field>
          ) : null}

          {phase === "schedule" ? (
            <Field label="When">
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputClass} />
            </Field>
          ) : null}

          {formError ? <p className="text-sm text-[var(--error)]">{formError}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => goCheckout(soonSlot())} className={primaryBtn}>
              Book now
            </button>
            {phase === "schedule" ? (
              <button type="button" onClick={() => goCheckout(scheduledAt)} className={secondaryBtn}>
                Confirm
              </button>
            ) : (
              <button type="button" onClick={() => setPhase("schedule")} className={secondaryBtn}>
                Schedule
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function PriceLine({ unitPrice, priceUnit }: { unitPrice: number; priceUnit?: string }) {
  return (
    <p className="text-2xl font-semibold">
      {inr(unitPrice)}
      {priceUnitWord(priceUnit) ? (
        <span className="ml-2 text-sm font-medium text-[var(--text-muted)]">{priceUnitWord(priceUnit)}</span>
      ) : null}
    </p>
  );
}

const inputClass = "mt-1 w-full rounded-2xl border border-[var(--border)] px-3 py-3 text-sm";
const stayInput =
  "mt-1.5 w-full rounded-xl border-0 bg-[#f6f1e8] px-3 py-2.5 text-sm text-[#12241f] outline-none ring-1 ring-[#eadfcd] placeholder:text-[#a89880] focus:bg-white focus:ring-[#0f766e]";
const stayBtn =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-[#0f3d38] text-sm font-semibold text-white disabled:opacity-60";
const primaryBtn =
  "inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60";
const secondaryBtn =
  "inline-flex h-12 w-full items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-900";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-medium text-[#5b6e68]">
      {label}
      {children}
    </label>
  );
}

function LocationPopup({
  locating,
  houseNumber,
  buildingName,
  address,
  error,
  title,
  subtitle,
  onClose,
  onDetect,
  onHouse,
  onBuilding,
  onAddress,
  onContinue,
}: {
  locating: boolean;
  houseNumber: string;
  buildingName: string;
  address: string;
  error: string;
  title: string;
  subtitle: string;
  onClose: () => void;
  onDetect: () => void;
  onHouse: (value: string) => void;
  onBuilding: (value: string) => void;
  onAddress: (value: string) => void;
  onContinue: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#071614]/55 md:items-center md:p-5">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[min(90vh,680px)] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-18px_50px_-24px_rgba(7,22,20,0.45)] md:rounded-[28px] md:px-7 md:pb-7 md:pt-6 md:shadow-[0_24px_70px_-30px_rgba(7,22,20,0.55)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#eadfcd] md:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6f4f1] text-[#0f766e]"><MapPin className="h-4 w-4" aria-hidden /></span>
            <div>
            <h3 className="text-[18px] font-semibold tracking-tight text-[#12241f]">{title}</h3>
            <p className="mt-0.5 text-[13px] leading-5 text-[#7a6a52]">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4efe4] text-[#5b6e68]"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        <button
          type="button"
          disabled={locating}
          onClick={onDetect}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0f3d38] text-sm font-semibold text-white disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          {locating ? "Detecting…" : "Use exact location"}
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b3a48c]">
          <span className="h-px flex-1 bg-[#efe6d4]" />
          or enter address
          <span className="h-px flex-1 bg-[#efe6d4]" />
        </div>

        <div className="space-y-2.5 rounded-2xl border border-[#eee5d5] bg-[#fbf9f4] p-3.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-[#7a6a52]">House / flat</span>
              <input value={houseNumber} onChange={(e) => onHouse(e.target.value)} placeholder="12A" className={`${stayInput} mt-0 bg-white`} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-[#7a6a52]">Building</span>
              <input value={buildingName} onChange={(e) => onBuilding(e.target.value)} placeholder="Name" className={`${stayInput} mt-0 bg-white`} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-[#7a6a52]">Street, area, city</span>
            <textarea
              value={address}
              onChange={(e) => onAddress(e.target.value)}
              rows={2}
              placeholder="Road, area, city"
              className={`${stayInput} mt-0 resize-none bg-white`}
            />
          </label>
        </div>
        {error ? <p className="mt-2 text-sm text-[var(--error)]">{error}</p> : null}
        <button
          type="button"
          onClick={onContinue}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#0f3d38] text-sm font-semibold text-white shadow-[0_10px_20px_-12px_rgba(15,61,56,0.8)]"
        >
          Continue with address
        </button>
      </div>
    </div>,
    document.body,
  );
}
