"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, CheckCircle2, ImagePlus, LocateFixed, MapPin, X } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { CategoryArt } from "@/features/home/components/category-art";
import { CITIES_BY_STATE, makeCityPlace, placeLabel, reverseGeocode, searchPlaces, type Place } from "@/shared/lib/india-places";
import { ApiError, authFetch } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { VENDOR_SERVICE_SPECS, type VendorServiceField, type VendorServiceSpec } from "./vendor-service-specs";
import type { VendorFormConfig } from "./vendor-form-config";
import { publicEmail } from "@/shared/lib/email";
import { useDraftFiles, useDraftState } from "./use-vendor-form-draft";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Photos" },
  { id: 3, label: "Location" },
] as const;

const HOTEL_TYPES = [
  "Hotel",
  "Lodge",
  "Guest House",
  "Resort",
  "Homestay",
  "Hostel",
  "Apartment",
  "Serviced Apartment",
  "Villa",
  "Farmhouse",
  "Cottage",
  "Boutique Hotel",
  "Heritage / Palace",
  "Bed & Breakfast",
  "Motel",
  "Studio",
  "Penthouse",
  "Dormitory",
  "Paying Guest (PG)",
  "Camp / Tent",
  "Houseboat",
  "Treehouse",
];
const ROOM_TYPES = ["Standard", "Deluxe", "Super Deluxe", "Suite", "AC", "Non-AC", "Dormitory"];

export function ListingWizard({ config }: { config: VendorFormConfig }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const spec = VENDOR_SERVICE_SPECS[config.id];
  const isHotel = config.id === "hotels";

  const formId = `wizard-${config.id}`;
  const [step, setStep] = useDraftState(formId, "step", 1);
  const [values, setValues] = useDraftState(formId, "values", {} as Record<string, string>);
  const [priceUnit, setPriceUnit] = useDraftState(formId, "priceUnit", "");
  const [photos, setPhotos] = useDraftFiles(formId, "photos");
  const [place, setPlace] = useDraftState<Place | null>(formId, "place", null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState("");
  const previews = useMemo(() => photos.map((file) => ({ file, url: URL.createObjectURL(file) })), [photos]);

  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  useEffect(() => {
    if (!user) return;
    setValues((current) => ({
      ...current,
      mobileNumber: current.mobileNumber || user.phone || "",
      phone: current.phone || user.phone || "",
      ownerName: current.ownerName || user.fullName || "",
      email: current.email || publicEmail(user.email),
    }));
    if (spec) {
      const priceField = spec.fields.find((field) => field.kind === "price");
      if (priceField?.kind === "price") setPriceUnit(priceField.units[0].value);
    }
    if (isHotel) {
      setPriceUnit("PER_ROOM");
      setValues((current) => ({
        ...current,
        checkInTime: current.checkInTime || "12:00",
        checkOutTime: current.checkOutTime || "11:00",
      }));
    }
  }, [user, spec, isHotel]);

  if (!user || !token) {
    return (
      <AuthGate title={`Sign in to list ${spec?.navLabel.toLowerCase() ?? config.title.toLowerCase()}`} next={`/vendors/services/${config.id}`} />
    );
  }

  const listedBy = user.fullName;

  function setField(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  }

  function validateDetails() {
    if (isHotel) {
      if (!values.hotelName?.trim()) return "Please enter the hotel name.";
      if (!/^\d{10}$/.test((values.mobileNumber || "").replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
      if (!values.hotelType) return "Please choose hotel type.";
      if (!values.roomType) return "Please choose room type.";
      if (spec.fields.some((field) => field.kind === "price") && (!values.price || Number(values.price) <= 0)) return "Please enter a valid price.";
      return "";
    }
    if (spec) {
      for (const field of spec.fields) {
        if (field.kind === "photos" || field.kind === "price") continue;
        const value = (values[field.name] ?? "").trim();
        if (field.required && !value) return `Please fill in ${field.label.toLowerCase()}.`;
        if (field.kind === "tel" && value && !/^\d{10}$/.test(value.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
      }
      if (!values.price || Number(values.price) <= 0) return "Please enter a valid price.";
      return "";
    }
    for (const section of config.sections) {
      for (const field of section.fields) {
        const value = (values[field.name] ?? "").trim();
        if (field.required && !value) return `Please fill in ${field.label.toLowerCase()}.`;
      }
    }
    return "";
  }

  function nextFromDetails() {
    const message = validateDetails();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep(2);
  }

  async function submit(selected: Place) {
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      const location = placeLabel(selected);
      if (isHotel) {
        body.append("hotelName", values.hotelName.trim());
        body.append("mobileNumber", (values.mobileNumber || "").replace(/\s/g, ""));
        body.append("hotelType", values.hotelType);
        body.append("roomType", values.roomType);
        body.append("location", location);
        body.append("price", values.price);
        body.append("priceUnit", priceUnit || "PER_ROOM");
        if (values.entryPrice) body.append("entryPrice", values.entryPrice);
        body.append("checkInTime", values.checkInTime || "12:00");
        body.append("checkOutTime", values.checkOutTime || "11:00");
        body.append("listedBy", listedBy);
      } else {
        const skip = new Set(["phone", "mobileNumber", "city", "state", "area", "location", "listedBy", "latitude", "longitude"]);
        for (const [key, value] of Object.entries(values)) {
          if (!value || skip.has(key)) continue;
          body.append(key, String(value).trim());
        }
        const mobile = (values.mobileNumber || values.phone || "").replace(/\s/g, "");
        if (mobile) body.append("mobileNumber", mobile);
        if (priceUnit) body.append("priceUnit", priceUnit);
        if (!values.price) {
          const amount = values.feeFrom || values.priceFrom;
          if (amount) body.append("price", String(amount));
        }
        body.append("location", location);
        body.append("listedBy", listedBy);
      }
      body.append("city", selected.city);
      body.append("state", selected.state);
      body.append("area", selected.area);
      if (selected.latitude != null) body.append("latitude", String(selected.latitude));
      if (selected.longitude != null) body.append("longitude", String(selected.longitude));
      for (const photo of photos) body.append("photos", photo);

      const path = isHotel ? "/hotels/listings" : `/vendor-listings/${config.id}`;
      const res = await authFetch(path, {
        method: "POST",
        token,
        body,
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string | string[];
        data?: { title?: string; name?: string };
      };
      if (!res.ok) {
        const message = Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Could not save listing";
        throw new ApiError(message, res.status);
      }
      setSavedName(
        json.data?.title ||
          json.data?.name ||
          values.hotelName ||
          values.businessName ||
          values.operatorName ||
          values.companyName ||
          values.kitchenName ||
          spec?.title ||
          config.title,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?next=/vendors/services/${config.id}`);
        return;
      }
      setError(err instanceof Error ? err.message : "Could not save listing");
    } finally {
      setSaving(false);
    }
  }

  if (savedName) {
    return (
      <SuccessCard
        name={savedName}
        location={place ? placeLabel(place) : ""}
        onPosts={() => router.push("/vendors/posts")}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:min-h-[70vh] md:bg-[#f6f8fb] md:pb-10">
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-[280px_minmax(0,1fr)] md:gap-10 md:px-2 md:py-10">
        <aside className="hidden md:block">
          <div className="sticky top-28 rounded-3xl bg-white p-6 ring-1 ring-[var(--border)]">
            <CategoryArt id={config.id} size={72} className="h-[4.5rem] w-[4.5rem] rounded-2xl object-cover" />
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Place Register</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{spec?.title ?? config.title}</h1>
            <ol className="mt-8 space-y-3">
              {STEPS.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      step === item.id
                        ? "bg-[var(--primary)] text-white"
                        : step > item.id
                          ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "bg-[#eef2f7] text-[var(--text-muted)]",
                    )}
                  >
                    {item.id}
                  </span>
                  <span className={cn("text-sm font-medium", step === item.id ? "text-[var(--text)]" : "text-[var(--text-muted)]")}>{item.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <div className="flex min-h-[70vh] flex-col md:min-h-0">
          <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[var(--border)] bg-white/95 py-2.5 pl-3 pr-3 backdrop-blur md:static md:mb-5 md:rounded-2xl md:border md:px-4">
            <button
              type="button"
              onClick={() => (step === 1 ? router.push("/vendors/services") : setStep((current) => current - 1))}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--background-blue)]"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <CategoryArt id={config.id} size={36} className="h-9 w-9 rounded-xl object-cover md:hidden" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                {spec?.title ?? config.title} · Step {step} of 3
              </p>
              <h2 className="truncate text-[16px] font-semibold tracking-tight md:text-lg">{STEPS[step - 1].label}</h2>
            </div>
          </header>

          <div className="h-1 bg-[#e8eef4] md:hidden">
            <div className="h-full bg-[var(--primary)] transition-all" style={{ width: `${(step / 3) * 100}%` }} />
          </div>

          <div className="flex-1 px-4 py-5 md:rounded-3xl md:bg-white md:px-8 md:py-8 md:ring-1 md:ring-[var(--border)]">
            {step === 1 ? (
              <DetailsStep
                config={config}
                spec={spec}
                isHotel={isHotel}
                values={values}
                priceUnit={priceUnit}
                onField={setField}
                onPriceUnit={setPriceUnit}
              />
            ) : null}
            {step === 2 ? (
              <PhotosStep
                photos={photos}
                previews={previews}
                onAdd={(files) => setPhotos((current) => [...current, ...Array.from(files ?? [])].slice(0, 8))}
                onRemove={(file) => setPhotos((current) => current.filter((item) => item !== file))}
              />
            ) : null}
            {step === 3 ? (
              <LocationStep
                selected={place}
                locating={saving}
                onSelect={(next) => {
                  setPlace(next);
                  setError("");
                }}
              />
            ) : null}
            {error ? <p className="mt-4 text-sm text-[var(--error)]">{error}</p> : null}
          </div>

          <div className="sticky bottom-0 border-t border-[var(--border)] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mt-5 md:rounded-2xl md:border md:px-0 md:py-0 md:pb-0">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => (step === 1 ? nextFromDetails() : setStep(3))}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white hover:bg-[var(--primary-hover)] md:h-12"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                disabled={saving || !place}
                onClick={() => {
                  if (!place) {
                    setError("Choose a city or use current location, then save.");
                    return;
                  }
                  void submit(place);
                }}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-60 md:h-12"
              >
                {saving ? "Saving…" : "Save listing"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailsStep({
  config,
  spec,
  isHotel,
  values,
  priceUnit,
  onField,
  onPriceUnit,
}: {
  config: VendorFormConfig;
  spec?: VendorServiceSpec;
  isHotel: boolean;
  values: Record<string, string>;
  priceUnit: string;
  onField: (name: string, value: string) => void;
  onPriceUnit: (value: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xl font-semibold tracking-tight">Service details</h3>
      <p className="mt-1 text-sm text-[var(--text-muted)]">These stay on your listing. Customers see them after admin accepts.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {isHotel ? (
          <>
            <Field label="Hotel name" required className="sm:col-span-2">
              <input className={inputClass} value={values.hotelName ?? ""} onChange={(e) => onField("hotelName", e.target.value)} placeholder="Rajahmundry Grand Inn" />
            </Field>
            <Field label="Mobile number" required>
              <input className={inputClass} inputMode="numeric" value={values.mobileNumber ?? ""} onChange={(e) => onField("mobileNumber", e.target.value)} placeholder="9876543210" />
            </Field>
            <Field label="Hotel type" required>
              <select className={inputClass} value={values.hotelType ?? ""} onChange={(e) => onField("hotelType", e.target.value)}>
                <option value="">Select</option>
                {HOTEL_TYPES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Room type" required>
              <select className={inputClass} value={values.roomType ?? ""} onChange={(e) => onField("roomType", e.target.value)}>
                <option value="">Select</option>
                {ROOM_TYPES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </Field>
            <PriceField value={values.price ?? ""} unit={priceUnit} units={[{ value: "PER_ROOM", label: "Per Room" }, { value: "PER_DAY", label: "Per Day" }]} onValue={(v) => onField("price", v)} onUnit={onPriceUnit} />
            <Field label="Entry price">
              <input className={inputClass} type="number" value={values.entryPrice ?? ""} onChange={(e) => onField("entryPrice", e.target.value)} placeholder="Optional" />
            </Field>
          </>
        ) : spec ? (
          spec.fields.filter((field) => field.kind !== "photos").map((field) => (
            <SpecField key={field.name} field={field} values={values} priceUnit={priceUnit} onField={onField} onPriceUnit={onPriceUnit} />
          ))
        ) : (
          config.sections.flatMap((section) =>
            section.fields.map((field) => (
              <Field key={field.name} label={field.label} required={field.required} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
                {field.type === "select" ? (
                  <select className={inputClass} value={values[field.name] ?? ""} onChange={(e) => onField(field.name, e.target.value)}>
                    <option value="">Select</option>
                    {field.options?.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea className={`${inputClass} min-h-28`} value={values[field.name] ?? ""} onChange={(e) => onField(field.name, e.target.value)} placeholder={field.placeholder} />
                ) : (
                  <input className={inputClass} value={values[field.name] ?? ""} onChange={(e) => onField(field.name, e.target.value)} placeholder={field.placeholder} />
                )}
              </Field>
            )),
          )
        )}
      </div>
    </div>
  );
}

function SpecField({
  field,
  values,
  priceUnit,
  onField,
  onPriceUnit,
}: {
  field: VendorServiceField;
  values: Record<string, string>;
  priceUnit: string;
  onField: (name: string, value: string) => void;
  onPriceUnit: (value: string) => void;
}) {
  if (field.kind === "price") {
    return <PriceField value={values.price ?? ""} unit={priceUnit} units={field.units} onValue={(v) => onField("price", v)} onUnit={onPriceUnit} />;
  }
  const wide = "wide" in field && Boolean(field.wide);
  return (
    <Field label={field.label} required={"required" in field ? field.required : false} className={wide ? "sm:col-span-2" : undefined}>
      {field.kind === "select" ? (
        <select className={inputClass} value={values[field.name] ?? ""} onChange={(e) => onField(field.name, e.target.value)}>
          <option value="">Select</option>
          {field.options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : field.kind === "textarea" ? (
        <textarea
          className={`${inputClass} min-h-28`}
          value={values[field.name] ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onField(field.name, e.target.value)}
        />
      ) : (
        <input
          className={inputClass}
          type={field.kind === "number" ? "number" : "text"}
          inputMode={field.kind === "tel" || field.kind === "number" ? "numeric" : undefined}
          value={values[field.name] ?? ""}
          placeholder={"placeholder" in field ? field.placeholder : undefined}
          onChange={(e) => onField(field.name, e.target.value)}
        />
      )}
    </Field>
  );
}

function PriceField({
  value,
  unit,
  units,
  onValue,
  onUnit,
}: {
  value: string;
  unit: string;
  units: { value: string; label: string }[];
  onValue: (value: string) => void;
  onUnit: (value: string) => void;
}) {
  return (
    <label className="sm:col-span-2">
      <span className="text-sm font-medium">Price<span className="text-[var(--error)]"> *</span></span>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <input className={`${inputClass} mt-0`} type="number" min="1" value={value} onChange={(e) => onValue(e.target.value)} placeholder="499" />
        <div className="flex shrink-0 flex-wrap rounded-xl border border-[var(--border)] bg-[#f8fafc] p-1">
          {units.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onUnit(item.value)}
              className={cn("rounded-lg px-3 py-2 text-xs font-semibold", unit === item.value ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)]")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </label>
  );
}

function PhotosStep({
  photos,
  previews,
  onAdd,
  onRemove,
}: {
  photos: File[];
  previews: { file: File; url: string }[];
  onAdd: (files: FileList | null) => void;
  onRemove: (file: File) => void;
}) {
  return (
    <div>
      <h3 className="text-xl font-semibold tracking-tight">Add photos</h3>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Clear photos help customers trust the listing. You can add up to 8.</p>
      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[#f8fafc] px-4 py-10 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-[var(--border)]">
          <Camera className="h-5 w-5 text-[var(--primary)]" />
        </span>
        <span className="mt-3 text-sm font-semibold">Upload from camera or gallery</span>
        <span className="mt-1 text-xs text-[var(--text-muted)]">{photos.length}/8 selected</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => onAdd(event.target.files)} />
      </label>
      {previews.length ? (
        <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map((preview) => (
            <li key={preview.url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.url} alt="" className="h-28 w-full rounded-2xl object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => onRemove(preview.file)}
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <ImagePlus className="h-4 w-4" /> You can continue without photos, but listings with photos get accepted faster.
        </p>
      )}
    </div>
  );
}

function LocationStep({
  selected,
  locating,
  onSelect,
}: {
  selected: Place | null;
  locating: boolean;
  onSelect: (place: Place) => void;
}) {
  const [query, setQuery] = useState("");
  const [finding, setFinding] = useState(false);
  const [current, setCurrent] = useState<Place | null>(null);
  const results = searchPlaces(query);

  async function detectCurrentLocation() {
    setFinding(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true });
      });
      const place = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (place) {
        setCurrent(place);
        onSelect(place);
      }
    } catch {
      setCurrent(null);
    } finally {
      setFinding(false);
    }
  }

  return (
    <div>
      <h3 className="text-xl font-semibold tracking-tight">Choose location</h3>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Pick a city or use GPS, then tap Save listing. That is what creates your pending post.
      </p>
      <input
        className={`${inputClass} mt-5`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search city or area"
      />
      {results.length ? (
        <ul className="mt-3 divide-y divide-[var(--border)] rounded-2xl ring-1 ring-[var(--border)]">
          {results.map((place) => (
            <li key={`${place.city}-${place.state}`}>
              <button type="button" onClick={() => onSelect(place)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f8fafc]">
                <MapPin className="h-4 w-4 text-[var(--text-muted)]" />
                <span>
                  <span className="block text-sm font-medium">{place.city}</span>
                  <span className="text-xs text-[var(--text-muted)]">{place.state}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => (current ? onSelect(current) : void detectCurrentLocation())}
            disabled={finding || locating}
            className="flex w-full items-center gap-3 rounded-2xl bg-[#eff6ff] px-4 py-4 text-left text-[#1d4ed8] disabled:opacity-60"
          >
            <LocateFixed className="h-5 w-5" />
            <span>
              <span className="block text-sm font-semibold">Use current location</span>
              <span className="text-xs text-[#3b82f6]">{finding || locating ? "Saving listing…" : current?.label ?? "Find your area"}</span>
            </span>
          </button>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">Popular locations</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(CITIES_BY_STATE).slice(0, 6).flatMap(([state, cities]) =>
              cities.slice(0, 2).map((city) => (
                <button
                  key={`${city}-${state}`}
                  type="button"
                  onClick={() => onSelect(makeCityPlace(city, state))}
                  className="rounded-xl bg-[#f8fafc] px-3 py-3 text-left text-sm font-medium ring-1 ring-[var(--border)] hover:bg-white"
                >
                  {city}
                  <span className="mt-0.5 block text-xs font-normal text-[var(--text-muted)]">{state}</span>
                </button>
              )),
            )}
          </div>
        </div>
      )}
      {selected ? <p className="mt-4 text-sm text-[var(--text-muted)]">Selected: {placeLabel(selected)}</p> : null}
    </div>
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
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="text-sm font-medium">
        {label}
        {required ? <span className="text-[var(--error)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function AuthGate({ title, next }: { title: string; next: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-[var(--text-muted)]">Your listing is saved to this account and stays pending until an admin accepts it.</p>
      <Link href={`/login?next=${encodeURIComponent(next)}`} className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white">
        Sign in to continue
      </Link>
    </div>
  );
}

function SuccessCard({ name, location, onPosts }: { name: string; location: string; onPosts: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 md:py-16">
      <div className="rounded-[1.75rem] bg-white px-6 py-10 text-center ring-1 ring-[var(--border)] md:px-10 md:shadow-[var(--shadow-soft)]">
        <CheckCircle2 className="mx-auto h-14 w-14 text-[var(--primary)]" />
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Pending review</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{name}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          Saved{location ? ` in ${location}` : ""}. It appears in My Services as pending. Customers within 10 km see it after admin accepts.
        </p>
        <div className="mt-7 grid gap-2">
          <button type="button" onClick={onPosts} className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
            View My Services
          </button>
          <Link href="/vendors/services" className="inline-flex h-12 items-center justify-center rounded-full text-sm font-medium text-[var(--primary)] ring-1 ring-[var(--border)]">
            List another service
          </Link>
        </div>
      </div>
    </div>
  );
}
