"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ImagePlus, Plus, X } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { ApiError, authFetch } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { useDraftFile, useDraftState } from "./use-vendor-form-draft";
import { WizardFooter, WizardStepBar } from "./wizard-step-bar";
import {
  PACKERS_SERVICE_TYPES,
  emptyPackersLocation,
  formatPackersLocations,
  packersDistricts,
  packersStates,
  type PackersLocation,
} from "./packers-movers-data";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]";

const STEPS = [
  { id: 1, label: "Service & Location" },
  { id: 2, label: "Vendor Details" },
] as const;

export function PackersMoversRegistrationForm() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const formId = "packers-movers";

  const [step, setStep] = useDraftState(formId, "step", 1);
  const [services, setServices] = useDraftState(formId, "services", [] as string[]);
  const [customService, setCustomService] = useDraftState(formId, "customService", "");
  const [locations, setLocations] = useDraftState(formId, "locations", [emptyPackersLocation()] as PackersLocation[]);
  const [businessName, setBusinessName] = useDraftState(formId, "businessName", "");
  const [contactName, setContactName] = useDraftState(formId, "contactName", "");
  const [mobile, setMobile] = useDraftState(formId, "mobile", "");
  const [address, setAddress] = useDraftState(formId, "address", "");
  const [logo, setLogo] = useDraftFile(formId, "logo");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState("");

  const serviceLabels = services.map((id) => {
    if (id === "other") return customService.trim() || "Other";
    return PACKERS_SERVICE_TYPES.find((item) => item.id === id)?.name ?? id;
  });

  useEffect(() => {
    if (!user) return;
    setContactName((current) => current || user.fullName || "");
    setMobile((current) => current || (user.phone || "").replace(/\D/g, "").slice(-10));
  }, [user]);

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to register Packers & Movers</h1>
        <Link
          href={`/login?next=${encodeURIComponent("/vendors/services/packers-movers")}`}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  function toggleService(id: string) {
    setServices((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function patchLocation(index: number, patch: Partial<PackersLocation>) {
    setLocations((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function toggleDistrict(index: number, district: string) {
    setLocations((current) =>
      current.map((item, i) => {
        if (i !== index) return item;
        const next = item.districts.includes(district) ? item.districts.filter((name) => name !== district) : [...item.districts, district];
        return { ...item, districts: next };
      }),
    );
  }

  function validateStep(at = step) {
    if (at === 1) {
      if (!services.length) return "Select at least one service type.";
      if (services.includes("other") && !customService.trim()) return "Enter the other service type.";
      const valid = locations.filter((item) => item.state && item.districts.length);
      if (!valid.length) return "Select a state and at least one district.";
      if (locations.some((item) => item.state && !item.districts.length)) return "Select districts for each added location.";
      return "";
    }
    if (!businessName.trim()) return "Enter the business / vendor name.";
    if (!contactName.trim()) return "Enter the contact person name.";
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
    if (!address.trim()) return "Enter the business address.";
    if (!logo) return "Upload a business logo / profile photo.";
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

  function next() {
    goToStep(2);
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
      const validLocations = locations.filter((item) => item.state && item.districts.length);
      const coverage = formatPackersLocations(validLocations);
      const body = new FormData();
      body.append("companyName", businessName.trim());
      body.append("businessName", businessName.trim());
      body.append("ownerName", contactName.trim());
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("address", address.trim());
      body.append("location", coverage || address.trim());
      body.append("serviceType", serviceLabels.join(", "));
      body.append("serviceLocations", JSON.stringify(validLocations));
      body.append("state", validLocations[0]?.state || "");
      body.append("district", validLocations.flatMap((item) => item.districts).join(", "));
      body.append("coverage", coverage);
      if (logo) body.append("photos", logo);

      const res = await authFetch("/vendor-listings/packers-movers", { method: "POST", token, body });
      const json = (await res.json().catch(() => ({}))) as { message?: string | string[]; data?: { title?: string } };
      if (!res.ok) {
        const text = Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Could not save listing";
        throw new ApiError(text, res.status);
      }
      setSavedName(json.data?.title || businessName.trim());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login?next=/vendors/services/packers-movers");
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
              Packers & Movers · Step {step} of 2
            </p>
            <h1 className="truncate text-[16px] font-semibold tracking-tight">{STEPS[step - 1].label}</h1>
          </div>
        </header>

        <WizardStepBar steps={STEPS} step={step} onSelect={goToStep} />

        <div className="px-4 py-5 md:rounded-3xl md:bg-white md:px-8 md:py-8 md:ring-1 md:ring-[var(--border)]">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium">
                  Service Type <span className="text-[var(--error)]">*</span>
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {PACKERS_SERVICE_TYPES.map((item) => {
                    const checked = services.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-3 py-3",
                          checked ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-slate-200 bg-[#f8fafc]",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleService(item.id)}
                          className="h-4 w-4 accent-[var(--primary)]"
                        />
                        <span className="text-lg" aria-hidden>
                          {item.emoji}
                        </span>
                        <span className="text-sm font-medium">{item.name}</span>
                      </label>
                    );
                  })}
                </div>
                {services.includes("other") ? (
                  <input
                    className={`${inputClass} mt-3`}
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    placeholder="Enter other service type"
                  />
                ) : null}
              </div>

              <div>
                <p className="text-sm font-medium">
                  Service Location <span className="text-[var(--error)]">*</span>
                </p>
                <div className="mt-3 space-y-4">
                  {locations.map((location, index) => {
                    const districts = packersDistricts(location.state);
                    return (
                      <div key={`${location.state}-${index}`} className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location {index + 1}</p>
                          {locations.length > 1 ? (
                            <button type="button" onClick={() => setLocations((current) => current.filter((_, i) => i !== index))} className="text-xs font-semibold text-[var(--error)]">
                              Remove
                            </button>
                          ) : null}
                        </div>
                        <label className="mt-2 block">
                          <span className="text-sm font-medium">Select State</span>
                          <select
                            className={inputClass}
                            value={location.state}
                            onChange={(e) => patchLocation(index, { state: e.target.value, districts: [] })}
                          >
                            <option value="">Select state</option>
                            {packersStates().map((state) => (
                              <option key={state}>{state}</option>
                            ))}
                          </select>
                        </label>
                        {location.state ? (
                          <div className="mt-3">
                            <p className="text-sm font-medium">Districts</p>
                            <div className="mt-2 grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                              {districts.map((district) => {
                                const checked = location.districts.includes(district);
                                return (
                                  <label key={district} className={cn("flex items-center gap-2 rounded-lg bg-white px-2 py-2 text-sm ring-1", checked ? "ring-[var(--primary)]" : "ring-slate-200")}>
                                    <input type="checkbox" checked={checked} onChange={() => toggleDistrict(index, district)} className="h-3.5 w-3.5 accent-[var(--primary)]" />
                                    <span className="leading-tight">{district}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setLocations((current) => [...current, emptyPackersLocation()])}
                  className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--primary)] ring-1 ring-[var(--border)]"
                >
                  <Plus className="h-4 w-4" />
                  Add Location
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business / Vendor Name" required className="sm:col-span-2">
                <input className={inputClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="SafeShift Hyd" />
              </Field>
              <Field label="Contact Person Name" required>
                <input className={inputClass} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ravi Kumar" />
              </Field>
              <Field label="Mobile Number" required>
                <input className={inputClass} inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" />
              </Field>
              <Field label="Business Address" required className="sm:col-span-2">
                <textarea className={`${inputClass} min-h-28 py-3`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Shop / warehouse, street, area, city" />
              </Field>
              <FileField label="Business Logo / Profile Photo" file={logo} onFile={setLogo} className="sm:col-span-2" />
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
          onNext={next}
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
