"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brush, MapPin, Plus, Snowflake, Wrench, Zap } from "lucide-react";
import { FormBackButton } from "./form-back-button";
import { useAuth } from "@/features/auth/store";
import { ApiError, authFetch } from "@/shared/lib/api";
import { detectExactVendorLocation, geocodeVendorAddress } from "./detect-exact-location";
import { VendorLocationPopup } from "./vendor-location-popup";
import { cn } from "@/shared/lib/cn";
import {
  AVAILABLE_DAYS,
  AVAILABLE_TIMES,
  ELECTRICIAN_DISTRICTS,
  EMERGENCY_OPTIONS,
  EXPERIENCE_OPTIONS,
  FULL_DAY_CHARGES,
  HOURLY_CHARGES,
  TEAM_SIZES,
  visitChargeAmount,
  type CoverageType,
} from "./electrician-form-data";
import { useDraftFile, useDraftFiles, useDraftState } from "./use-vendor-form-draft";

export type ExtraGroup = {
  title: string;
  field: string;
  required?: boolean;
  options: readonly string[];
};

export type TradeSpec = {
  id: "electrician" | "plumber" | "cleaning" | "ac";
  title: string;
  subtitle: string;
  nameLabel: string;
  nameField: "electricianName" | "plumberName" | "cleanerName" | "technicianName";
  servicesTitle: string;
  services: readonly string[];
  audienceTitle: string;
  audienceOptions: readonly string[];
  extraGroups?: ExtraGroup[];
  chargesTitle: string;
  chargeLabel: string;
  charges: readonly string[];
  chargeAsAmount?: boolean;
  useMapLocation?: boolean;
  hideDistrictCoverage?: boolean;
  showServiceKm?: boolean;
  hideProfilePhoto?: boolean;
  hideHourlyFullDay?: boolean;
  showAdditionalInfo?: boolean;
  emergencyLabel: string;
  extraCharges: boolean;
  icon: "zap" | "wrench" | "broom" | "snow";
};

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]";

export function TradeRegistrationForm({ spec }: { spec: TradeSpec }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);

  const formId = spec.id;
  const [name, setName] = useDraftState(formId, "name", "");
  const [mobile, setMobile] = useDraftState(formId, "mobile", "");
  const [experience, setExperience] = useDraftState(formId, "experience", "");
  const [profilePhoto, setProfilePhoto] = useDraftFile(formId, "profilePhoto");
  const [services, setServices] = useDraftState(formId, "services", [] as string[]);
  const [customerTypes, setCustomerTypes] = useDraftState(formId, "customerTypes", [] as string[]);
  const [extraPicks, setExtraPicks] = useDraftState(formId, "extraPicks", {} as Record<string, string[]>);
  const [visitCharge, setVisitCharge] = useDraftState(formId, "visitCharge", "");
  const [hourlyCharge, setHourlyCharge] = useDraftState(formId, "hourlyCharge", "");
  const [fullDayCharge, setFullDayCharge] = useDraftState(formId, "fullDayCharge", "Not Available");
  const [teamSize, setTeamSize] = useDraftState(formId, "teamSize", "1 Person");
  const [emergency, setEmergency] = useDraftState(formId, "emergency", "Yes");
  const [days, setDays] = useDraftState(formId, "days", [] as string[]);
  const [availableTime, setAvailableTime] = useDraftState(formId, "availableTime", "Morning");
  const [locationLabel, setLocationLabel] = useDraftState(formId, "locationLabel", "");
  const [lat, setLat] = useDraftState<number | null>(formId, "lat", null);
  const [lng, setLng] = useDraftState<number | null>(formId, "lng", null);
  const [district, setDistrict] = useDraftState(formId, "district", "");
  const [coverage, setCoverage] = useDraftState<CoverageType>(formId, "coverage", "Entire District");
  const [mandals, setMandals] = useDraftState(formId, "mandals", [] as string[]);
  const [serviceKm, setServiceKm] = useDraftState(formId, "serviceKm", "");
  const [workPhotos, setWorkPhotos] = useDraftFiles(formId, "workPhotos");
  const [extraInfo, setExtraInfo] = useDraftState(formId, "extraInfo", "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  const districtInfo = ELECTRICIAN_DISTRICTS.find((item) => item.name === district);
  const profileUrl = useMemo(() => (profilePhoto ? URL.createObjectURL(profilePhoto) : ""), [profilePhoto]);
  const workUrls = useMemo(() => workPhotos.map((file) => URL.createObjectURL(file)), [workPhotos]);

  useEffect(() => {
    return () => {
      if (profileUrl) URL.revokeObjectURL(profileUrl);
      workUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [profileUrl, workUrls]);

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.fullName || "");
    setMobile((current) => current || (user.phone || "").replace(/\D/g, "").slice(-10));
  }, [user]);

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to list {spec.id} services</h1>
        <Link href={`/login?next=/vendors/services/${spec.id}`} className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white">
          Sign in to continue
        </Link>
      </div>
    );
  }

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    setError("");
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
    if (!name.trim()) return `Enter ${spec.nameLabel.toLowerCase()}.`;
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
    if (!experience) return "Select experience.";
    if (!services.length) return `Select at least one ${spec.servicesTitle.toLowerCase().replace(/s$/, "")}.`;
    if (spec.extraGroups?.length) {
      for (const group of spec.extraGroups) {
        if (group.required && !(extraPicks[group.field] ?? []).length) return `Select ${group.title.toLowerCase()}.`;
      }
    } else if (!customerTypes.length) {
      return `Select ${spec.audienceTitle.toLowerCase()}.`;
    }
    if (!visitCharge.trim()) return spec.chargeAsAmount ? `Enter ${spec.chargeLabel.toLowerCase()}.` : `Select ${spec.chargeLabel.toLowerCase()}.`;
    if (spec.extraCharges && !spec.hideHourlyFullDay && !hourlyCharge.trim()) return spec.chargeAsAmount ? "Enter hourly charge." : "Select hourly charge.";
    if (!locationLabel.trim()) return "Detect or enter your current location.";
    if (spec.showServiceKm && !serviceKm.trim()) return "Enter service area in KM.";
    if (!spec.hideDistrictCoverage && !district) return "Select district.";
    if (!spec.hideDistrictCoverage && coverage === "Selected Mandals" && !mandals.length) return "Select at least one mandal.";
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
      body.append(spec.nameField, name.trim());
      body.append("shopName", name.trim());
      body.append("serviceName", name.trim());
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("experienceYears", experience);
      body.append("servicesOffered", services.join(", "));
      body.append("workType", services[0]);
      body.append("cleaningType", services[0]);
      body.append("customerType", customerTypes.join(", "));
      body.append("serviceType", extraPicks.acType?.[0] || customerTypes[0] || services[0]);
      body.append("propertyType", customerTypes.join(", "));
      for (const group of spec.extraGroups ?? []) {
        const picked = extraPicks[group.field] ?? [];
        if (picked.length) body.append(group.field, picked.join(", "));
      }
      body.append("visitCharge", visitCharge);
      body.append("startingCharge", visitCharge);
      body.append("price", String(visitChargeAmount(visitCharge)));
      body.append("priceUnit", "PER_VISIT");
      if (spec.extraCharges) {
        if (!spec.hideHourlyFullDay) {
          body.append("hourlyCharge", hourlyCharge);
          body.append("fullDayCharge", fullDayCharge);
        }
        body.append("teamSize", teamSize);
      }
      body.append("emergency", emergency);
      body.append("availableDays", days.join(", "));
      body.append("availableTime", availableTime);
      body.append("location", locationLabel.trim());
      if (spec.showServiceKm) {
        body.append("serviceKm", serviceKm);
        body.append("serviceArea", `Within ${serviceKm} KM`);
        body.append("coverage", `Within ${serviceKm} KM`);
      }
      body.append("district", district);
      body.append("state", info?.state || "");
      body.append("city", district);
      body.append("area", spec.hideDistrictCoverage ? locationLabel.trim() : coverage === "Selected Mandals" ? mandals.join(", ") : district);
      if (!spec.hideDistrictCoverage) {
        body.append("coverageType", coverage);
        body.append("coverage", coverage === "Entire District" ? `Entire ${district}` : mandals.join(", "));
        body.append("mandals", mandals.join(", "));
      }
      let pinLat = lat;
      let pinLng = lng;
      if (pinLat == null || pinLng == null) {
        const pin = await geocodeVendorAddress(locationLabel.trim());
        if (pin) {
          pinLat = pin.lat;
          pinLng = pin.lng;
        }
      }
      if (pinLat != null) body.append("latitude", String(pinLat));
      if (pinLng != null) body.append("longitude", String(pinLng));
      body.append("listedBy", user?.fullName ?? "");
      if (spec.showAdditionalInfo && extraInfo.trim()) body.append("description", extraInfo.trim());
      const photos = [...(spec.hideProfilePhoto ? [] : profilePhoto ? [profilePhoto] : []), ...workPhotos].slice(0, 10);
      for (const photo of photos) body.append("photos", photo);

      const res = await authFetch(`/vendor-listings/${spec.id}`, { method: "POST", token, body });
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
        router.push(`/login?next=/vendors/services/${spec.id}`);
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
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                spec.icon === "wrench"
                  ? "bg-indigo-50"
                  : spec.icon === "snow"
                    ? "bg-sky-50"
                    : "bg-orange-50",
              )}
            >
              {spec.icon === "wrench" ? (
                <Wrench className="h-5 w-5 text-indigo-500" />
              ) : spec.icon === "broom" ? (
                <Brush className="h-5 w-5 text-orange-700" />
              ) : spec.icon === "snow" ? (
                <Snowflake className="h-5 w-5 text-sky-500" />
              ) : (
                <Zap className="h-5 w-5 fill-orange-400 text-orange-500" />
              )}
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">{spec.title}</h1>
          </header>

          <div className="px-4 pb-6 md:px-0">
          <Section n={1} title="Basic Details">
            <Field label={spec.nameLabel} required>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" className={inputClass} />
            </Field>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Mobile Number" required>
                <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="Experience" required>
                <select value={experience} onChange={(e) => setExperience(e.target.value)} className={inputClass}>
                  <option value="">Select</option>
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {spec.hideProfilePhoto ? null : (
              <Field label="Profile / Business Photo" className="mt-4">
                <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg border border-[#d7dde6] px-3 py-2.5 text-sm">
                  <span className="rounded-md bg-slate-100 px-3 py-1.5 font-medium">Choose File</span>
                  <span className="truncate text-slate-500">{profilePhoto ? profilePhoto.name : "No file chosen"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => setProfilePhoto(e.target.files?.[0] ?? null)}
                  />
                </label>
              </Field>
            )}
          </Section>

          <Section n={2} title={spec.servicesTitle} required>
            <CheckGrid values={spec.services} selected={services} onToggle={(value) => toggle(services, value, setServices)} />
          </Section>

          <Section n={3} title={spec.audienceTitle} required={Boolean(spec.extraGroups?.some((group) => group.required))}>
            {spec.extraGroups?.length ? (
              spec.extraGroups.map((group) => (
                <div key={group.field} className="mt-4 first:mt-0">
                  <p className="text-sm font-medium text-slate-800">
                    {group.title}
                    {group.required ? <span className="text-red-500"> *</span> : null}
                  </p>
                  <CheckGrid
                    values={group.options}
                    selected={extraPicks[group.field] ?? []}
                    onToggle={(value) =>
                      toggle(extraPicks[group.field] ?? [], value, (next) =>
                        setExtraPicks((current) => ({ ...current, [group.field]: next })),
                      )
                    }
                  />
                </div>
              ))
            ) : (
              <CheckGrid values={spec.audienceOptions} selected={customerTypes} onToggle={(value) => toggle(customerTypes, value, setCustomerTypes)} />
            )}
          </Section>

          <Section n={4} title={spec.chargesTitle}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={spec.chargeLabel} required>
                {spec.chargeAsAmount ? (
                  <input
                    value={visitCharge.replace(/\D/g, "").slice(0, 6)}
                    onChange={(e) => setVisitCharge(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="₹ Enter amount"
                    inputMode="numeric"
                    className={inputClass}
                  />
                ) : (
                  <select value={visitCharge} onChange={(e) => setVisitCharge(e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    {spec.charges.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              {spec.extraCharges && !spec.hideHourlyFullDay ? (
                <Field label="Hourly Charge" required>
                  {spec.chargeAsAmount ? (
                    <input
                      value={hourlyCharge.replace(/\D/g, "").slice(0, 6)}
                      onChange={(e) => setHourlyCharge(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="₹ Enter amount"
                      inputMode="numeric"
                      className={inputClass}
                    />
                  ) : (
                    <select value={hourlyCharge} onChange={(e) => setHourlyCharge(e.target.value)} className={inputClass}>
                      <option value="">Select</option>
                      {HOURLY_CHARGES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              ) : (
                <Field label={spec.emergencyLabel}>
                  <select value={emergency} onChange={(e) => setEmergency(e.target.value)} className={inputClass}>
                    {EMERGENCY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {spec.extraCharges && !spec.hideHourlyFullDay ? (
                <Field label="Full Day Charge">
                  {spec.chargeAsAmount ? (
                    <input
                      value={fullDayCharge.replace(/\D/g, "").slice(0, 6)}
                      onChange={(e) => setFullDayCharge(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="₹ Enter amount"
                      inputMode="numeric"
                      className={inputClass}
                    />
                  ) : (
                    <select value={fullDayCharge} onChange={(e) => setFullDayCharge(e.target.value)} className={inputClass}>
                      {FULL_DAY_CHARGES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              ) : null}
              {spec.extraCharges ? (
                <Field label="Service Team Size">
                  <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className={inputClass}>
                    {TEAM_SIZES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
              {spec.extraCharges && !spec.hideHourlyFullDay ? (
                <Field label={spec.emergencyLabel}>
                  <select value={emergency} onChange={(e) => setEmergency(e.target.value)} className={inputClass}>
                    {EMERGENCY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </div>
            <p className="mt-4 text-sm font-medium text-slate-800">Available Days</p>
            <CheckGrid values={AVAILABLE_DAYS} selected={days} onToggle={(value) => toggle(days, value, setDays)} />
            <Field label="Available Time" className="mt-4">
              <select value={availableTime} onChange={(e) => setAvailableTime(e.target.value)} className={inputClass}>
                {AVAILABLE_TIMES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          <Section n={5} title="Service Location">
            <Field label="Current Location" required>
              {spec.useMapLocation ? (
                locationLabel ? (
                  <div className="mt-1.5 rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-3">
                    <p className="text-sm text-slate-900">{locationLabel}</p>
                    <button type="button" onClick={() => setPickerOpen(true)} className="mt-2 text-sm font-semibold text-[var(--primary)]">
                      Change location
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="mt-1.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-[#f8fafc] text-sm font-semibold text-slate-800"
                  >
                    <MapPin className="h-4 w-4 text-amber-600" />
                    Use Current Location
                  </button>
                )
              ) : (
                <>
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
                  <p className="mt-1.5 text-xs text-slate-500">GPS location is used to identify your district automatically.</p>
                </>
              )}
            </Field>
            {pickerOpen ? (
              <VendorLocationPopup
                initialLabel={locationLabel}
                initialLat={lat}
                initialLng={lng}
                pinLabel="Service location"
                onClose={() => setPickerOpen(false)}
                onConfirm={(found) => {
                  setLocationLabel(found.label);
                  setLat(found.lat);
                  setLng(found.lng);
                  if (found.districtName) setDistrict(found.districtName);
                  setPickerOpen(false);
                  setError("");
                }}
              />
            ) : null}
            {spec.showServiceKm ? (
              <Field label="Service Area" required className="mt-4">
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm text-slate-600">Within</span>
                  <input
                    value={serviceKm}
                    onChange={(e) => setServiceKm(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="___"
                    inputMode="numeric"
                    className={`${inputClass} mt-0 max-w-[7rem] text-center`}
                  />
                  <span className="text-sm font-medium text-slate-700">KM</span>
                </div>
              </Field>
            ) : null}
            {spec.hideDistrictCoverage ? null : (
              <>
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
              </>
            )}
          </Section>

          <Section n={6} title="Work Photos">
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
            <p className="mt-2 text-xs text-slate-500">Add up to 10 work photos. Tap + to add more photos.</p>
          </Section>

          {spec.showAdditionalInfo ? (
            <Section n={7} title="Additional Information">
              <textarea
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                rows={4}
                placeholder="Enter additional information"
                className={`${inputClass} h-auto min-h-[6.5rem] resize-y py-3`}
              />
            </Section>
          ) : null}

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
