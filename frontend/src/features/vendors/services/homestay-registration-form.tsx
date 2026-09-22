"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { ApiError, authFetch } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { geocodeVendorAddress } from "./detect-exact-location";
import { VendorLocationPopup } from "./vendor-location-popup";
import {
  ELECTRICIAN_DISTRICTS,
  HOTEL_ADVANCE_NOTICE,
  HOTEL_BOOKING_MODES,
  HOTEL_CANCELLATION,
  ROOM_OCCUPANCY,
  ROOMS_AVAILABLE,
  type CoverageType,
  type RoomQuote,
} from "./hotel-form-data";
import {
  HOMESTAY_AMENITIES,
  HOMESTAY_MEALS,
  HOMESTAY_ROOMS,
  HOMESTAY_RULES,
  HOMESTAY_SUITABLE_FOR,
  HOMESTAY_TYPES,
} from "./homestay-form-data";
import { StayCheckGrid, StayField, StaySection, stayInputClass } from "./stay-form-ui";
import { useDraftFiles, useDraftState } from "./use-vendor-form-draft";

const emptyQuote = (): RoomQuote => ({ rate: "", occupancy: "2", available: "1" });

export function HomestayRegistrationForm({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);

  const [name, setName] = useDraftState("homestays", "name", "");
  const [mobile, setMobile] = useDraftState("homestays", "mobile", "");
  const [stayType, setStayType] = useDraftState("homestays", "stayType", "");
  const [hostOnProperty, setHostOnProperty] = useDraftState("homestays", "hostOnProperty", "Yes");
  const [maxGuests, setMaxGuests] = useDraftState("homestays", "maxGuests", "4");
  const [rooms, setRooms] = useDraftState("homestays", "rooms", [] as string[]);
  const [quotes, setQuotes] = useDraftState("homestays", "quotes", {} as Record<string, RoomQuote>);
  const [amenities, setAmenities] = useDraftState("homestays", "amenities", [] as string[]);
  const [otherAmenities, setOtherAmenities] = useDraftState("homestays", "otherAmenities", "");
  const [meals, setMeals] = useDraftState("homestays", "meals", [] as string[]);
  const [mealPrices, setMealPrices] = useDraftState("homestays", "mealPrices", {} as Record<string, string>);
  const [mealsIncluded, setMealsIncluded] = useDraftState("homestays", "mealsIncluded", "No");
  const [rules, setRules] = useDraftState("homestays", "rules", [] as string[]);
  const [otherRules, setOtherRules] = useDraftState("homestays", "otherRules", "");
  const [suitableFor, setSuitableFor] = useDraftState("homestays", "suitableFor", [] as string[]);
  const [bookingMode, setBookingMode] = useDraftState("homestays", "bookingMode", "On Confirmation");
  const [cancellation, setCancellation] = useDraftState("homestays", "cancellation", "Free Cancellation");
  const [freeCancellationUntil, setFreeCancellationUntil] = useDraftState("homestays", "freeCancellationUntil", "1 day before check-in");
  const [advanceNotice, setAdvanceNotice] = useDraftState("homestays", "advanceNotice", "1 day");
  const [locationLabel, setLocationLabel] = useDraftState("homestays", "locationLabel", "");
  const [city, setCity] = useDraftState("homestays", "city", "");
  const [lat, setLat] = useDraftState<number | null>("homestays", "lat", null);
  const [lng, setLng] = useDraftState<number | null>("homestays", "lng", null);
  const [district, setDistrict] = useDraftState("homestays", "district", "");
  const [coverage, setCoverage] = useDraftState<CoverageType>("homestays", "coverage", "Entire District");
  const [mandals, setMandals] = useDraftState("homestays", "mandals", [] as string[]);
  const [workPhotos, setWorkPhotos] = useDraftFiles("homestays", "workPhotos");
  const [coverPhoto, setCoverPhoto] = useDraftState("homestays", "coverPhoto", 0);
  const [step, setStep] = useDraftState("homestays", "step", 1);
  const [touched, setTouched] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const districtInfo = ELECTRICIAN_DISTRICTS.find((item) => item.name === district);
  const workUrls = useMemo(() => workPhotos.map((file) => URL.createObjectURL(file)), [workPhotos]);

  useEffect(() => {
    return () => workUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [workUrls]);

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.fullName || "");
    setMobile((current) => current || (user.phone || "").replace(/\D/g, "").slice(-10));
  }, [user]);

  useEffect(() => {
    const roomAliases: Record<string, string> = {
      "Entire home": "Entire Home",
      "Private bedroom": "Private Bedroom",
      "Extra bedroom": "Shared / Extra Bedroom",
      "Dorm bed": "Dorm Bed",
    };
    setRooms((current) => current.map((room) => roomAliases[room] ?? room));
    setStayType((current) => ({
      "Entire house": "Entire Home",
      "Private room": "Private Room",
      "Shared room": "Guest House",
      "Farm stay": "Farm Stay",
      "Village home": "Other",
      "Independent cottage": "Cottage",
      "Apartment homestay": "Apartment",
    })[current] ?? current);
  }, []);

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to list a homestay</h1>
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

  function touch(field: string) {
    setTouched((current) => (current.includes(field) ? current : [...current, field]));
  }

  function fieldError(field: string) {
    if (!touched.includes(field)) return "";
    if (field === "name" && !name.trim()) return "Homestay name is required.";
    if (field === "mobile" && !/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Please enter a valid 10-digit mobile number.";
    if (field === "stayType" && !stayType) return "Please select a homestay type.";
    if (field === "rooms" && !rooms.length) return "Please select at least one accommodation type.";
    if (field === "photos" && !workPhotos.length) return "Please upload at least one property photo.";
    if (field === "location" && !locationLabel.trim()) return "Property address is required.";
    if (field === "confirm" && !confirmed) return "Please confirm that your information is correct.";
    return "";
  }

  function detectLocation() {
    setError("");
    setPickerOpen(true);
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
    if (!name.trim()) return "Homestay name is required.";
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Please enter a valid 10-digit mobile number.";
    if (!stayType) return "Please select a homestay type.";
    if (!rooms.length) return "Please select at least one accommodation type.";
    for (const room of rooms) {
      if (!quotes[room]?.rate.trim()) return `Please enter the nightly price for ${room}.`;
    }
    if (!locationLabel.trim()) return "Property address is required.";
    if (!workPhotos.length) return "Please upload at least one property photo.";
    if (!confirmed) return "Please confirm that the information is correct.";
    return "";
  }

  async function submit() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    if (!user || !token) return;
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      const info = ELECTRICIAN_DISTRICTS.find((item) => item.name === district);
      const rates = rooms
        .map((room) => `${room}: ₹${quotes[room].rate} / ${quotes[room].occupancy} guests / ${quotes[room].available} units`)
        .join("; ");
      const firstRate = quotes[rooms[0]]?.rate.replace(/\D/g, "") || "0";
      body.append("hotelName", name.trim());
      body.append("shopName", name.trim());
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("hotelType", "Homestay");
      body.append("propertyType", stayType);
      body.append("stayKind", "homestay");
      body.append("hostOnProperty", hostOnProperty);
      body.append("meals", [...meals.map((meal) => `${meal}${mealPrices[meal] ? `: ₹${mealPrices[meal]}` : ""}`), mealsIncluded ? `Included: ${mealsIncluded}` : ""].filter(Boolean).join(", "));
      body.append("houseRules", [...rules, otherRules].filter(Boolean).join(", "));
      body.append("maxGuests", maxGuests);
      body.append("starCategory", "Homestay");
      body.append("checkPolicy", "Standard");
      body.append("roomType", rooms[0]);
      body.append("roomRates", rates);
      body.append("roomFeatures", [...amenities, otherAmenities].filter(Boolean).join(", "));
      body.append("facilities", [...amenities, otherAmenities].filter(Boolean).join(", "));
      body.append("suitableFor", suitableFor.join(", "));
      body.append("bookingMode", bookingMode);
      body.append("cancellation", cancellation);
      body.append("freeCancellationUntil", freeCancellationUntil);
      body.append("checkInTime", "12:00");
      body.append("checkOutTime", "11:00");
      body.append("advanceNotice", advanceNotice);
      body.append("booking24x7", "No");
      body.append("price", firstRate);
      body.append("priceUnit", "PER_ROOM");
      body.append("location", locationLabel.trim());
      body.append("district", district);
      body.append("state", info?.state || "");
      body.append("city", city || district);
      body.append("area", coverage === "Selected Mandals" ? mandals.join(", ") : district);
      body.append("coverageType", coverage);
      body.append("coverage", coverage === "Entire District" ? `Entire ${district}` : mandals.join(", "));
      body.append("mandals", mandals.join(", "));
      let pinLat = lat;
      let pinLng = lng;
      if (pinLat == null || pinLng == null) {
        const pin = await geocodeVendorAddress(locationLabel.trim());
        if (!pin) throw new Error("Could not pin this homestay on the map. Use Detect or enter a clearer address.");
        pinLat = pin.lat;
        pinLng = pin.lng;
      }
      body.append("latitude", String(pinLat));
      body.append("longitude", String(pinLng));
      body.append("listedBy", user.fullName);
      for (const photo of workPhotos.slice(0, 10)) body.append("photos", photo);

      const res = await authFetch("/hotels/listings", { method: "POST", token, body });
      const json = (await res.json().catch(() => ({}))) as {
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
          <p className="mt-3 text-sm text-[var(--text-muted)]">Homestay submitted for admin approval. Customers see it after it is accepted.</p>
          <button type="button" onClick={() => router.push("/vendors/posts")} className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
            View My Services
          </button>
        </div>
      </div>
    );
  }

  const legacyFields = (
    <>
      <StaySection n={1} title="Homestay details">
        <StayField label="Homestay name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="House / homestay name" className={stayInputClass} />
        </StayField>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <StayField label="Host mobile" required>
            <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" inputMode="numeric" className={stayInputClass} />
          </StayField>
          <StayField label="Homestay type" required>
            <select value={stayType} onChange={(e) => setStayType(e.target.value)} className={stayInputClass}>
              <option value="">Select</option>
              {HOMESTAY_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </StayField>
          <StayField label="Host lives on property">
            <select value={hostOnProperty} onChange={(e) => setHostOnProperty(e.target.value)} className={stayInputClass}>
              <option value="Yes">Yes</option>
              <option value="No">No — whole house</option>
            </select>
          </StayField>
          <StayField label="Max guests">
            <select value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} className={stayInputClass}>
              {ROOM_OCCUPANCY.map((option) => (
                <option key={option} value={option}>
                  {option} guests
                </option>
              ))}
            </select>
          </StayField>
        </div>
      </StaySection>

      <StaySection n={2} title="Rooms / units & rates" required>
        <p className="text-sm text-slate-500">Select what you offer and set a per-night rate.</p>
        <div className="mt-3 space-y-2">
          {HOMESTAY_ROOMS.map((room) => {
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
                    <StayField label="Units">
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

      <StaySection n={3} title="House amenities">
        <StayCheckGrid values={HOMESTAY_AMENITIES} selected={amenities} onToggle={(value) => toggle(amenities, value, setAmenities)} />
      </StaySection>

      <StaySection n={4} title="Meals">
        <StayCheckGrid values={HOMESTAY_MEALS} selected={meals} onToggle={(value) => toggle(meals, value, setMeals)} />
      </StaySection>

      <StaySection n={5} title="House rules">
        <StayCheckGrid values={HOMESTAY_RULES} selected={rules} onToggle={(value) => toggle(rules, value, setRules)} />
        <p className="mt-4 text-sm font-medium text-slate-800">Suitable for</p>
        <StayCheckGrid values={HOMESTAY_SUITABLE_FOR} selected={suitableFor} onToggle={(value) => toggle(suitableFor, value, setSuitableFor)} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <StayField label="Booking mode">
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
          <StayField label="Advance notice">
            <select value={advanceNotice} onChange={(e) => setAdvanceNotice(e.target.value)} className={stayInputClass}>
              {HOTEL_ADVANCE_NOTICE.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </StayField>
        </div>
      </StaySection>

      <StaySection n={6} title="Location">
        <StayField label="Current location" required>
          <div className="mt-1.5 flex gap-2">
            <input
              value={locationLabel}
              onChange={(e) => {
                setLocationLabel(e.target.value);
                setLat(null);
                setLng(null);
              }}
              placeholder="House, street, area — or tap Detect"
              className={`${stayInputClass} mt-0`}
            />
            <button type="button" onClick={() => void detectLocation()} className="shrink-0 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white">
              {detecting ? "…" : "Detect"}
            </button>
          </div>
        </StayField>
        <StayField label="District" required className="mt-4">
          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setMandals([]);
            }}
            className={stayInputClass}
          >
            <option value="">Select District</option>
            {["Telangana", "Andhra Pradesh"].map((state) => (
              <optgroup key={state} label={state}>
                {ELECTRICIAN_DISTRICTS.filter((item) => item.state === state).map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </StayField>
        <p className="mt-4 text-sm font-medium text-slate-800">
          Booking coverage <span className="text-red-500">*</span>
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(["Entire District", "Selected Mandals"] as CoverageType[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCoverage(option)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium",
                coverage === option ? "border-blue-500 text-blue-700" : "border-[#d7dde6] text-slate-700",
              )}
            >
              <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-full border", coverage === option ? "border-blue-500" : "border-slate-400")}>
                {coverage === option ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}
              </span>
              {option}
            </button>
          ))}
        </div>
        {coverage === "Selected Mandals" && districtInfo ? (
          <div className="mt-3">
            <StayCheckGrid values={districtInfo.mandals} selected={mandals} onToggle={(value) => toggle(mandals, value, setMandals)} />
          </div>
        ) : null}
      </StaySection>

      <StaySection n={7} title="Homestay photos">
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
        <p className="mt-2 text-xs text-slate-500">Add up to 10 photos of the house, rooms and neighbourhood.</p>
      </StaySection>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => void submit()}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Submitting…" : "Submit homestay for approval"}
      </button>
    </>
  );

  function validateStep() {
    const fieldsByStep: Record<number, string[]> = {
      1: ["name", "mobile", "stayType"],
      2: ["rooms"],
      7: ["location", "district", "city", "coverage"],
      8: ["photos"],
      9: ["confirm"],
    };
    const currentFields = fieldsByStep[step] ?? [];
    currentFields.forEach(touch);
    if (step === 2 && rooms.some((room) => !quotes[room]?.rate.trim())) {
      setError("Please enter the nightly price for every selected accommodation type.");
      return false;
    }
    if (step === 9 && !confirmed) {
      setError("Please confirm that the information is correct.");
      return false;
    }
    const message = currentFields
      .map((field) => {
        if (field === "name" && !name.trim()) return "Homestay name is required.";
        if (field === "mobile" && !/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Please enter a valid 10-digit mobile number.";
        if (field === "stayType" && !stayType) return "Please select a homestay type.";
        if (field === "rooms" && !rooms.length) return "Please select at least one accommodation type.";
        if (field === "location" && !locationLabel.trim()) return "Property address is required.";
        if (field === "district" && !district) return "Please select a district.";
        if (field === "city" && !city) return "Please select a mandal, town or city.";
        if (field === "coverage" && coverage === "Selected Mandals" && !mandals.length) return "Please select at least one mandal.";
        if (field === "photos" && !workPhotos.length) return "Please upload at least one property photo.";
        if (field === "confirm" && !confirmed) return "Please confirm that the information is correct.";
        return "";
      })
      .find(Boolean);
    if (message) {
      setError(message);
      return false;
    }
    setError("");
    return true;
  }

  const steps = ["Basic Details", "Stay & Rates", "Amenities", "Meals", "Rules", "Booking", "Location", "Photos", "Review"];
  const wizardFields = (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button type="button" onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </div>
        <span className="hidden rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)] sm:inline-flex">Step {step} of 9</span>
      </div>
      <div className="mb-6 hidden items-center gap-1 overflow-hidden lg:flex">
        {steps.map((title, index) => (
          <div key={title} className="flex min-w-0 flex-1 items-center gap-1">
            <button type="button" onClick={() => index + 1 < step || index + 1 === step ? setStep(index + 1) : undefined} className={cn("truncate text-[11px] font-semibold", step === index + 1 ? "text-[var(--primary)]" : index + 1 < step ? "text-slate-700" : "text-slate-400")}>
              {title}
            </button>
            {index < steps.length - 1 ? <span className="text-slate-300">→</span> : null}
          </div>
        ))}
      </div>
      <div className="mb-5 lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">Step {step} of 9</p>
        <p className="mt-1 text-lg font-bold text-slate-950">{steps[step - 1]}</p>
      </div>

      {step === 1 ? (
        <StaySection n={1} title="Basic Homestay Details" hint="Tell us about your homestay.">
          <div className="space-y-4">
            <StayField label="Homestay Name" required>
              <input value={name} onBlur={() => touch("name")} onChange={(e) => setName(e.target.value)} placeholder="Example: Green Valley Homestay" className={stayInputClass} />
              {fieldError("name") ? <p className="mt-1 text-xs text-red-600">{fieldError("name")}</p> : null}
            </StayField>
            <div className="grid gap-4 sm:grid-cols-2">
              <StayField label="Host Mobile Number" required>
                <input value={mobile} onBlur={() => touch("mobile")} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Enter 10-digit mobile number" inputMode="numeric" className={stayInputClass} />
                {fieldError("mobile") ? <p className="mt-1 text-xs text-red-600">{fieldError("mobile")}</p> : null}
              </StayField>
              <StayField label="Homestay Type" required hint="Choose the option that best describes your property.">
                <select value={stayType} onBlur={() => touch("stayType")} onChange={(e) => setStayType(e.target.value)} className={stayInputClass}>
                  <option value="">Select homestay type</option>
                  {HOMESTAY_TYPES.map((option) => <option key={option}>{option}</option>)}
                </select>
                {fieldError("stayType") ? <p className="mt-1 text-xs text-red-600">{fieldError("stayType")}</p> : null}
              </StayField>
              <StayField label="Does the host live on this property?" required>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {["Yes", "No"].map((option) => <button key={option} type="button" onClick={() => setHostOnProperty(option)} className={cn("rounded-xl border px-3 py-2.5 text-sm font-medium", hostOnProperty === option ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-slate-200 text-slate-600")}>{option === "Yes" ? "Yes, I live here" : "No, I don't live here"}</button>)}
                </div>
              </StayField>
              <StayField label="How many guests can stay at the property?" required hint="Select the maximum number of guests you can accommodate at one time.">
                <select value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} className={stayInputClass}>
                  {[["1–2 Guests", "2"], ["3–4 Guests", "4"], ["5–6 Guests", "6"], ["7–10 Guests", "10"], ["10+ Guests", "10+"]].map((option) => <option key={option[1]} value={option[1]}>{option[0]}</option>)}
                </select>
              </StayField>
            </div>
          </div>
        </StaySection>
      ) : null}

      {step === 2 ? (
        <StaySection n={2} title="Accommodation & Rates" required hint="Select what guests can book and set the price per night.">
          <div className="space-y-3">
            {HOMESTAY_ROOMS.map((room) => {
              const on = rooms.includes(room);
              const quote = quotes[room] ?? emptyQuote();
              const details = room === "Entire Home" ? ["Guests can book the complete property.", "Number of Homes", "Price per Night", "Maximum Guests"] : room === "Private Bedroom" ? ["Guests can book a private bedroom.", "Number of Bedrooms", "Price per Bedroom / Night", "Guests per Bedroom"] : room === "Shared / Extra Bedroom" ? ["Guests share the room or property with others.", "Number of Rooms", "Price per Room / Night", "Maximum Guests"] : ["Guests book an individual bed in a shared dormitory.", "Number of Beds", "Price per Bed / Night", "Maximum Guests"];
              return <div key={room} className={cn("rounded-2xl border p-4", on ? "border-[var(--primary)] bg-[var(--primary-soft)]/40" : "border-slate-200")}>
                <button type="button" onClick={() => toggleRoom(room)} className="flex w-full items-start gap-3 text-left"><span className={cn("mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", on ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-slate-300")}>{on ? <Check className="h-3.5 w-3.5" /> : null}</span><span><span className="block text-sm font-bold text-slate-900">{room}</span><span className="mt-0.5 block text-xs text-slate-500">{details[0]}</span></span></button>
                {on ? <div className="mt-4 grid gap-3 sm:grid-cols-3"><StayField label={`${details[1]} *`}><select value={quote.available} onChange={(e) => setQuotes((current) => ({ ...current, [room]: { ...quote, available: e.target.value } }))} className={stayInputClass}>{ROOMS_AVAILABLE.map((option) => <option key={option}>{option}</option>)}</select></StayField><StayField label={`${details[2]} *`}><div className="relative"><span className="absolute left-3 top-3 text-sm text-slate-500">₹</span><input value={quote.rate} onChange={(e) => setQuotes((current) => ({ ...current, [room]: { ...quote, rate: e.target.value.replace(/\D/g, "").slice(0, 7) } }))} placeholder="1,500" inputMode="numeric" className={`${stayInputClass} pl-7`} /></div></StayField><StayField label={`${details[3]} *`}><select value={quote.occupancy} onChange={(e) => setQuotes((current) => ({ ...current, [room]: { ...quote, occupancy: e.target.value } }))} className={stayInputClass}>{ROOM_OCCUPANCY.map((option) => <option key={option}>{option} guests</option>)}</select></StayField></div> : null}
              </div>;
            })}
          </div>
          {fieldError("rooms") ? <p className="mt-2 text-xs text-red-600">{fieldError("rooms")}</p> : null}
        </StaySection>
      ) : null}

      {step === 3 ? <StaySection n={3} title="Property Amenities" hint="Select all facilities available at your homestay."><StayCheckGrid values={HOMESTAY_AMENITIES} selected={amenities} onToggle={(value) => toggle(amenities, value, setAmenities)} /><StayField label="Other Amenities" className="mt-4"><input value={otherAmenities} onChange={(e) => setOtherAmenities(e.target.value)} placeholder="Enter any other facility..." className={stayInputClass} /></StayField></StaySection> : null}

      {step === 4 ? <StaySection n={4} title="Meals & Food Options" hint="Tell guests which food options are available."><StayCheckGrid values={HOMESTAY_MEALS} selected={meals} onToggle={(value) => toggle(meals, value, setMeals)} /><div className="mt-4 grid gap-3 sm:grid-cols-3">{["Breakfast", "Lunch", "Dinner"].filter((meal) => meals.includes(meal)).map((meal) => <StayField key={meal} label={`${meal} Price`}><div className="relative"><span className="absolute left-3 top-3 text-sm text-slate-500">₹</span><input value={mealPrices[meal] ?? ""} onChange={(e) => setMealPrices((current) => ({ ...current, [meal]: e.target.value.replace(/\D/g, "") }))} placeholder="Optional" inputMode="numeric" className={`${stayInputClass} pl-7`} /></div></StayField>)}</div><StayField label="Are meals included in the accommodation price?" hint="Guests should clearly understand whether food is included in the room price." className="mt-5"><select value={mealsIncluded} onChange={(e) => setMealsIncluded(e.target.value)} className={stayInputClass}><option>Yes</option><option>No</option><option>Some meals are included</option></select></StayField></StaySection> : null}

      {step === 5 ? <StaySection n={5} title="House Rules & Guest Preferences"><div><p className="text-sm font-bold text-slate-900">House Rules</p><p className="mt-1 text-xs text-slate-500">Select the rules guests must follow at your property.</p><StayCheckGrid values={HOMESTAY_RULES} selected={rules} onToggle={(value) => toggle(rules, value, setRules)} /><StayField label="Other House Rules" className="mt-4"><input value={otherRules} onChange={(e) => setOtherRules(e.target.value)} placeholder="Example: Quiet hours after 10 PM" className={stayInputClass} /></StayField></div><div className="mt-7 border-t border-slate-100 pt-5"><p className="text-sm font-bold text-slate-900">Suitable For</p><p className="mt-1 text-xs text-slate-500">Choose the types of guests your homestay is suitable for.</p><StayCheckGrid values={HOMESTAY_SUITABLE_FOR} selected={suitableFor} onToggle={(value) => toggle(suitableFor, value, setSuitableFor)} /></div></StaySection> : null}

      {step === 6 ? <StaySection n={6} title="Booking Settings" hint="Choose how guests can book your homestay."><StayField label="How should bookings be confirmed?" required hint={bookingMode === "Instant Booking" ? "Guests can book immediately when your property is available." : "You can review and accept each booking request."}><select value={bookingMode === "On Confirmation" ? "Host Confirmation" : bookingMode} onChange={(e) => setBookingMode(e.target.value === "Host Confirmation" ? "On Confirmation" : e.target.value)} className={stayInputClass}><option>Instant Booking</option><option>Host Confirmation</option></select></StayField><div className="mt-4 grid gap-4 sm:grid-cols-2"><StayField label="Cancellation Policy" required><select value={cancellation === "Non-refundable" ? "No Refund" : cancellation} onChange={(e) => setCancellation(e.target.value === "No Refund" ? "Non-refundable" : e.target.value)} className={stayInputClass}><option>Free Cancellation</option><option>Partial Refund</option><option>No Refund</option></select></StayField>{cancellation === "Free Cancellation" ? <StayField label="Free cancellation until"><select value={freeCancellationUntil} onChange={(e) => setFreeCancellationUntil(e.target.value)} className={stayInputClass}>{["Same day", "1 day before check-in", "2 days before check-in", "3 days before check-in", "7 days before check-in"].map((option) => <option key={option}>{option}</option>)}</select></StayField> : null}<StayField label="How much advance notice do you need?" required hint="This controls how much notice you need before a guest can make a booking."><select value={advanceNotice} onChange={(e) => setAdvanceNotice(e.target.value)} className={stayInputClass}>{["Same day", "1 day", "2 days", "3 days", "7 days"].map((option) => <option key={option}>{option}</option>)}</select></StayField></div></StaySection> : null}

      {step === 7 ? <StaySection n={7} title="Property Location" hint="Add the location of your homestay so guests can find it."><StayField label="Property Address" required><div className="flex gap-2"><input value={locationLabel} onBlur={() => touch("location")} onChange={(e) => { setLocationLabel(e.target.value); setLat(null); setLng(null); }} placeholder="House number, street, area" className={`${stayInputClass} mt-0`} /><button type="button" onClick={() => void detectLocation()} className="shrink-0 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white">{detecting ? "..." : "Detect Location"}</button></div>{fieldError("location") ? <p className="mt-1 text-xs text-red-600">{fieldError("location")}</p> : null}</StayField><div className="mt-4 grid gap-4 sm:grid-cols-2"><StayField label="District" required><select value={district} onBlur={() => touch("district")} onChange={(e) => { setDistrict(e.target.value); setCity(""); setMandals([]); }} className={stayInputClass}><option value="">Select District</option>{["Telangana", "Andhra Pradesh"].map((state) => <optgroup key={state} label={state}>{ELECTRICIAN_DISTRICTS.filter((item) => item.state === state).map((item) => <option key={item.name}>{item.name}</option>)}</optgroup>)}</select>{fieldError("district") ? <p className="mt-1 text-xs text-red-600">{fieldError("district")}</p> : null}</StayField><StayField label="Mandal / Town / City" required><select value={city} onBlur={() => touch("city")} onChange={(e) => setCity(e.target.value)} disabled={!district} className={stayInputClass}><option value="">{district ? "Select Mandal / Town / City" : "Select district first"}</option>{districtInfo?.mandals.map((mandal) => <option key={mandal}>{mandal}</option>)}</select>{fieldError("city") ? <p className="mt-1 text-xs text-red-600">{fieldError("city")}</p> : null}</StayField></div><div className="mt-5"><p className="text-sm font-medium text-slate-800">Where do you want to accept bookings? <span className="text-red-500">*</span></p><div className="mt-2 grid gap-2 sm:grid-cols-2">{(["Entire District", "Selected Mandals"] as CoverageType[]).map((option) => <button key={option} type="button" onClick={() => setCoverage(option)} className={cn("rounded-xl border px-3 py-3 text-left text-sm", coverage === option ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-slate-200")}><span className="font-semibold">{option}</span><span className="mt-1 block text-xs text-slate-500">{option === "Entire District" ? "Accept bookings from guests anywhere in this district." : "Accept bookings only from the mandals you select."}</span></button>)}</div>{coverage === "Selected Mandals" && districtInfo ? <><p className="mt-4 text-sm font-semibold">Select Mandals</p><StayCheckGrid values={districtInfo.mandals} selected={mandals} onToggle={(value) => toggle(mandals, value, setMandals)} /></> : null}{fieldError("coverage") ? <p className="mt-1 text-xs text-red-600">{fieldError("coverage")}</p> : null}</div></StaySection> : null}

      {step === 8 ? <StaySection n={8} title="Homestay Photos" required hint="Add clear photos so guests can understand your property before booking."><div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{workUrls.map((url, index) => <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200"><img src={url} alt={`Homestay photo ${index + 1}`} className="h-full w-full object-cover" /><button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => { setWorkPhotos((current) => current.filter((_, i) => i !== index)); setCoverPhoto((current) => Math.min(current, Math.max(0, workPhotos.length - 2))); }} className="absolute right-1 top-1 rounded-full bg-white p-1 text-slate-700 shadow"><X className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setCoverPhoto(index)} className={cn("absolute bottom-1 left-1 rounded-md px-1.5 py-1 text-[10px] font-bold", coverPhoto === index ? "bg-[var(--primary)] text-white" : "bg-white/90 text-slate-700")}>{coverPhoto === index ? "Cover Photo" : "Set as cover"}</button></div>)}{workPhotos.length < 10 ? <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-500"><Plus className="h-5 w-5" /><span className="mt-1 text-xs font-semibold">Add Photos</span><input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { const next = Array.from(e.target.files ?? []); setWorkPhotos((current) => [...current, ...next].slice(0, 10)); e.target.value = ""; }} /></label> : null}</div><p className="mt-3 text-xs text-slate-500">Add up to 10 photos. Recommended: property, bedroom, bathroom, living area, kitchen, exterior and nearby area.</p>{fieldError("photos") ? <p className="mt-1 text-xs text-red-600">{fieldError("photos")}</p> : null}</StaySection> : null}

      {step === 9 ? <StaySection n={9} title="Review Your Homestay" hint="Please check your details before submitting your homestay for approval."><div className="grid gap-3 sm:grid-cols-2">{[["Basic Details", `${name || "Not entered"} · ${stayType || "Type not selected"} · ${maxGuests} guests`], ["Accommodation", rooms.length ? rooms.map((room) => `${room} · ₹${quotes[room]?.rate || "-"}`).join("; ") : "Not selected"], ["Amenities", amenities.length ? [...amenities, otherAmenities].filter(Boolean).join(", ") : "None selected"], ["Meals", meals.length ? meals.join(", ") : "None selected"], ["House Rules", rules.length || otherRules ? [...rules, otherRules].filter(Boolean).join(", ") : "None selected"], ["Suitable For", suitableFor.length ? suitableFor.join(", ") : "None selected"], ["Booking", `${bookingMode === "On Confirmation" ? "Host Confirmation" : bookingMode} · ${cancellation} · ${advanceNotice}`], ["Location", `${locationLabel || "Not entered"} · ${district || "District not selected"} · ${city || "Mandal not selected"}`]].map(([title, value]) => <div key={title} className="rounded-xl border border-slate-200 p-3"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--primary)]">{title}</p><p className="mt-1 text-sm text-slate-700">{value}</p></div>)}</div>{workUrls.length ? <div className="mt-4 flex gap-2 overflow-x-auto">{workUrls.map((url) => <img key={url} src={url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />)}</div> : null}<label className="mt-5 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />I confirm that the information provided is correct.</label>{fieldError("confirm") ? <p className="mt-1 text-xs text-red-600">{fieldError("confirm")}</p> : null}</StaySection> : null}

      {error ? <p className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-7 flex gap-3 border-t border-slate-100 pt-5"><button type="button" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))} className="inline-flex h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Back</button>{step < 9 ? <button type="button" onClick={() => { if (validateStep()) setStep((current) => Math.min(9, current + 1)); }} className="inline-flex h-12 flex-[1.5] items-center justify-center gap-1 rounded-xl bg-[var(--primary)] text-sm font-semibold text-white">Continue <ChevronRight className="h-4 w-4" /></button> : <button type="button" disabled={saving} onClick={() => void submit()} className="inline-flex h-12 flex-[1.5] items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60">{saving ? "Submitting..." : "Submit Homestay for Approval"}</button>}</div>
    </>
  );

  const fields = (
    <>
      <div className="mb-6">
        <button type="button" onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-600"><ChevronLeft className="h-4 w-4" /> Back</button>
      </div>

      <StaySection n={1} title="Basic Homestay Details" hint="Tell us about your homestay.">
        <div className="space-y-4">
          <StayField label="Homestay Name" required><input value={name} onBlur={() => touch("name")} onChange={(e) => setName(e.target.value)} placeholder="Example: Green Valley Homestay" className={stayInputClass} />{fieldError("name") ? <p className="mt-1 text-xs text-red-600">{fieldError("name")}</p> : null}</StayField>
          <div className="grid gap-4 sm:grid-cols-2">
            <StayField label="Host Mobile Number" required><input value={mobile} onBlur={() => touch("mobile")} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Enter 10-digit mobile number" inputMode="numeric" className={stayInputClass} />{fieldError("mobile") ? <p className="mt-1 text-xs text-red-600">{fieldError("mobile")}</p> : null}</StayField>
            <StayField label="Homestay Type" required hint="Choose the option that best describes your property."><select value={stayType} onBlur={() => touch("stayType")} onChange={(e) => setStayType(e.target.value)} className={stayInputClass}><option value="">Select homestay type</option>{HOMESTAY_TYPES.map((option) => <option key={option}>{option}</option>)}</select>{fieldError("stayType") ? <p className="mt-1 text-xs text-red-600">{fieldError("stayType")}</p> : null}</StayField>
            <StayField label="Does the host live on this property?" required><div className="mt-1.5 grid grid-cols-2 gap-2">{["Yes", "No"].map((option) => <button key={option} type="button" onClick={() => setHostOnProperty(option)} className={cn("rounded-xl border px-3 py-2.5 text-sm font-medium", hostOnProperty === option ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-slate-200 text-slate-600")}>{option === "Yes" ? "Yes, I live here" : "No, I don't live here"}</button>)}</div></StayField>
            <StayField label="How many guests can stay at the property?" required hint="Select the maximum number of guests you can accommodate at one time."><select value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} className={stayInputClass}>{[["1–2 Guests", "2"], ["3–4 Guests", "4"], ["5–6 Guests", "6"], ["7–10 Guests", "10"], ["10+ Guests", "10+"]].map((option) => <option key={option[1]} value={option[1]}>{option[0]}</option>)}</select></StayField>
          </div>
        </div>
      </StaySection>

      <StaySection n={2} title="Accommodation & Rates" required hint="Select what guests can book and set the price per night.">
        <div className="space-y-3">{HOMESTAY_ROOMS.map((room) => { const on = rooms.includes(room); const quote = quotes[room] ?? emptyQuote(); const details = room === "Entire Home" ? ["Guests can book the complete property.", "Number of Homes", "Price per Night", "Maximum Guests"] : room === "Private Bedroom" ? ["Guests can book a private bedroom.", "Number of Bedrooms", "Price per Bedroom / Night", "Guests per Bedroom"] : room === "Shared / Extra Bedroom" ? ["Guests share the room or property with others.", "Number of Rooms", "Price per Room / Night", "Maximum Guests"] : ["Guests book an individual bed in a shared dormitory.", "Number of Beds", "Price per Bed / Night", "Maximum Guests"]; return <div key={room} className={cn("rounded-2xl border p-4", on ? "border-[var(--primary)] bg-[var(--primary-soft)]/40" : "border-slate-200")}><button type="button" onClick={() => toggleRoom(room)} className="flex w-full items-start gap-3 text-left"><span className={cn("mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", on ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-slate-300")}>{on ? <Check className="h-3.5 w-3.5" /> : null}</span><span><span className="block text-sm font-bold text-slate-900">{room}</span><span className="mt-0.5 block text-xs text-slate-500">{details[0]}</span></span></button>{on ? <div className="mt-4 grid gap-3 sm:grid-cols-3"><StayField label={`${details[1]} *`}><select value={quote.available} onChange={(e) => setQuotes((current) => ({ ...current, [room]: { ...quote, available: e.target.value } }))} className={stayInputClass}>{ROOMS_AVAILABLE.map((option) => <option key={option}>{option}</option>)}</select></StayField><StayField label={`${details[2]} *`}><div className="relative"><span className="absolute left-3 top-3 text-sm text-slate-500">₹</span><input value={quote.rate} onChange={(e) => setQuotes((current) => ({ ...current, [room]: { ...quote, rate: e.target.value.replace(/\D/g, "").slice(0, 7) } }))} placeholder="1,500" inputMode="numeric" className={`${stayInputClass} pl-7`} /></div></StayField><StayField label={`${details[3]} *`}><select value={quote.occupancy} onChange={(e) => setQuotes((current) => ({ ...current, [room]: { ...quote, occupancy: e.target.value } }))} className={stayInputClass}>{ROOM_OCCUPANCY.map((option) => <option key={option}>{option} guests</option>)}</select></StayField></div> : null}</div>; })}</div>{fieldError("rooms") ? <p className="mt-2 text-xs text-red-600">{fieldError("rooms")}</p> : null}
      </StaySection>

      <StaySection n={3} title="Property Amenities" hint="Select all facilities available at your homestay."><StayCheckGrid values={HOMESTAY_AMENITIES} selected={amenities} onToggle={(value) => toggle(amenities, value, setAmenities)} /><StayField label="Other Amenities" className="mt-4"><input value={otherAmenities} onChange={(e) => setOtherAmenities(e.target.value)} placeholder="Enter any other facility..." className={stayInputClass} /></StayField></StaySection>

      <StaySection n={4} title="Meals & Food Options" hint="Tell guests which food options are available."><StayCheckGrid values={HOMESTAY_MEALS} selected={meals} onToggle={(value) => toggle(meals, value, setMeals)} /><div className="mt-4 grid gap-3 sm:grid-cols-3">{["Breakfast", "Lunch", "Dinner"].filter((meal) => meals.includes(meal)).map((meal) => <StayField key={meal} label={`${meal} Price`}><div className="relative"><span className="absolute left-3 top-3 text-sm text-slate-500">₹</span><input value={mealPrices[meal] ?? ""} onChange={(e) => setMealPrices((current) => ({ ...current, [meal]: e.target.value.replace(/\D/g, "") }))} placeholder="Optional" inputMode="numeric" className={`${stayInputClass} pl-7`} /></div></StayField>)}</div><StayField label="Are meals included in the accommodation price?" hint="Guests should clearly understand whether food is included in the room price." className="mt-5"><select value={mealsIncluded} onChange={(e) => setMealsIncluded(e.target.value)} className={stayInputClass}><option>Yes</option><option>No</option><option>Some meals are included</option></select></StayField></StaySection>

      <StaySection n={5} title="House Rules & Suitable For"><p className="text-sm font-bold text-slate-900">House Rules</p><p className="mt-1 text-xs text-slate-500">Select the rules guests must follow at your property.</p><StayCheckGrid values={HOMESTAY_RULES} selected={rules} onToggle={(value) => toggle(rules, value, setRules)} /><StayField label="Other House Rules" className="mt-4"><input value={otherRules} onChange={(e) => setOtherRules(e.target.value)} placeholder="Example: Quiet hours after 10 PM" className={stayInputClass} /></StayField><div className="mt-7 border-t border-slate-100 pt-5"><p className="text-sm font-bold text-slate-900">Suitable For</p><p className="mt-1 text-xs text-slate-500">Choose the types of guests your homestay is suitable for.</p><StayCheckGrid values={HOMESTAY_SUITABLE_FOR} selected={suitableFor} onToggle={(value) => toggle(suitableFor, value, setSuitableFor)} /></div></StaySection>

      <StaySection n={6} title="Booking Settings" hint="Choose how guests can book your homestay."><StayField label="How should bookings be confirmed?" required hint={bookingMode === "Instant Booking" ? "Guests can book immediately when your property is available." : "You can review and accept each booking request."}><select value={bookingMode === "On Confirmation" ? "Host Confirmation" : bookingMode} onChange={(e) => setBookingMode(e.target.value === "Host Confirmation" ? "On Confirmation" : e.target.value)} className={stayInputClass}><option>Instant Booking</option><option>Host Confirmation</option></select></StayField><div className="mt-4 grid gap-4 sm:grid-cols-2"><StayField label="Cancellation Policy" required><select value={cancellation === "Non-refundable" ? "No Refund" : cancellation} onChange={(e) => setCancellation(e.target.value === "No Refund" ? "Non-refundable" : e.target.value)} className={stayInputClass}><option>Free Cancellation</option><option>Partial Refund</option><option>No Refund</option></select></StayField>{cancellation === "Free Cancellation" ? <StayField label="Free cancellation until"><select value={freeCancellationUntil} onChange={(e) => setFreeCancellationUntil(e.target.value)} className={stayInputClass}>{["Same day", "1 day before check-in", "2 days before check-in", "3 days before check-in", "7 days before check-in"].map((option) => <option key={option}>{option}</option>)}</select></StayField> : null}<StayField label="How much advance notice do you need?" required hint="This controls how much notice you need before a guest can make a booking."><select value={advanceNotice} onChange={(e) => setAdvanceNotice(e.target.value)} className={stayInputClass}>{["Same day", "1 day", "2 days", "3 days", "7 days"].map((option) => <option key={option}>{option}</option>)}</select></StayField></div></StaySection>

      <StaySection n={7} title="Property Location" hint="Add the location of your homestay so guests can find it."><StayField label="Property Address" required><div className="flex gap-2"><input value={locationLabel} onBlur={() => touch("location")} onChange={(e) => { setLocationLabel(e.target.value); setLat(null); setLng(null); }} placeholder="House number, street, area" className={`${stayInputClass} mt-0`} /><button type="button" onClick={() => void detectLocation()} className="shrink-0 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white">{detecting ? "..." : "Detect Location"}</button></div>{fieldError("location") ? <p className="mt-1 text-xs text-red-600">{fieldError("location")}</p> : null}</StayField><div className="mt-4 grid gap-4 sm:grid-cols-2"><StayField label="District" required><select value={district} onBlur={() => touch("district")} onChange={(e) => { setDistrict(e.target.value); setCity(""); setMandals([]); }} className={stayInputClass}><option value="">Select District</option>{["Telangana", "Andhra Pradesh"].map((state) => <optgroup key={state} label={state}>{ELECTRICIAN_DISTRICTS.filter((item) => item.state === state).map((item) => <option key={item.name}>{item.name}</option>)}</optgroup>)}</select>{fieldError("district") ? <p className="mt-1 text-xs text-red-600">{fieldError("district")}</p> : null}</StayField><StayField label="Mandal / Town / City" required><select value={city} onBlur={() => touch("city")} onChange={(e) => setCity(e.target.value)} disabled={!district} className={stayInputClass}><option value="">{district ? "Select Mandal / Town / City" : "Select district first"}</option>{districtInfo?.mandals.map((mandal) => <option key={mandal}>{mandal}</option>)}</select>{fieldError("city") ? <p className="mt-1 text-xs text-red-600">{fieldError("city")}</p> : null}</StayField></div><div className="mt-5"><p className="text-sm font-medium text-slate-800">Where do you want to accept bookings? <span className="text-red-500">*</span></p><div className="mt-2 grid gap-2 sm:grid-cols-2">{(["Entire District", "Selected Mandals"] as CoverageType[]).map((option) => <button key={option} type="button" onClick={() => setCoverage(option)} className={cn("rounded-xl border px-3 py-3 text-left text-sm", coverage === option ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-slate-200")}><span className="font-semibold">{option}</span><span className="mt-1 block text-xs text-slate-500">{option === "Entire District" ? "Accept bookings from guests anywhere in this district." : "Accept bookings only from the mandals you select."}</span></button>)}</div>{coverage === "Selected Mandals" && districtInfo ? <><p className="mt-4 text-sm font-semibold">Select Mandals</p><StayCheckGrid values={districtInfo.mandals} selected={mandals} onToggle={(value) => toggle(mandals, value, setMandals)} /></> : null}{fieldError("coverage") ? <p className="mt-1 text-xs text-red-600">{fieldError("coverage")}</p> : null}</div></StaySection>

      <StaySection n={8} title="Homestay Photos" required hint="Add clear photos so guests can understand your property before booking."><div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{workUrls.map((url, index) => <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200"><img src={url} alt={`Homestay photo ${index + 1}`} className="h-full w-full object-cover" /><button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => { setWorkPhotos((current) => current.filter((_, i) => i !== index)); setCoverPhoto((current) => Math.min(current, Math.max(0, workPhotos.length - 2))); }} className="absolute right-1 top-1 rounded-full bg-white p-1 text-slate-700 shadow"><X className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setCoverPhoto(index)} className={cn("absolute bottom-1 left-1 rounded-md px-1.5 py-1 text-[10px] font-bold", coverPhoto === index ? "bg-[var(--primary)] text-white" : "bg-white/90 text-slate-700")}>{coverPhoto === index ? "Cover Photo" : "Set as cover"}</button></div>)}{workPhotos.length < 10 ? <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-500"><Plus className="h-5 w-5" /><span className="mt-1 text-xs font-semibold">Add Photos</span><input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { const next = Array.from(e.target.files ?? []); setWorkPhotos((current) => [...current, ...next].slice(0, 10)); e.target.value = ""; }} /></label> : null}</div><p className="mt-3 text-xs text-slate-500">Add up to 10 photos. Recommended: property, bedroom, bathroom, living area, kitchen, exterior and nearby area.</p>{fieldError("photos") ? <p className="mt-1 text-xs text-red-600">{fieldError("photos")}</p> : null}</StaySection>

      <div className="mt-7 border-t border-slate-100 pt-5"><label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />I confirm that the information provided is correct.</label>{fieldError("confirm") ? <p className="mt-1 text-xs text-red-600">{fieldError("confirm")}</p> : null}<button type="button" disabled={saving} onClick={() => void submit()} className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60">{saving ? "Submitting..." : "Submit Homestay for Approval"}</button></div>
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </>
  );

  void legacyFields;
  void wizardFields;

  const locationPopup = pickerOpen ? (
    <VendorLocationPopup
      initialLabel={locationLabel}
      initialLat={lat}
      initialLng={lng}
      pinLabel="Homestay location"
      onClose={() => setPickerOpen(false)}
      onConfirm={applyPickedLocation}
    />
  ) : null;

  if (embedded) {
    return <><div className="homestay-registration px-4 pb-6 md:px-0 [&>section:nth-of-type(7)>div>div:nth-child(2)]:hidden [&>section:nth-of-type(7)>div>div:nth-child(3)]:hidden">{fields}</div>{locationPopup}</>;
  }

  return (
    <div className="min-h-[100dvh] bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:min-h-[70vh] md:bg-[#f4f6f8] md:pb-10">
      <div className="md:mx-auto md:max-w-2xl md:px-0 md:pt-6 md:pb-8">
        <article className="bg-white md:rounded-2xl md:p-8 md:shadow-sm md:ring-1 md:ring-slate-200">
          <div className="homestay-registration px-4 pb-6 md:px-0 [&>section:nth-of-type(7)>div>div:nth-child(2)]:hidden [&>section:nth-of-type(7)>div>div:nth-child(3)]:hidden">{fields}</div>
        </article>
      </div>
      {locationPopup}
    </div>
  );
}
