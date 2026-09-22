"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CarTaxiFront, Plus } from "lucide-react";
import { FormBackButton } from "./form-back-button";
import { useAuth } from "@/features/auth/store";
import { ApiError, authFetch } from "@/shared/lib/api";
import { detectExactVendorLocation } from "./detect-exact-location";
import { cn } from "@/shared/lib/cn";
import {
  ADVANCE_NOTICE,
  AVAILABLE_DAYS,
  BOOKING_MODES,
  CAB_BOOKING_TYPES,
  CAB_DOCUMENTS,
  CAB_PROVIDER_TYPES,
  CAB_VEHICLES,
  DRIVER_AVAILABILITY,
  DRIVER_VERIFICATION,
  DRIVING_EXPERIENCE,
  ELECTRICIAN_DISTRICTS,
  EMERGENCY_OPTIONS,
  MIN_HOUR_OPTIONS,
  MIN_KM_OPTIONS,
  VEHICLE_AVAILABILITY,
  VEHICLE_CAPACITIES,
  VEHICLE_FEATURES,
  type CoverageType,
  type VehicleQuote,
} from "./cab-form-data";
import { useDraftFiles, useDraftState } from "./use-vendor-form-draft";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]";

const emptyQuote = (): VehicleQuote => ({ fare: "", capacity: "4", availability: "Available" });

export function CabRegistrationForm() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);

  const [name, setName] = useDraftState("cabs", "name", "");
  const [mobile, setMobile] = useDraftState("cabs", "mobile", "");
  const [providerType, setProviderType] = useDraftState("cabs", "providerType", "");
  const [whatsapp, setWhatsapp] = useDraftState("cabs", "whatsapp", "");
  const [vehicles, setVehicles] = useDraftState("cabs", "vehicles", [] as string[]);
  const [customVehicles, setCustomVehicles] = useDraftState("cabs", "customVehicles", [] as string[]);
  const [quotes, setQuotes] = useDraftState("cabs", "quotes", {} as Record<string, VehicleQuote>);
  const [features, setFeatures] = useDraftState("cabs", "features", [] as string[]);
  const [bookingTypes, setBookingTypes] = useDraftState("cabs", "bookingTypes", [] as string[]);
  const [minKm, setMinKm] = useDraftState("cabs", "minKm", "5 KM");
  const [minHours, setMinHours] = useDraftState("cabs", "minHours", "1 Hour");
  const [extraKm, setExtraKm] = useDraftState("cabs", "extraKm", "");
  const [waiting, setWaiting] = useDraftState("cabs", "waiting", "");
  const [nightCharge, setNightCharge] = useDraftState("cabs", "nightCharge", "");
  const [driverAllowance, setDriverAllowance] = useDraftState("cabs", "driverAllowance", "");
  const [driverName, setDriverName] = useDraftState("cabs", "driverName", "");
  const [driverMobile, setDriverMobile] = useDraftState("cabs", "driverMobile", "");
  const [drivingExperience, setDrivingExperience] = useDraftState("cabs", "drivingExperience", "Below 1 Year");
  const [driverVerification, setDriverVerification] = useDraftState("cabs", "driverVerification", "Verified");
  const [documents, setDocuments] = useDraftState("cabs", "documents", [] as string[]);
  const [bookingMode, setBookingMode] = useDraftState("cabs", "bookingMode", "Instant Booking");
  const [advanceNotice, setAdvanceNotice] = useDraftState("cabs", "advanceNotice", "Immediate");
  const [emergency, setEmergency] = useDraftState("cabs", "emergency", "Yes");
  const [driverAvailability, setDriverAvailability] = useDraftState("cabs", "driverAvailability", "Available Now");
  const [days, setDays] = useDraftState("cabs", "days", [] as string[]);
  const [startTime, setStartTime] = useDraftState("cabs", "startTime", "06:00");
  const [endTime, setEndTime] = useDraftState("cabs", "endTime", "22:00");
  const [locationLabel, setLocationLabel] = useDraftState("cabs", "locationLabel", "");
  const [lat, setLat] = useDraftState<number | null>("cabs", "lat", null);
  const [lng, setLng] = useDraftState<number | null>("cabs", "lng", null);
  const [district, setDistrict] = useDraftState("cabs", "district", "");
  const [coverage, setCoverage] = useDraftState<CoverageType>("cabs", "coverage", "Entire District");
  const [mandals, setMandals] = useDraftState("cabs", "mandals", [] as string[]);
  const [workPhotos, setWorkPhotos] = useDraftFiles("cabs", "workPhotos");
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  const vehicleOptions = [...CAB_VEHICLES, ...customVehicles];
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

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to list cab services</h1>
        <Link href="/login?next=/vendors/services/cabs" className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white">
          Sign in to continue
        </Link>
      </div>
    );
  }

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    setError("");
  }

  function toggleVehicle(value: string) {
    const on = vehicles.includes(value);
    setVehicles(on ? vehicles.filter((item) => item !== value) : [...vehicles, value]);
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

  function addVehicle() {
    const label = window.prompt("Vehicle type name");
    const next = label?.trim();
    if (!next || vehicleOptions.includes(next)) return;
    setCustomVehicles((current) => [...current, next]);
    toggleVehicle(next);
  }

  async function detectLocation() {
    setDetecting(true);
    setError("");
    try {
      const found = await detectExactVendorLocation();
      setLat(found.lat);
      setLng(found.lng);
      setLocationLabel(found.label);
      if (found.districtName) {
        setDistrict(found.districtName);
        setMandals([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not detect location. Enter it or pick a district.");
    } finally {
      setDetecting(false);
    }
  }

  function validate() {
    if (!name.trim()) return "Enter cab service name.";
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
    if (!providerType) return "Select provider type.";
    if (!vehicles.length) return "Select at least one vehicle type.";
    for (const vehicle of vehicles) {
      if (!quotes[vehicle]?.fare.trim()) return `Enter fare for ${vehicle}.`;
    }
    if (!bookingTypes.length) return "Select booking type.";
    if (!locationLabel.trim()) return "Detect or enter your current location.";
    if (!district) return "Select district.";
    if (coverage === "Selected Mandals" && !mandals.length) return "Select at least one mandal.";
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
      const fares = vehicles
        .map((vehicle) => `${vehicle}: ₹${quotes[vehicle].fare} / ${quotes[vehicle].capacity} seats / ${quotes[vehicle].availability}`)
        .join("; ");
      const firstFare = quotes[vehicles[0]]?.fare.replace(/\D/g, "") || "0";
      body.append("shopName", name.trim());
      body.append("businessName", name.trim());
      body.append("serviceName", name.trim());
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("providerType", providerType);
      body.append("whatsapp", whatsapp.replace(/\s/g, ""));
      body.append("cabType", vehicles[0]);
      body.append("vehicleTypes", vehicles.join(", "));
      body.append("vehicleFares", fares);
      body.append("vehicleFeatures", features.join(", "));
      body.append("bookingType", bookingTypes.join(", "));
      body.append("minKm", minKm);
      body.append("minHours", minHours);
      body.append("extraKmCharge", extraKm);
      body.append("waitingCharge", waiting);
      body.append("nightCharge", nightCharge);
      body.append("driverAllowance", driverAllowance);
      body.append("driverName", driverName.trim() || name.trim());
      body.append("driverMobile", driverMobile.replace(/\s/g, ""));
      body.append("drivingExperience", drivingExperience);
      body.append("driverVerification", driverVerification);
      body.append("documents", documents.join(", "));
      body.append("bookingMode", bookingMode);
      body.append("advanceNotice", advanceNotice);
      body.append("emergency", emergency);
      body.append("driverAvailability", driverAvailability);
      body.append("availableDays", days.join(", "));
      body.append("openingTime", startTime);
      body.append("closingTime", endTime);
      body.append("availableTime", `${startTime} - ${endTime}`);
      body.append("price", firstFare);
      body.append("priceUnit", "PER_KM");
      body.append("seats", quotes[vehicles[0]]?.capacity || "4");
      body.append("location", locationLabel.trim());
      body.append("district", district);
      body.append("state", info?.state || "");
      body.append("city", district);
      body.append("area", coverage === "Selected Mandals" ? mandals.join(", ") : district);
      body.append("coverageType", coverage);
      body.append("coverage", coverage === "Entire District" ? `Entire ${district}` : mandals.join(", "));
      body.append("mandals", mandals.join(", "));
      if (lat != null) body.append("latitude", String(lat));
      if (lng != null) body.append("longitude", String(lng));
      body.append("listedBy", user?.fullName ?? "");
      for (const photo of workPhotos.slice(0, 10)) body.append("photos", photo);

      const res = await authFetch("/vendor-listings/cabs", { method: "POST", token, body });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string | string[];
        data?: { title?: string };
      };
      if (!res.ok) {
        const text = Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Could not submit";
        throw new ApiError(text, res.status);
      }
      setSaved(json.data?.title || name.trim());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login?next=/vendors/services/cabs");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
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

  return (
    <div className="min-h-[100dvh] bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:min-h-[70vh] md:bg-[#f4f6f8] md:pb-10">
      <div className="md:mx-auto md:max-w-2xl md:px-0 md:pt-6 md:pb-8">
        <article className="bg-white md:rounded-2xl md:p-8 md:shadow-sm md:ring-1 md:ring-slate-200">
          <header className="sticky top-0 z-20 flex h-12 items-center gap-2.5 border-b border-slate-100 bg-white pl-12 pr-4 md:static md:h-auto md:border-0 md:px-0 md:pb-4">
            <FormBackButton />
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
              <CarTaxiFront className="h-5 w-5 text-amber-700" />
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">Cabs</h1>
          </header>

          <div className="px-4 pb-6 md:px-0">
          <Section n={1} title="Provider Details">
            <Field label="Business / Provider Name" required>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter cab service name" className={inputClass} />
            </Field>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Mobile Number" required>
                <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="Provider Type" required>
                <select value={providerType} onChange={(e) => setProviderType(e.target.value)} className={inputClass}>
                  <option value="">Select</option>
                  {CAB_PROVIDER_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Booking Contact / WhatsApp" className="mt-4">
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="WhatsApp number" inputMode="numeric" className={inputClass} />
            </Field>
          </Section>

          <Section n={2} title="Vehicles & Individual Fares" required>
            <div className="mb-2 flex items-center justify-end">
              <button type="button" onClick={addVehicle} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-white" aria-label="Add vehicle type">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-500">Select each vehicle type and set its own fare, capacity and availability.</p>
            <div className="mt-3 space-y-2">
              {vehicleOptions.map((vehicle) => {
                const on = vehicles.includes(vehicle);
                const quote = quotes[vehicle] ?? emptyQuote();
                return (
                  <div key={vehicle} className="rounded-lg border border-[#d7dde6] px-3 py-2.5">
                    <button type="button" onClick={() => toggleVehicle(vehicle)} className="flex w-full items-center gap-2.5 text-left text-sm">
                      <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-[3px] border", on ? "border-slate-800 bg-slate-800" : "border-slate-400")}>
                        {on ? <span className="text-[10px] font-bold text-white">✓</span> : null}
                      </span>
                      {vehicle}
                    </button>
                    {on ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <Field label="Fare">
                          <input
                            value={quote.fare}
                            onChange={(e) => setQuotes((current) => ({ ...current, [vehicle]: { ...quote, fare: e.target.value.replace(/\D/g, "").slice(0, 6) } }))}
                            placeholder="₹"
                            inputMode="numeric"
                            className={inputClass}
                          />
                        </Field>
                        <Field label="Capacity">
                          <select
                            value={quote.capacity}
                            onChange={(e) => setQuotes((current) => ({ ...current, [vehicle]: { ...quote, capacity: e.target.value } }))}
                            className={inputClass}
                          >
                            {VEHICLE_CAPACITIES.map((option) => (
                              <option key={option} value={option}>
                                {option} seats
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Availability">
                          <select
                            value={quote.availability}
                            onChange={(e) => setQuotes((current) => ({ ...current, [vehicle]: { ...quote, availability: e.target.value } }))}
                            className={inputClass}
                          >
                            {VEHICLE_AVAILABILITY.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section n={3} title="Vehicle Features">
            <CheckGrid values={VEHICLE_FEATURES} selected={features} onToggle={(value) => toggle(features, value, setFeatures)} />
          </Section>

          <Section n={4} title="Booking Types & Charges">
            <p className="text-sm font-medium text-slate-800">
              Booking Type <span className="text-red-500">*</span>
            </p>
            <CheckGrid values={CAB_BOOKING_TYPES} selected={bookingTypes} onToggle={(value) => toggle(bookingTypes, value, setBookingTypes)} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Minimum KM">
                <select value={minKm} onChange={(e) => setMinKm(e.target.value)} className={inputClass}>
                  {MIN_KM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Minimum Hours">
                <select value={minHours} onChange={(e) => setMinHours(e.target.value)} className={inputClass}>
                  {MIN_HOUR_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Extra KM Charge (₹)">
                <input value={extraKm} onChange={(e) => setExtraKm(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Per extra KM" inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="Waiting Charge (₹/Hour)">
                <input value={waiting} onChange={(e) => setWaiting(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Waiting charge" inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="Night Charge (₹)">
                <input value={nightCharge} onChange={(e) => setNightCharge(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Optional" inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="Driver Allowance (₹)">
                <input value={driverAllowance} onChange={(e) => setDriverAllowance(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Optional" inputMode="numeric" className={inputClass} />
              </Field>
            </div>
          </Section>

          <Section n={5} title="Driver Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Driver Name">
                <input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Driver name" className={inputClass} />
              </Field>
              <Field label="Driver Mobile">
                <input value={driverMobile} onChange={(e) => setDriverMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="Driving Experience">
                <select value={drivingExperience} onChange={(e) => setDrivingExperience(e.target.value)} className={inputClass}>
                  {DRIVING_EXPERIENCE.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Driver Verification">
                <select value={driverVerification} onChange={(e) => setDriverVerification(e.target.value)} className={inputClass}>
                  {DRIVER_VERIFICATION.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-800">Documents Available</p>
            <CheckGrid values={CAB_DOCUMENTS} selected={documents} onToggle={(value) => toggle(documents, value, setDocuments)} />
          </Section>

          <Section n={6} title="Booking Availability">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Booking Mode">
                <select value={bookingMode} onChange={(e) => setBookingMode(e.target.value)} className={inputClass}>
                  {BOOKING_MODES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Advance Notice">
                <select value={advanceNotice} onChange={(e) => setAdvanceNotice(e.target.value)} className={inputClass}>
                  {ADVANCE_NOTICE.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Emergency / Night Service">
                <select value={emergency} onChange={(e) => setEmergency(e.target.value)} className={inputClass}>
                  {EMERGENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Driver Availability">
                <select value={driverAvailability} onChange={(e) => setDriverAvailability(e.target.value)} className={inputClass}>
                  {DRIVER_AVAILABILITY.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-800">Working Days</p>
            <CheckGrid values={AVAILABLE_DAYS} selected={days} onToggle={(value) => toggle(days, value, setDays)} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Start Time">
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
              </Field>
              <Field label="End Time">
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
              </Field>
            </div>
          </Section>

          <Section n={7} title="Service Location & Coverage">
            <Field label="Current Location" required>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="Tap Detect Location"
                  className={`${inputClass} mt-0`}
                />
                <button type="button" onClick={() => void detectLocation()} className="shrink-0 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white">
                  {detecting ? "…" : "Detect"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">GPS location is used to match nearby cab providers.</p>
            </Field>
            <Field label="District" required className="mt-4">
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setMandals([]);
                }}
                className={inputClass}
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
            </Field>
            <p className="mt-4 text-sm font-medium text-slate-800">
              Service Coverage <span className="text-red-500">*</span>
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
                <CheckGrid values={districtInfo.mandals} selected={mandals} onToggle={(value) => toggle(mandals, value, setMandals)} />
              </div>
            ) : null}
          </Section>

          <Section n={8} title="Vehicle Photos">
            <div className="mt-2 flex flex-wrap gap-2">
              {workUrls.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setWorkPhotos((current) => current.filter((_, i) => i !== index))}
                  className="h-24 w-24 overflow-hidden rounded-xl bg-slate-100"
                >
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
            <p className="mt-2 text-xs text-slate-500">Add up to 10 clear vehicle photos.</p>
          </Section>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Submitting…" : "Submit for Admin Approval"}
          </button>
          </div>
        </article>
      </div>
    </div>
  );
}

function Section({ n, title, required, children }: { n: number; title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <section className="mt-6 border-t border-slate-100 pt-5 first:mt-3 first:border-0 first:pt-2">
      <h2 className="text-base font-bold text-slate-900">
        {n}. {title}
        {required ? <span className="text-red-500"> *</span> : null}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function CheckGrid({
  values,
  selected,
  onToggle,
}: {
  values: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {values.map((value) => {
        const on = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm",
              on ? "border-slate-400 bg-slate-50" : "border-[#d7dde6] bg-white",
            )}
          >
            <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-[3px] border", on ? "border-slate-800 bg-slate-800" : "border-slate-400")}>
              {on ? <span className="text-[10px] font-bold text-white">✓</span> : null}
            </span>
            {value}
          </button>
        );
      })}
    </div>
  );
}
