"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Paintbrush, Plus } from "lucide-react";
import { FormBackButton } from "./form-back-button";
import { useAuth } from "@/features/auth/store";
import { ApiError, authFetch } from "@/shared/lib/api";
import { geocodeVendorAddress } from "./detect-exact-location";
import { VendorLocationPopup } from "./vendor-location-popup";
import { cn } from "@/shared/lib/cn";
import {
  AVAILABLE_DAYS,
  AVAILABLE_TIMES,
  PAINTING_PROPERTY_TYPES,
  PAINTING_SERVICES,
  PAINTING_TOOLS,
  PAINTING_WORK_TYPES,
  PAINT_TYPES,
  ELECTRICIAN_DISTRICTS,
  EMERGENCY_OPTIONS,
  EXPERIENCE_OPTIONS,
  MATERIAL_OPTIONS,
  TEAM_SIZES,
  type CoverageType,
} from "./painting-form-data";
import { useDraftFiles, useDraftState } from "./use-vendor-form-draft";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]";

export function PaintingRegistrationForm() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);

  const [name, setName] = useDraftState("painting", "name", "");
  const [mobile, setMobile] = useDraftState("painting", "mobile", "");
  const [experience, setExperience] = useDraftState("painting", "experience", "");
  const [services, setServices] = useDraftState("painting", "services", [] as string[]);
  const [workTypes, setWorkTypes] = useDraftState("painting", "workTypes", [] as string[]);
  const [propertyTypes, setPropertyTypes] = useDraftState("painting", "propertyTypes", [] as string[]);
  const [paintKinds, setPaintKinds] = useDraftState("painting", "paintKinds", [] as string[]);
  const [tools, setTools] = useDraftState("painting", "tools", [] as string[]);
  const [visitCharge, setVisitCharge] = useDraftState("painting", "visitCharge", "");
  const [hourlyCharge, setHourlyCharge] = useDraftState("painting", "hourlyCharge", "");
  const [fullDayCharge, setFullDayCharge] = useDraftState("painting", "fullDayCharge", "");
  const [teamSize, setTeamSize] = useDraftState("painting", "teamSize", "1 Person");
  const [material, setMaterial] = useDraftState("painting", "material", "");
  const [emergency, setEmergency] = useDraftState("painting", "emergency", "Yes");
  const [days, setDays] = useDraftState("painting", "days", [] as string[]);
  const [availableTime, setAvailableTime] = useDraftState("painting", "availableTime", "Morning");
  const [locationLabel, setLocationLabel] = useDraftState("painting", "locationLabel", "");
  const [lat, setLat] = useDraftState<number | null>("painting", "lat", null);
  const [lng, setLng] = useDraftState<number | null>("painting", "lng", null);
  const [district, setDistrict] = useDraftState("painting", "district", "");
  const [coverage, setCoverage] = useDraftState<CoverageType>("painting", "coverage", "Entire District");
  const [mandals, setMandals] = useDraftState("painting", "mandals", [] as string[]);
  const [workPhotos, setWorkPhotos] = useDraftFiles("painting", "workPhotos");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  const districtInfo = ELECTRICIAN_DISTRICTS.find((item) => item.name === district);
  const workUrls = useMemo(() => workPhotos.map((file) => URL.createObjectURL(file)), [workPhotos]);

  useEffect(() => {
    return () => {
      workUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [workUrls]);

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.fullName || "");
    setMobile((current) => current || (user.phone || "").replace(/\D/g, "").slice(-10));
  }, [user]);

  useEffect(() => {
    setVisitCharge((current) => current.replace(/\D/g, ""));
    setHourlyCharge((current) => current.replace(/\D/g, ""));
    setFullDayCharge((current) => current.replace(/\D/g, ""));
  }, [setFullDayCharge, setHourlyCharge, setVisitCharge]);

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to list painting services</h1>
        <Link href="/login?next=/vendors/services/painting" className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white">
          Sign in to continue
        </Link>
      </div>
    );
  }

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    setError("");
  }

  function applyPickedLocation(found: { label: string; lat: number | null; lng: number | null; districtName?: string }) {
    setLocationLabel(found.label);
    setLat(found.lat);
    setLng(found.lng);
    if (found.districtName) {
      setDistrict(found.districtName);
      setMandals([]);
    }
    setPickerOpen(false);
    setError("");
  }

  function validate() {
    if (!name.trim()) return "Enter business / painter name.";
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
    if (!experience) return "Select experience.";
    if (!services.length) return "Select at least one painting service.";
    if (!workTypes.length) return "Select work type.";
    if (!visitCharge.trim()) return "Enter visit charge.";
    if (!hourlyCharge.trim()) return "Enter hourly charge.";
    if (!material) return "Select material responsibility.";
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
      body.append("painterName", name.trim());
      body.append("shopName", name.trim());
      body.append("serviceName", name.trim());
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("experienceYears", experience);
      body.append("servicesOffered", services.join(", "));
      body.append("paintingType", services.join(", "));
      body.append("workType", workTypes.join(", "));
      body.append("serviceType", workTypes[0] || services[0]);
      body.append("propertyType", propertyTypes.join(", "));
      body.append("paintTypes", paintKinds.join(", "));
      body.append("tools", tools.join(", "));
      body.append("materialResponsibility", material);
      body.append("material", material);
      body.append("visitCharge", visitCharge);
      body.append("startingCharge", visitCharge);
      body.append("price", visitCharge.trim());
      body.append("priceUnit", "PER_VISIT");
      body.append("hourlyCharge", hourlyCharge);
      body.append("fullDayCharge", fullDayCharge);
      body.append("teamSize", teamSize);
      body.append("emergency", emergency);
      body.append("availableDays", days.join(", "));
      body.append("availableTime", availableTime);
      body.append("location", locationLabel.trim());
      body.append("district", district);
      body.append("state", info?.state || "");
      body.append("city", district);
      body.append("area", coverage === "Selected Mandals" ? mandals.join(", ") : district);
      body.append("coverageType", coverage);
      body.append("coverage", coverage === "Entire District" ? `Entire ${district}` : mandals.join(", "));
      body.append("mandals", mandals.join(", "));
      let pinLat = lat;
      let pinLng = lng;
      if (pinLat == null || pinLng == null) {
        const pin = await geocodeVendorAddress(locationLabel.trim());
        if (!pin) throw new Error("Could not pin this service location on the map. Use Detect or enter a clearer address.");
        pinLat = pin.lat;
        pinLng = pin.lng;
      }
      body.append("latitude", String(pinLat));
      body.append("longitude", String(pinLng));
      body.append("listedBy", user?.fullName ?? "");
      for (const photo of workPhotos.slice(0, 10)) body.append("photos", photo);

      const res = await authFetch("/vendor-listings/painting", { method: "POST", token, body });
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
        router.push("/login?next=/vendors/services/painting");
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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50">
              <Paintbrush className="h-5 w-5 text-rose-600" />
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">Painting</h1>
          </header>

          <div className="px-4 pb-6 md:px-0">
          <Section n={1} title="Basic Details">
            <Field label="Business / Painter Name" required>
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
          </Section>

          <Section n={2} title="Painting Services" required>
            <CheckGrid values={PAINTING_SERVICES} selected={services} onToggle={(value) => toggle(services, value, setServices)} />
          </Section>

          <Section n={3} title="Property & Work Type" required>
            <p className="text-sm font-medium text-slate-800">Property Type</p>
            <CheckGrid values={PAINTING_PROPERTY_TYPES} selected={propertyTypes} onToggle={(value) => toggle(propertyTypes, value, setPropertyTypes)} />
            <p className="mt-4 text-sm font-medium text-slate-800">
              Work Type <span className="text-red-500">*</span>
            </p>
            <CheckGrid values={PAINTING_WORK_TYPES} selected={workTypes} onToggle={(value) => toggle(workTypes, value, setWorkTypes)} />
          </Section>

          <Section n={4} title="Paint, Material & Team">
            <p className="text-sm font-medium text-slate-800">Paint Types Supported</p>
            <CheckGrid values={PAINT_TYPES} selected={paintKinds} onToggle={(value) => toggle(paintKinds, value, setPaintKinds)} />
            <Field label="Material Responsibility" required className="mt-4">
              <select value={material} onChange={(e) => setMaterial(e.target.value)} className={inputClass}>
                <option value="">Select</option>
                {MATERIAL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Service Team Size" className="mt-4">
              <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className={inputClass}>
                {TEAM_SIZES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <p className="mt-4 text-sm font-medium text-slate-800">Tools Available</p>
            <CheckGrid values={PAINTING_TOOLS} selected={tools} onToggle={(value) => toggle(tools, value, setTools)} />
          </Section>

          <Section n={5} title="Charges & Availability">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Visit Charge" required>
                <input value={visitCharge} onChange={(e) => setVisitCharge(e.target.value.replace(/\D/g, ""))} placeholder="Enter amount" inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="Hourly Charge" required>
                <input value={hourlyCharge} onChange={(e) => setHourlyCharge(e.target.value.replace(/\D/g, ""))} placeholder="Enter amount" inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="Full Day Charge">
                <input value={fullDayCharge} onChange={(e) => setFullDayCharge(e.target.value.replace(/\D/g, ""))} placeholder="Enter amount" inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="Emergency / Same-Day Service">
                <select value={emergency} onChange={(e) => setEmergency(e.target.value)} className={inputClass}>
                  {EMERGENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
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

          <Section n={6} title="Service Location">
            <Field label="Service Location" required>
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
                  className={`${inputClass} mt-0`}
                />
                <button type="button" onClick={() => setPickerOpen(true)} className="shrink-0 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white">
                  Detect
                </button>
              </div>
            </Field>
            {pickerOpen ? (
              <VendorLocationPopup
                initialLabel={locationLabel}
                initialLat={lat}
                initialLng={lng}
                pinLabel="Service location"
                onClose={() => setPickerOpen(false)}
                onConfirm={applyPickedLocation}
              />
            ) : null}
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

          <Section n={7} title="Work Photos">
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
