"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ImagePlus, MapPin, Minus, Plus, X } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { ApiError, authFetch } from "@/shared/lib/api";
import { geocodeVendorAddress } from "./detect-exact-location";
import { VendorLocationPopup } from "./vendor-location-popup";
import { useDraftFile, useDraftFiles, useDraftState } from "./use-vendor-form-draft";
import { WizardFooter, WizardStepBar } from "./wizard-step-bar";
import {
  defaultCloudKitchenFoods,
  emptyCloudKitchenFood,
  filledCloudKitchenFoods,
  type CloudKitchenFoodRow,
} from "./cloud-kitchen-form-data";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]";

const STEPS = [
  { id: 1, label: "Food & Location" },
  { id: 2, label: "Vendor Details" },
] as const;

export function CloudKitchenRegistrationForm() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const formId = "cloud-kitchen";

  const [step, setStep] = useDraftState(formId, "step", 1);
  const [rows, setRows] = useDraftState(formId, "foodRows", defaultCloudKitchenFoods() as CloudKitchenFoodRow[]);
  const [address, setAddress] = useDraftState(formId, "address", "");
  const [lat, setLat] = useDraftState<number | null>(formId, "lat", null);
  const [lng, setLng] = useDraftState<number | null>(formId, "lng", null);
  const [district, setDistrict] = useDraftState(formId, "district", "");
  const [kitchenName, setKitchenName] = useDraftState(formId, "kitchenName", "");
  const [ownerName, setOwnerName] = useDraftState(formId, "ownerName", "");
  const [mobile, setMobile] = useDraftState(formId, "mobile", "");
  const [logo, setLogo] = useDraftFile(formId, "logo");
  const [photos, setPhotos] = useDraftFiles(formId, "kitchenPhotos");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState("");

  const filled = filledCloudKitchenFoods(rows);
  const photoUrls = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);

  useEffect(() => {
    return () => photoUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [photoUrls]);

  useEffect(() => {
    if (!user) return;
    setOwnerName((current) => current || user.fullName || "");
    setMobile((current) => current || (user.phone || "").replace(/\D/g, "").slice(-10));
  }, [user]);

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to register Cloud Kitchen</h1>
        <Link
          href={`/login?next=${encodeURIComponent("/vendors/services/cloud-kitchen")}`}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  function patchRow(index: number, patch: Partial<CloudKitchenFoodRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setError("");
  }

  function addRow() {
    setRows((current) => [...current, emptyCloudKitchenFood()]);
    setError("");
  }

  function removeRow(index: number) {
    setRows((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
    setError("");
  }

  function validateStep(at = step) {
    if (at === 1) {
      if (!filled.length) return "Add at least one food type with price.";
      for (const row of rows) {
        if (row.name.trim() && !row.amount.trim()) return `Enter price for ${row.name.trim()}.`;
        if (!row.name.trim() && row.amount.trim()) return "Enter food type.";
      }
      if (!address.trim()) return "Add kitchen address or use current location.";
      return "";
    }
    if (!kitchenName.trim()) return "Enter the cloud kitchen name.";
    if (!ownerName.trim()) return "Enter the owner / contact person name.";
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
    if (!logo) return "Upload a kitchen logo / profile photo.";
    return "";
  }

  function goToStep(nextStep: number) {
    if (nextStep === step) return;
    if (nextStep > step) {
      const message = validateStep(step);
      if (message) {
        setError(message);
        return;
      }
    }
    setError("");
    setStep(nextStep);
  }

  async function submit() {
    const message = validateStep();
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      const cuisine = filled.map((row) => row.name.trim()).join(", ");
      body.append("kitchenName", kitchenName.trim());
      body.append("ownerName", ownerName.trim());
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("cuisineType", cuisine);
      body.append("kitchenType", "Cloud kitchen");
      body.append("serviceType", cuisine);
      body.append("foodTypes", JSON.stringify(filled));
      body.append("servicesOffered", filled.map((row) => `${row.name.trim()} ₹${row.amount}`).join("; "));
      body.append("price", filled[0].amount);
      body.append("priceUnit", "PER_ORDER");
      body.append("address", address.trim());
      body.append("location", address.trim());
      body.append("district", district);
      body.append("city", district);
      body.append("area", address.trim());
      let pinLat = lat;
      let pinLng = lng;
      if (pinLat == null || pinLng == null) {
        const pin = await geocodeVendorAddress(address.trim());
        if (pin) {
          pinLat = pin.lat;
          pinLng = pin.lng;
        }
      }
      if (pinLat != null) body.append("latitude", String(pinLat));
      if (pinLng != null) body.append("longitude", String(pinLng));
      if (logo) body.append("photos", logo);
      for (const photo of photos.slice(0, logo ? 39 : 40)) body.append("photos", photo);

      const res = await authFetch("/vendor-listings/cloud-kitchen", { method: "POST", token, body });
      const json = (await res.json().catch(() => ({}))) as { message?: string | string[]; data?: { title?: string } };
      if (!res.ok) {
        const text = Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Could not save listing";
        throw new ApiError(text, res.status);
      }
      setSavedName(json.data?.title || kitchenName.trim());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login?next=/vendors/services/cloud-kitchen");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not save listing");
    } finally {
      setSaving(false);
    }
  }

  if (savedName) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-[1.75rem] bg-white px-6 py-10 text-center ring-1 ring-[var(--border)]">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[var(--primary)]" />
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Registered</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{savedName}</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">Listing is pending admin review. Customers see it after it is accepted.</p>
          <div className="mt-7 grid gap-2">
            <Link href="/vendors/posts" className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
              View My Services
            </Link>
            <Link href="/vendors/services" className="inline-flex h-12 items-center justify-center rounded-full text-sm font-medium text-[var(--primary)] ring-1 ring-[var(--border)]">
              List another service
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:bg-[#f6f8fb] md:pb-10">
      <div className="mx-auto max-w-2xl md:px-2 md:py-8">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[var(--border)] bg-white/95 px-3 py-2.5 backdrop-blur md:static md:mb-5 md:rounded-2xl md:border">
          <button
            type="button"
            onClick={() => (step === 1 ? router.push("/vendors/services") : setStep(1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">Cloud Kitchen · Step {step} of 2</p>
            <h1 className="truncate text-[16px] font-semibold tracking-tight">{STEPS[step - 1].label}</h1>
          </div>
        </header>

        <WizardStepBar steps={STEPS} step={step} onSelect={goToStep} />

        <div className="px-4 py-5 md:rounded-3xl md:bg-white md:px-8 md:py-8 md:ring-1 md:ring-[var(--border)]">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium">
                  Food Type + Price <span className="text-[var(--error)]">*</span>
                </p>
                <div className="mt-3 space-y-2.5">
                  <div className="grid grid-cols-[minmax(0,1fr)_9rem_auto] items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">Food type</p>
                    <p className="text-sm font-medium text-slate-800">Price</p>
                    <span />
                  </div>
                  {rows.map((row, index) => (
                    <div key={index} className="grid grid-cols-[minmax(0,1fr)_9rem_auto] items-center gap-2">
                      <input
                        value={row.name}
                        onChange={(e) => patchRow(index, { name: e.target.value })}
                        placeholder={index === 0 ? "🍱 Meals" : index === 1 ? "🍔 Fast Food" : "Food type"}
                        className="h-11 min-w-0 rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]"
                      />
                      <label className="flex h-11 min-w-0 items-center rounded-xl border border-slate-200 bg-[#f8fafc] px-3 focus-within:border-[var(--primary)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--primary-soft)]">
                        <span className="shrink-0 text-sm text-slate-500">₹</span>
                        <input
                          value={row.amount}
                          onChange={(e) => patchRow(index, { amount: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                          placeholder="___"
                          inputMode="numeric"
                          className="h-full min-w-0 flex-1 bg-transparent pl-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </label>
                      <div className="flex w-[5.75rem] shrink-0 justify-end gap-1.5">
                        {rows.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
                            aria-label="Remove food type"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        ) : null}
                        {index === rows.length - 1 ? (
                          <button
                            type="button"
                            onClick={addRow}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)] text-white"
                            aria-label="Add food type"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addRow}
                  className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--primary)] ring-1 ring-[var(--border)]"
                >
                  <Plus className="h-4 w-4" />
                  Add Food Type + Price
                </button>
              </div>

              <div>
                <p className="text-sm font-medium">
                  Service Location <span className="text-[var(--error)]">*</span>
                </p>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="mt-1.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-[#f8fafc] text-sm font-semibold text-slate-800"
                >
                  <MapPin className="h-4 w-4 text-[var(--primary)]" />
                  {address.trim() ? "Change location" : "Use Current Location"}
                </button>
                {pickerOpen ? (
                  <VendorLocationPopup
                    initialLabel={address}
                    initialLat={lat}
                    initialLng={lng}
                    pinLabel="Kitchen location"
                    onClose={() => setPickerOpen(false)}
                    onConfirm={(found) => {
                      setAddress(found.label);
                      setLat(found.lat);
                      setLng(found.lng);
                      if (found.districtName) setDistrict(found.districtName);
                      setPickerOpen(false);
                      setError("");
                    }}
                  />
                ) : null}
                <label className="mt-4 block">
                  <span className="text-sm font-medium">
                    Kitchen Address <span className="text-[var(--error)]">*</span>
                  </span>
                  <textarea
                    className={`${inputClass} min-h-28 py-3`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Kitchen, street, area, city"
                  />
                </label>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cloud Kitchen Name" required className="sm:col-span-2">
                <input className={inputClass} value={kitchenName} onChange={(e) => setKitchenName(e.target.value)} placeholder="Spice Cloud" />
              </Field>
              <Field label="Owner / Contact Person Name" required>
                <input className={inputClass} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Ravi Kumar" />
              </Field>
              <Field label="Mobile Number" required>
                <input className={inputClass} inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" />
              </Field>
              <FileField label="Kitchen Logo / Profile Photo" file={logo} onFile={setLogo} className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <p className="text-sm font-medium">Food / Kitchen Photos</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {photoUrls.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                      className="h-24 w-24 overflow-hidden rounded-xl bg-slate-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#c5ced8] text-slate-500">
                    <Plus className="h-5 w-5" />
                    <span className="mt-1 text-[11px] font-medium">Add photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const next = Array.from(e.target.files ?? []);
                        setPhotos((current) => [...current, ...next]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-[var(--error)]">{error}</p> : null}
        </div>

        <WizardFooter
          step={step}
          lastStep={2}
          saving={saving}
          submitLabel="Register"
          onBack={() => goToStep(1)}
          onNext={() => goToStep(2)}
          onSubmit={() => void submit()}
        />
      </div>
    </div>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
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

function FileField({
  label,
  file,
  onFile,
  className,
}: {
  label: string;
  file: File | null;
  onFile: (file: File | null) => void;
  className?: string;
}) {
  const preview = useMemo(() => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <div className={className}>
      <span className="text-sm font-medium">
        {label}
        <span className="text-[var(--error)]"> *</span>
      </span>
      {file ? (
        <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[11px] font-semibold text-slate-500">FILE</span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
          <button type="button" aria-label={`Remove ${label}`} onClick={() => onFile(null)} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[#f8fafc] px-3 py-5 text-sm text-slate-500">
          <ImagePlus className="mb-1.5 h-5 w-5" />
          Upload {label.toLowerCase()}
          <input type="file" accept="image/*" className="hidden" onChange={(event) => onFile(event.target.files?.[0] ?? null)} />
        </label>
      )}
    </div>
  );
}
