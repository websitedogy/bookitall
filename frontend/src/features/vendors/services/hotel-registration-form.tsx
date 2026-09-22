"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Plus } from "lucide-react";
import { FormBackButton } from "./form-back-button";
import { StayCheckGrid, StayField, StaySection, stayInputClass } from "./stay-form-ui";
import { useAuth } from "@/features/auth/store";
import { ApiError, authFetch } from "@/shared/lib/api";
import { geocodeVendorAddress } from "./detect-exact-location";
import { VendorLocationPopup } from "./vendor-location-popup";
import { useDraftFiles, useDraftState } from "./use-vendor-form-draft";
import { cn } from "@/shared/lib/cn";
import {
  ELECTRICIAN_DISTRICTS,
  HOTEL_ADVANCE_NOTICE,
  HOTEL_BOOKING_MODES,
  HOTEL_CANCELLATION,
  HOTEL_CHECK_POLICIES,
  HOTEL_CHILD_POLICY,
  HOTEL_FACILITIES,
  HOTEL_PROPERTY_TYPES,
  HOTEL_ROOM_FEATURES,
  HOTEL_ROOMS,
  HOTEL_STAR_CATEGORIES,
  HOTEL_SUITABLE_FOR,
  ROOM_OCCUPANCY,
  ROOMS_AVAILABLE,
  type RoomQuote,
} from "./hotel-form-data";

const emptyQuote = (): RoomQuote => ({ rate: "", occupancy: "2", available: "1" });

export function HotelRegistrationForm({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);

  const [name, setName] = useDraftState("hotels", "name", "");
  const [mobile, setMobile] = useDraftState("hotels", "mobile", "");
  const [propertyType, setPropertyType] = useDraftState("hotels", "propertyType", "");
  const [starCategory, setStarCategory] = useDraftState("hotels", "starCategory", "Budget");
  const [checkPolicy, setCheckPolicy] = useDraftState("hotels", "checkPolicy", "Standard");
  const [rooms, setRooms] = useDraftState("hotels", "rooms", [] as string[]);
  const [customRooms, setCustomRooms] = useDraftState("hotels", "customRooms", [] as string[]);
  const [quotes, setQuotes] = useDraftState("hotels", "quotes", {} as Record<string, RoomQuote>);
  const [features, setFeatures] = useDraftState("hotels", "features", [] as string[]);
  const [facilities, setFacilities] = useDraftState("hotels", "facilities", [] as string[]);
  const [suitableFor, setSuitableFor] = useDraftState("hotels", "suitableFor", [] as string[]);
  const [bookingMode, setBookingMode] = useDraftState("hotels", "bookingMode", "Instant Booking");
  const [cancellation, setCancellation] = useDraftState("hotels", "cancellation", "Free Cancellation");
  const [extraGuest, setExtraGuest] = useDraftState("hotels", "extraGuest", "");
  const [childPolicy, setChildPolicy] = useDraftState("hotels", "childPolicy", "Children Allowed");
  const [advanceNotice, setAdvanceNotice] = useDraftState("hotels", "advanceNotice", "Immediate");
  const [booking24, setBooking24] = useDraftState("hotels", "booking24", "Yes");
  const [locationLabel, setLocationLabel] = useDraftState("hotels", "locationLabel", "");
  const [lat, setLat] = useDraftState<number | null>("hotels", "lat", null);
  const [lng, setLng] = useDraftState<number | null>("hotels", "lng", null);
  const [district, setDistrict] = useDraftState("hotels", "district", "");
  const [workPhotos, setWorkPhotos] = useDraftFiles("hotels", "workPhotos");
  const [extraInfo, setExtraInfo] = useDraftState("hotels", "extraInfo", "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  const roomOptions = [...HOTEL_ROOMS, ...customRooms];
  const workUrls = useMemo(() => workPhotos.map((file) => URL.createObjectURL(file)), [workPhotos]);

  useEffect(() => {
    return () => workUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [workUrls]);

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.fullName || "");
    setMobile((current) => current || (user.phone || "").replace(/\D/g, "").slice(-10));
  }, [user]);

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to list hotel services</h1>
        <Link href="/login?next=/vendors/services/hotels" className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white">
          Sign in to continue
        </Link>
      </div>
    );
  }

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    setError("");
  }

  function toggleRoom(value: string) {
    const on = rooms.includes(value);
    setRooms(on ? rooms.filter((item) => item !== value) : [...rooms, value]);
    setQuotes((current) => {
      if (on) {
        const next = { ...current };
        delete next[value];
        return next;
      }
      return { ...current, [value]: current[value] ?? emptyQuote() };
    });
    setError("");
  }

  function addRoom() {
    const label = window.prompt("Room type name");
    const next = label?.trim();
    if (!next || roomOptions.includes(next)) return;
    setCustomRooms((current) => [...current, next]);
    toggleRoom(next);
  }

  function applyPickedLocation(found: { label: string; lat: number | null; lng: number | null; districtName?: string }) {
    setLocationLabel(found.label);
    setLat(found.lat);
    setLng(found.lng);
    if (found.districtName) setDistrict(found.districtName);
    setPickerOpen(false);
    setError("");
  }

  function validate() {
    if (!name.trim()) return "Enter hotel / property name.";
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
    if (!propertyType) return "Select property type.";
    if (!rooms.length) return "Select at least one room type.";
    for (const room of rooms) {
      if (!quotes[room]?.rate.trim()) return `Enter per-night rate for ${room}.`;
    }
    if (!locationLabel.trim()) return "Detect or enter your current location.";
    return "";
  }

  async function submit() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      const info = ELECTRICIAN_DISTRICTS.find((item) => item.name === district);
      const rates = rooms
        .map((room) => `${room}: ₹${quotes[room].rate} / ${quotes[room].occupancy} guests / ${quotes[room].available} rooms`)
        .join("; ");
      const firstRate = quotes[rooms[0]]?.rate.replace(/\D/g, "") || "0";
      body.append("hotelName", name.trim());
      body.append("shopName", name.trim());
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("hotelType", propertyType);
      body.append("propertyType", propertyType);
      body.append("starCategory", starCategory);
      body.append("checkPolicy", checkPolicy);
      body.append("roomType", rooms[0]);
      body.append("roomRates", rates);
      body.append("roomFeatures", features.join(", "));
      body.append("facilities", facilities.join(", "));
      body.append("suitableFor", suitableFor.join(", "));
      body.append("bookingMode", bookingMode);
      body.append("cancellation", cancellation);
      body.append("extraGuestCharge", extraGuest);
      body.append("childPolicy", childPolicy);
      body.append("checkInTime", "12:00");
      body.append("checkOutTime", "11:00");
      body.append("advanceNotice", advanceNotice);
      body.append("booking24x7", booking24);
      body.append("price", firstRate);
      body.append("priceUnit", "PER_ROOM");
      body.append("location", locationLabel.trim());
      body.append("district", district);
      body.append("state", info?.state || "");
      body.append("city", district);
      body.append("area", locationLabel.trim());
      let pinLat = lat;
      let pinLng = lng;
      if (pinLat == null || pinLng == null) {
        const pin = await geocodeVendorAddress(locationLabel.trim());
        if (!pin) throw new Error("Could not pin this hotel on the map. Use Detect or enter a clearer address.");
        pinLat = pin.lat;
        pinLng = pin.lng;
      }
      body.append("latitude", String(pinLat));
      body.append("longitude", String(pinLng));
      body.append("listedBy", user?.fullName ?? "");
      body.append("stayKind", "hotel");
      if (extraInfo.trim()) body.append("description", extraInfo.trim());
      for (const photo of workPhotos.slice(0, 10)) body.append("photos", photo);

      const res = await authFetch("/hotels/listings", { method: "POST", token, body });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string | string[];
        data?: { title?: string; name?: string };
      };
      if (!res.ok) {
        const text = Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Could not submit";
        throw new ApiError(text, res.status);
      }
      setSaved(json.data?.title || json.data?.name || name.trim());
    } catch (err) {
      const stale =
        (err instanceof ApiError && err.status === 401) ||
        (err instanceof Error && /user not found|sign in again/i.test(err.message));
      if (stale) {
        useAuth.getState().logout();
        router.push("/login?next=/vendors/services/hotels");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className={embedded ? "px-4 py-10 md:px-0" : "mx-auto max-w-lg px-4 py-12"}>
        <div className="rounded-[1.75rem] bg-white px-6 py-10 text-center ring-1 ring-[var(--border)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Pending review</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{saved}</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">Submitted for admin approval. Customers see it after it is accepted.</p>
          <button type="button" onClick={() => router.push("/vendors/posts")} className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
            View My Services
          </button>
        </div>
      </div>
    );
  }

  const fields = (
    <>
          <StaySection n={1} title="Property Details">
            <StayField label="Hotel / Property Name" required>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter property name" className={stayInputClass} />
              </StayField>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <StayField label="Contact Number" required>
                <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" inputMode="numeric" className={stayInputClass} />
              </StayField>
              <StayField label="Property Type" required>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={stayInputClass}>
                  <option value="">Select</option>
                  {HOTEL_PROPERTY_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </StayField>
              <StayField label="Star / Category">
                <select value={starCategory} onChange={(e) => setStarCategory(e.target.value)} className={stayInputClass}>
                  {HOTEL_STAR_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </StayField>
              <StayField label="Check-in / Check-out">
                <select value={checkPolicy} onChange={(e) => setCheckPolicy(e.target.value)} className={stayInputClass}>
                  {HOTEL_CHECK_POLICIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </StayField>
            </div>
          </StaySection>

          <StaySection n={2} title="Room Types & Individual Rates" required>
            <div className="mb-2 flex items-center justify-end">
              <button type="button" onClick={addRoom} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-white" aria-label="Add room type">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-500">Select each room type and set its own per-night price, occupancy and available rooms.</p>
            <div className="mt-3 space-y-2">
              {roomOptions.map((room) => {
                const on = rooms.includes(room);
                const quote = quotes[room] ?? emptyQuote();
                return (
                  <div key={room} className="rounded-lg border border-[#d7dde6] px-3 py-2.5">
                    <button type="button" onClick={() => toggleRoom(room)} className="flex w-full items-center gap-2.5 text-left text-sm">
                      <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-[3px] border", on ? "border-slate-800 bg-slate-800" : "border-slate-400")}>
                        {on ? <span className="text-[10px] font-bold text-white">✓</span> : null}
                      </span>
                      {room}
                    </button>
                    {on ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <StayField label="Per night (₹)">
                          <input
                            value={quote.rate}
                            onChange={(e) => setQuotes((current) => ({ ...current, [room]: { ...quote, rate: e.target.value.replace(/\D/g, "").slice(0, 7) } }))}
                            placeholder="₹"
                            inputMode="numeric"
                            className={stayInputClass}
                          />
              </StayField>
                        <StayField label="Occupancy">
                          <select
                            value={quote.occupancy}
                            onChange={(e) => setQuotes((current) => ({ ...current, [room]: { ...quote, occupancy: e.target.value } }))}
                            className={stayInputClass}
                          >
                            {ROOM_OCCUPANCY.map((option) => (
                              <option key={option} value={option}>
                                {option} guests
                              </option>
                            ))}
                          </select>
              </StayField>
                        <StayField label="Available rooms">
                          <select
                            value={quote.available}
                            onChange={(e) => setQuotes((current) => ({ ...current, [room]: { ...quote, available: e.target.value } }))}
                            className={stayInputClass}
                          >
                            {ROOMS_AVAILABLE.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
              </StayField>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </StaySection>

          <StaySection n={3} title="Room Features">
            <StayCheckGrid values={HOTEL_ROOM_FEATURES} selected={features} onToggle={(value) => toggle(features, value, setFeatures)} />
          </StaySection>

          <StaySection n={4} title="Property Facilities">
            <StayCheckGrid values={HOTEL_FACILITIES} selected={facilities} onToggle={(value) => toggle(facilities, value, setFacilities)} />
          </StaySection>

          <StaySection n={5} title="Guest & Booking Rules">
            <p className="text-sm font-medium text-slate-800">Suitable For</p>
            <StayCheckGrid values={HOTEL_SUITABLE_FOR} selected={suitableFor} onToggle={(value) => toggle(suitableFor, value, setSuitableFor)} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <StayField label="Booking Mode">
                <select value={bookingMode} onChange={(e) => setBookingMode(e.target.value)} className={stayInputClass}>
                  {HOTEL_BOOKING_MODES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </StayField>
              <StayField label="Cancellation">
                <select value={cancellation} onChange={(e) => setCancellation(e.target.value)} className={stayInputClass}>
                  {HOTEL_CANCELLATION.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </StayField>
              <StayField label="Extra Guest Charge (₹)">
                <input value={extraGuest} onChange={(e) => setExtraGuest(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Per guest/night" inputMode="numeric" className={stayInputClass} />
              </StayField>
              <StayField label="Child Policy">
                <select value={childPolicy} onChange={(e) => setChildPolicy(e.target.value)} className={stayInputClass}>
                  {HOTEL_CHILD_POLICY.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </StayField>
            </div>
          </StaySection>

          <StaySection n={6} title="Availability">
            <div className="grid gap-4 sm:grid-cols-2">
              <StayField label="Advance Notice">
                <select value={advanceNotice} onChange={(e) => setAdvanceNotice(e.target.value)} className={stayInputClass}>
                  {HOTEL_ADVANCE_NOTICE.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </StayField>
              <StayField label="24x7 Booking">
                <select value={booking24} onChange={(e) => setBooking24(e.target.value)} className={stayInputClass}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </StayField>
            </div>
          </StaySection>

          <StaySection n={7} title="Location">
            <StayField label="Current Location" required hint="Open the map, use current location, or type the address.">
              <div className="mt-1.5 flex gap-2">
                <input
                  value={locationLabel}
                  onChange={(e) => {
                    setLocationLabel(e.target.value);
                    setLat(null);
                    setLng(null);
                    setDistrict("");
                  }}
                  placeholder="House, street, area — or tap Detect"
                  className={`${stayInputClass} mt-0`}
                />
                <button type="button" onClick={() => setPickerOpen(true)} className="shrink-0 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white">
                  Detect
                </button>
              </div>
            </StayField>
            {pickerOpen ? (
              <VendorLocationPopup
                initialLabel={locationLabel}
                initialLat={lat}
                initialLng={lng}
                pinLabel="Hotel location"
                onClose={() => setPickerOpen(false)}
                onConfirm={applyPickedLocation}
              />
            ) : null}
          </StaySection>

          <StaySection n={8} title="Property Photos">
            <div className="mt-2 flex flex-wrap gap-2">
              {workUrls.map((url, index) => (
                <button key={url} type="button" onClick={() => setWorkPhotos((current) => current.filter((_, i) => i !== index))} className="h-24 w-24 overflow-hidden rounded-xl bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              {workPhotos.length < 10 ? (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#c5ced8] text-slate-500">
                  <Plus className="h-5 w-5" />
                  <span className="mt-1 text-[11px] font-medium">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const next = Array.from(e.target.files ?? []);
                      setWorkPhotos((current) => [...current, ...next].slice(0, 10));
                      e.target.value = "";
                    }}
                  />
                </label>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">Add up to 10 clear property / room photos.</p>
          </StaySection>

          <StaySection n={9} title="Additional Information">
            <textarea
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
              rows={4}
              placeholder="Enter additional information"
              className={`${stayInputClass} mt-0 h-auto min-h-[6.5rem] resize-y py-3`}
            />
          </StaySection>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Submitting…" : "Submit for Admin Approval"}
          </button>
    </>
  );

  if (embedded) {
    return <div className="px-4 pb-6 md:px-0">{fields}</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:min-h-[70vh] md:bg-[#f4f6f8] md:pb-10">
      <div className="md:mx-auto md:max-w-2xl md:px-0 md:pt-6 md:pb-8">
        <article className="bg-white md:rounded-2xl md:p-8 md:shadow-sm md:ring-1 md:ring-slate-200">
          <header className="sticky top-0 z-20 flex h-12 items-center gap-2.5 border-b border-slate-100 bg-white pl-12 pr-4 md:static md:h-auto md:border-0 md:px-0 md:pb-4">
            <FormBackButton />
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50">
              <Building2 className="h-5 w-5 text-sky-700" />
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">Hotels</h1>
          </header>
          <div className="px-4 pb-6 md:px-0">{fields}</div>
        </article>
      </div>
    </div>
  );
}

