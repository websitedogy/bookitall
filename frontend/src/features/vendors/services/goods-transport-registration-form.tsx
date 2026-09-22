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
import { GOODS_YEARS, goodsNeedsPermit, type GoodsTransportTypeId } from "./goods-transport-data";
import { GoodsTransportIcon } from "./goods-transport-icons";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]";

const STEPS = [
  { id: 1, label: "Vehicle Details" },
  { id: 2, label: "Vendor / Driver" },
  { id: 3, label: "Documents" },
] as const;

export function GoodsTransportRegistrationForm({
  vehicleId,
  vehicleName,
}: {
  vehicleId: GoodsTransportTypeId;
  vehicleName: string;
}) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const formId = `goods-transport-${vehicleId}`;
  const needsPermit = goodsNeedsPermit(vehicleId);

  const [step, setStep] = useDraftState(formId, "step", 1);
  const [customType, setCustomType] = useDraftState(formId, "customType", "");
  const [vehicleNumber, setVehicleNumber] = useDraftState(formId, "vehicleNumber", "");
  const [vehicleMake, setVehicleMake] = useDraftState(formId, "vehicleMake", "");
  const [vehicleModel, setVehicleModel] = useDraftState(formId, "vehicleModel", "");
  const [year, setYear] = useDraftState(formId, "year", "");
  const [loadCapacity, setLoadCapacity] = useDraftState(formId, "loadCapacity", "");
  const [price, setPrice] = useDraftState(formId, "price", "");
  const [fullName, setFullName] = useDraftState(formId, "fullName", "");
  const [mobile, setMobile] = useDraftState(formId, "mobile", "");
  const [licenceNumber, setLicenceNumber] = useDraftState(formId, "licenceNumber", "");
  const [address, setAddress] = useDraftState(formId, "address", "");
  const [isOwner, setIsOwner] = useDraftState(formId, "isOwner", true);
  const [ownerName, setOwnerName] = useDraftState(formId, "ownerName", "");
  const [driverName, setDriverName] = useDraftState(formId, "driverName", "");
  const [driverMobile, setDriverMobile] = useDraftState(formId, "driverMobile", "");
  const [front, setFront] = useDraftFile(formId, "front");
  const [side, setSide] = useDraftFile(formId, "side");
  const [profile, setProfile] = useDraftFile(formId, "profile");
  const [licence, setLicence] = useDraftFile(formId, "licence");
  const [rc, setRc] = useDraftFile(formId, "rc");
  const [insurance, setInsurance] = useDraftFile(formId, "insurance");
  const [puc, setPuc] = useDraftFile(formId, "puc");
  const [permit, setPermit] = useDraftFile(formId, "permit");
  const [vehiclePhoto, setVehiclePhoto] = useDraftFile(formId, "vehiclePhoto");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState("");

  const typeLabel = vehicleId === "other" ? customType.trim() || "Other" : vehicleName;

  useEffect(() => {
    if (!user) return;
    setFullName((current) => current || user.fullName || "");
    setMobile((current) => current || (user.phone || "").replace(/\D/g, "").slice(-10));
  }, [user]);

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to register {vehicleName}</h1>
        <Link
          href={`/login?next=${encodeURIComponent(`/vendors/services/goods-transport?type=${vehicleId}`)}`}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  function validateStep(at = step) {
    if (at === 1) {
      if (vehicleId === "other" && !customType.trim()) return "Enter the vehicle type.";
      if (!vehicleNumber.trim()) return "Enter the vehicle registration number.";
      if (!vehicleMake.trim()) return "Enter the vehicle make / brand.";
      if (!vehicleModel.trim()) return "Enter the vehicle model.";
      if (!year) return "Choose the manufacturing year.";
      if (!loadCapacity.trim()) return "Enter load capacity.";
      if (!price || Number(price) <= 0) return "Enter a starting price.";
      if (!front) return "Upload the front vehicle photo.";
      if (!side) return "Upload the side vehicle photo.";
      return "";
    }
    if (at === 2) {
      if (!fullName.trim()) return "Enter the full name.";
      if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
      if (!licenceNumber.trim()) return "Enter the driving licence number.";
      if (!address.trim()) return "Enter the address.";
      if (!profile) return "Upload a profile photo.";
      if (!isOwner) {
        if (!ownerName.trim()) return "Enter the vehicle owner name.";
        if (!driverName.trim()) return "Enter the driver name.";
        if (!/^\d{10}$/.test(driverMobile.replace(/\s/g, ""))) return "Enter the driver mobile number.";
      }
      return "";
    }
    if (!rc) return "Upload the RC.";
    if (!licence) return "Upload the driving licence.";
    if (!insurance) return "Upload the vehicle insurance.";
    if (!puc) return "Upload the PUC certificate.";
    if (needsPermit && !permit) return "Upload the permit.";
    if (!vehiclePhoto) return "Upload a vehicle photo.";
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
      body.append("vehicleType", typeLabel);
      body.append("vehicleNumber", vehicleNumber.trim().toUpperCase());
      body.append("vehicleMake", vehicleMake.trim());
      body.append("vehicleModel", vehicleModel.trim());
      body.append("manufacturingYear", year);
      body.append("loadCapacity", loadCapacity.trim());
      body.append("price", price);
      body.append("priceUnit", "PER_TRIP");
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("drivingLicenceNumber", licenceNumber.trim());
      body.append("address", address.trim());
      body.append("location", address.trim());
      body.append("ownerSame", isOwner ? "yes" : "no");
      if (isOwner) {
        body.append("driverName", fullName.trim());
        body.append("ownerName", fullName.trim());
      } else {
        body.append("driverName", driverName.trim());
        body.append("ownerName", ownerName.trim());
        body.append("driverMobile", driverMobile.replace(/\s/g, ""));
      }
      if (front) body.append("photos", front);
      if (side) body.append("photos", side);
      if (vehiclePhoto) body.append("photos", vehiclePhoto);
      if (profile) body.append("photos", profile);
      if (licence) body.append("license", licence);
      if (rc) body.append("rc", rc);
      if (insurance) body.append("insurance", insurance);
      if (puc) body.append("puc", puc);
      if (permit) body.append("permit", permit);

      const res = await authFetch("/vendor-listings/goods-transport", { method: "POST", token, body });
      const json = (await res.json().catch(() => ({}))) as { message?: string | string[]; data?: { title?: string } };
      if (!res.ok) {
        const text = Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Could not save listing";
        throw new ApiError(text, res.status);
      }
      setSavedName(json.data?.title || fullName.trim());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?next=/vendors/services/goods-transport?type=${vehicleId}`);
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
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Submitted for verification</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{savedName}</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">{typeLabel} listing is pending admin review.</p>
          <div className="mt-7 grid gap-2">
            <Link href="/vendors/posts" className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
              View My Services
            </Link>
            <Link href="/vendors/services/goods-transport" className="inline-flex h-12 items-center justify-center rounded-full text-sm font-medium text-[var(--primary)] ring-1 ring-[var(--border)]">
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
            onClick={() => (step === 1 ? router.push("/vendors/services/goods-transport") : setStep((current) => current - 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="h-9 w-9 overflow-hidden rounded-xl">
            <GoodsTransportIcon id={vehicleId} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
              {typeLabel} · Step {step} of 3
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
                    <GoodsTransportIcon id={vehicleId} />
                  </span>
                  <span className="text-sm font-semibold">{vehicleName}</span>
                </div>
              </Field>
              {vehicleId === "other" ? (
                <Field label="Enter Vehicle Type" required className="sm:col-span-2">
                  <input className={inputClass} value={customType} onChange={(e) => setCustomType(e.target.value)} placeholder="e.g. Bolero Pickup" />
                </Field>
              ) : null}
              <Field label="Vehicle Registration Number" required>
                <input className={inputClass} value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} placeholder="TS09 AB 1234" />
              </Field>
              <Field label="Vehicle Make / Brand" required>
                <input className={inputClass} value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} placeholder="Tata / Ashok Leyland / Eicher" />
              </Field>
              <Field label="Vehicle Model" required>
                <input className={inputClass} value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="Ace / 407 / 1616" />
              </Field>
              <Field label="Manufacturing Year" required>
                <select className={inputClass} value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Select year</option>
                  {GOODS_YEARS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Load Capacity" required>
                <input className={inputClass} value={loadCapacity} onChange={(e) => setLoadCapacity(e.target.value)} placeholder="1 ton / 3 ton / 9 ton" />
              </Field>
              <Field label="Starting price (₹)" required>
                <input className={inputClass} type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1499" />
              </Field>
              <FileField label="Vehicle Photo — Front" file={front} onFile={setFront} required imageOnly />
              <FileField label="Vehicle Photo — Side" file={side} onFile={setSide} required imageOnly />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-3">
                <input type="checkbox" checked={isOwner} onChange={(e) => setIsOwner(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                <span className="text-sm font-medium">I am the Vehicle Owner</span>
              </label>
              <Field label="Full Name" required className="sm:col-span-2">
                <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ravi Kumar" />
              </Field>
              <Field label="Mobile Number" required>
                <input className={inputClass} inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" />
              </Field>
              <Field label="Driving Licence Number" required>
                <input className={inputClass} value={licenceNumber} onChange={(e) => setLicenceNumber(e.target.value.toUpperCase())} placeholder="TS09 20200012345" />
              </Field>
              <Field label="Address" required className="sm:col-span-2">
                <textarea className={`${inputClass} min-h-28 py-3`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, street, area, city" />
              </Field>
              <FileField label="Profile Photo" file={profile} onFile={setProfile} required imageOnly className="sm:col-span-2" />
              {isOwner ? null : (
                <>
                  <Field label="Vehicle Owner Name" required className="sm:col-span-2">
                    <input className={inputClass} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner full name" />
                  </Field>
                  <Field label="Driver Name" required>
                    <input className={inputClass} value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Driver full name" />
                  </Field>
                  <Field label="Driver Mobile Number" required>
                    <input className={inputClass} inputMode="numeric" value={driverMobile} onChange={(e) => setDriverMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" />
                  </Field>
                </>
              )}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FileField label="RC (Registration Certificate)" file={rc} onFile={setRc} required />
              <FileField label="Driving Licence" file={licence} onFile={setLicence} required />
              <FileField label="Vehicle Insurance" file={insurance} onFile={setInsurance} required />
              <FileField label="PUC Certificate" file={puc} onFile={setPuc} required />
              {needsPermit ? <FileField label="Permit" file={permit} onFile={setPermit} required /> : null}
              <FileField label="Vehicle Photo" file={vehiclePhoto} onFile={setVehiclePhoto} required imageOnly className={needsPermit ? undefined : "sm:col-span-2"} />
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-[var(--error)]">{error}</p> : null}
        </div>

        <WizardFooter
          step={step}
          lastStep={3}
          saving={saving}
          submitLabel="Submit for Verification"
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
          <input type="file" accept={imageOnly ? "image/*" : "image/*,.pdf"} className="hidden" onChange={(event) => onFile(event.target.files?.[0] ?? null)} />
        </label>
      )}
    </div>
  );
}
