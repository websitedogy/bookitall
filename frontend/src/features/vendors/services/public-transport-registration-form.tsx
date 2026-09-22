"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ImagePlus, X } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { ApiError, authFetch } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { useDraftFile, useDraftState } from "./use-vendor-form-draft";
import { WizardFooter, WizardStepBar } from "./wizard-step-bar";
import {
  DEFAULT_SEATS,
  MANUFACTURING_YEARS,
  PUBLIC_TRANSPORT_SERVICES,
  type PublicTransportTypeId,
} from "./public-transport-data";
import { PublicTransportIcon } from "./public-transport-icons";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]";

const STEPS = [
  { id: 1, label: "Vehicle Details" },
  { id: 2, label: "Driver Details" },
  { id: 3, label: "Documents" },
] as const;

export function PublicTransportRegistrationForm({
  vehicleId,
  vehicleName,
}: {
  vehicleId: PublicTransportTypeId;
  vehicleName: string;
}) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const formId = `public-transport-${vehicleId}`;

  const [step, setStep] = useDraftState(formId, "step", 1);
  const [vehicleNumber, setVehicleNumber] = useDraftState(formId, "vehicleNumber", "");
  const [vehicleMake, setVehicleMake] = useDraftState(formId, "vehicleMake", "");
  const [vehicleModel, setVehicleModel] = useDraftState(formId, "vehicleModel", "");
  const [year, setYear] = useDraftState(formId, "year", "");
  const [seats, setSeats] = useDraftState(formId, "seats", DEFAULT_SEATS[vehicleId]);
  const [serviceType, setServiceType] = useDraftState(formId, "serviceType", "");
  const [price, setPrice] = useDraftState(formId, "price", "");
  const [driverName, setDriverName] = useDraftState(formId, "driverName", "");
  const [mobile, setMobile] = useDraftState(formId, "mobile", "");
  const [dob, setDob] = useDraftState(formId, "dob", "");
  const [address, setAddress] = useDraftState(formId, "address", "");
  const [licenceNumber, setLicenceNumber] = useDraftState(formId, "licenceNumber", "");
  const [extra, setExtra] = useDraftState(formId, "extra", "");
  const [licence, setLicence] = useDraftFile(formId, "licence");
  const [rc, setRc] = useDraftFile(formId, "rc");
  const [insurance, setInsurance] = useDraftFile(formId, "insurance");
  const [puc, setPuc] = useDraftFile(formId, "puc");
  const [profile, setProfile] = useDraftFile(formId, "profile");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState("");

  useEffect(() => {
    if (!user) return;
    setDriverName((current) => current || user.fullName || "");
    setMobile((current) => current || (user.phone || "").replace(/\D/g, "").slice(-10));
  }, [user]);

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to register {vehicleName}</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">Same form for Auto, Car, Mini Bus, Bus and Van.</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/vendors/services/public-transport?type=${vehicleId}`)}`}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  function validateStep(at = step) {
    if (at === 1) {
      if (!vehicleNumber.trim()) return "Enter the vehicle registration number.";
      if (!vehicleMake.trim()) return "Enter the vehicle make.";
      if (!vehicleModel.trim()) return "Enter the vehicle model.";
      if (!year) return "Choose the manufacturing year.";
      if (!seats || Number(seats) <= 0) return "Enter seating capacity.";
      if (!serviceType) return "Choose Local or Outstation.";
      if (!price || Number(price) <= 0) return "Enter a starting price.";
      return "";
    }
    if (at === 2) {
      if (!driverName.trim()) return "Enter the driver full name.";
      if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
      if (!dob) return "Enter date of birth.";
      if (!address.trim()) return "Enter the address.";
      if (!licenceNumber.trim()) return "Enter the driving licence number.";
      return "";
    }
    if (!licence) return "Upload the driving licence.";
    if (!rc) return "Upload the RC.";
    if (!insurance) return "Upload the insurance.";
    if (!puc) return "Upload the PUC.";
    if (!profile) return "Upload a profile photo.";
    return "";
  }

  function goToStep(nextStep: number) {
    if (nextStep === step) return;
    if (nextStep > step) {
      for (let at = step; at < nextStep; at += 1) {
        const message = validateStep(at);
        if (message) {
          setError(message);
          return;
        }
      }
    }
    setError("");
    setStep(nextStep);
  }

  function next() {
    goToStep(Math.min(3, step + 1));
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
      body.append("vehicleType", vehicleName);
      body.append("vehicleNumber", vehicleNumber.trim().toUpperCase());
      body.append("vehicleMake", vehicleMake.trim());
      body.append("vehicleModel", vehicleModel.trim());
      body.append("manufacturingYear", year);
      body.append("seats", seats);
      body.append("serviceType", serviceType);
      body.append("price", price);
      body.append("priceUnit", "PER_TRIP");
      body.append("driverName", driverName.trim());
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("dateOfBirth", dob);
      body.append("address", address.trim());
      body.append("location", address.trim());
      body.append("drivingLicenceNumber", licenceNumber.trim());
      if (extra.trim()) body.append("description", extra.trim());
      if (licence) body.append("license", licence);
      if (rc) body.append("rc", rc);
      if (insurance) body.append("insurance", insurance);
      if (puc) body.append("puc", puc);
      if (profile) body.append("photos", profile);

      const res = await authFetch("/vendor-listings/public-transport", { method: "POST", token, body });
      const json = (await res.json().catch(() => ({}))) as { message?: string | string[]; data?: { title?: string } };
      if (!res.ok) {
        const text = Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Could not save listing";
        throw new ApiError(text, res.status);
      }
      setSavedName(json.data?.title || driverName.trim());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?next=/vendors/services/public-transport?type=${vehicleId}`);
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
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Pending review</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{savedName}</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {vehicleName} · {serviceType}. Customers see it after admin accepts.
          </p>
          <div className="mt-7 grid gap-2">
            <Link href="/vendors/posts" className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
              View My Services
            </Link>
            <Link href="/vendors/services/public-transport" className="inline-flex h-12 items-center justify-center rounded-full text-sm font-medium text-[var(--primary)] ring-1 ring-[var(--border)]">
              Register another vehicle
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
            onClick={() => (step === 1 ? router.push("/vendors/services/public-transport") : setStep((current) => current - 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="h-9 w-9 overflow-hidden rounded-xl">
            <PublicTransportIcon id={vehicleId} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
              {vehicleName} · Step {step} of 3
            </p>
            <h1 className="truncate text-[16px] font-semibold tracking-tight">{STEPS[step - 1].label}</h1>
          </div>
        </header>

        <WizardStepBar steps={STEPS} step={step} onSelect={goToStep} />

        <div className="px-4 py-5 md:rounded-3xl md:bg-white md:px-8 md:py-8 md:ring-1 md:ring-[var(--border)]">
          {step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vehicle Type" className="sm:col-span-2">
                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2.5">
                  <span className="h-10 w-10 overflow-hidden rounded-xl">
                    <PublicTransportIcon id={vehicleId} />
                  </span>
                  <span className="text-sm font-semibold">{vehicleName}</span>
                </div>
              </Field>
              <Field label="Vehicle Registration Number" required>
                <input className={inputClass} value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} placeholder="TS09 AB 1234" />
              </Field>
              <Field label="Vehicle Make" required>
                <input className={inputClass} value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} placeholder="Bajaj / Maruti / Tata" />
              </Field>
              <Field label="Vehicle Model" required>
                <input className={inputClass} value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="RE / Swift / Winger" />
              </Field>
              <Field label="Manufacturing Year" required>
                <select className={inputClass} value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Select year</option>
                  {MANUFACTURING_YEARS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Seating Capacity" required>
                <input className={inputClass} type="number" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} placeholder={DEFAULT_SEATS[vehicleId]} />
              </Field>
              <Field label="Service" required className="sm:col-span-2">
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {PUBLIC_TRANSPORT_SERVICES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setServiceType(item)}
                      className={cn(
                        "h-11 rounded-xl text-sm font-semibold ring-1",
                        serviceType === item ? "bg-[var(--primary)] text-white ring-[var(--primary)]" : "bg-white text-slate-700 ring-slate-200",
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Starting price (₹)" required className="sm:col-span-2">
                <input className={inputClass} type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="499" />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" required className="sm:col-span-2">
                <input className={inputClass} value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Ravi Kumar" />
              </Field>
              <Field label="Mobile Number" required>
                <input className={inputClass} inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" />
              </Field>
              <Field label="Date of Birth" required>
                <input className={inputClass} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </Field>
              <Field label="Driving Licence Number" required className="sm:col-span-2">
                <input className={inputClass} value={licenceNumber} onChange={(e) => setLicenceNumber(e.target.value.toUpperCase())} placeholder="TS09 20200012345" />
              </Field>
              <Field label="Address" required className="sm:col-span-2">
                <textarea className={`${inputClass} min-h-28 py-3`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, street, area, city" />
              </Field>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FileField label="Driving Licence" file={licence} onFile={setLicence} required />
              <FileField label="RC" file={rc} onFile={setRc} required />
              <FileField label="Insurance" file={insurance} onFile={setInsurance} required />
              <FileField label="PUC" file={puc} onFile={setPuc} required />
              <FileField label="Profile Photo" file={profile} onFile={setProfile} required imageOnly className="sm:col-span-2" />
              <Field label="Additional details" className="sm:col-span-2">
                <textarea className={`${inputClass} min-h-32 py-3`} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Optional — routes, night service, luggage, notes" />
              </Field>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-[var(--error)]">{error}</p> : null}
        </div>

        <WizardFooter
          step={step}
          lastStep={3}
          saving={saving}
          submitLabel="Submit Registration"
          onBack={() => goToStep(step - 1)}
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
  required,
  imageOnly,
  className,
}: {
  label: string;
  file: File | null;
  onFile: (file: File | null) => void;
  required?: boolean;
  imageOnly?: boolean;
  className?: string;
}) {
  const preview = useMemo(() => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <div className={className}>
      <span className="text-sm font-medium">
        {label}
        {required ? <span className="text-[var(--error)]"> *</span> : null}
      </span>
      {file ? (
        <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[11px] font-semibold text-slate-500">PDF</span>
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
          <input
            type="file"
            accept={imageOnly ? "image/*" : "image/*,.pdf"}
            className="hidden"
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  );
}
