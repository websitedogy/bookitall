"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Minus, Plus, Sparkles } from "lucide-react";
import { FormBackButton } from "./form-back-button";
import { StayField, StaySection, stayInputClass } from "./stay-form-ui";
import { useAuth } from "@/features/auth/store";
import { ApiError, authFetch } from "@/shared/lib/api";
import { geocodeVendorAddress } from "./detect-exact-location";
import { VendorLocationPopup } from "./vendor-location-popup";
import { cn } from "@/shared/lib/cn";
import { useDraftFiles, useDraftState } from "./use-vendor-form-draft";
import {
  BEAUTY_SERVICE_AREAS,
  emptyBeautyService,
  filledBeautyServices,
  type BeautyServiceRow,
} from "./beautician-form-data";

export function BeauticianRegistrationForm() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);

  const [name, setName] = useDraftState("beautician", "name", "");
  const [mobile, setMobile] = useDraftState("beautician", "mobile", "");
  const [locationLabel, setLocationLabel] = useDraftState("beautician", "locationLabel", "");
  const [lat, setLat] = useDraftState<number | null>("beautician", "lat", null);
  const [lng, setLng] = useDraftState<number | null>("beautician", "lng", null);
  const [district, setDistrict] = useDraftState("beautician", "district", "");
  const [serviceAreas, setServiceAreas] = useDraftState("beautician", "serviceAreas", [] as string[]);
  const [rows, setRows] = useDraftState("beautician", "beautyRows", [emptyBeautyService()] as BeautyServiceRow[]);
  const [extraInfo, setExtraInfo] = useDraftState("beautician", "extraInfo", "");
  const [photos, setPhotos] = useDraftFiles("beautician", "workPhotos");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  const photoUrls = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);
  const filled = filledBeautyServices(rows);

  useEffect(() => {
    return () => photoUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [photoUrls]);

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.fullName || "");
    setMobile((current) => current || (user.phone || "").replace(/\D/g, "").slice(-10));
  }, [user]);

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to list beauty services</h1>
        <Link href="/login?next=/vendors/services/beautician" className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white">
          Sign in to continue
        </Link>
      </div>
    );
  }

  function patchRow(index: number, patch: Partial<BeautyServiceRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setError("");
  }

  function addRow() {
    setRows((current) => [...current, emptyBeautyService()]);
    setError("");
  }

  function removeRow(index: number) {
    setRows((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
    setError("");
  }

  function toggleArea(value: string) {
    setServiceAreas((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
    setError("");
  }

  function validate() {
    if (!name.trim()) return "Enter your name.";
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
    if (!locationLabel.trim()) return "Add your service location.";
    if (!serviceAreas.length) return "Select at least one service area.";
    if (!filled.length) return "Add at least one service with amount.";
    for (const row of rows) {
      if (row.name.trim() && !row.amount.trim()) return `Enter amount for ${row.name.trim()}.`;
      if (!row.name.trim() && row.amount.trim()) return "Enter service name.";
    }
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
      const area = serviceAreas.join(", ");
      body.append("beauticianName", name.trim());
      body.append("shopName", name.trim());
      body.append("serviceName", name.trim());
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("serviceType", filled[0].name.trim());
      body.append("servicesOffered", filled.map((row) => `${row.name.trim()} ₹${row.amount}`).join("; "));
      body.append("beautyServices", JSON.stringify(filled));
      body.append("serviceArea", area);
      body.append("coverage", area);
      body.append("serviceFor", area);
      body.append("serviceMode", area);
      body.append("price", filled[0].amount);
      body.append("priceUnit", "PER_SERVICE");
      body.append("location", locationLabel.trim());
      body.append("district", district);
      body.append("city", district);
      body.append("area", locationLabel.trim());
      if (extraInfo.trim()) body.append("description", extraInfo.trim());
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
      for (const photo of photos.slice(0, 10)) body.append("photos", photo);

      const res = await authFetch("/vendor-listings/beautician", { method: "POST", token, body });
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
        router.push("/login?next=/vendors/services/beautician");
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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50">
              <Sparkles className="h-5 w-5 text-pink-600" />
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">Beauty Service Registration</h1>
          </header>

          <div className="px-4 pb-6 md:px-0">
            <StaySection n={1} title="Basic Details">
              <StayField label="Name" required>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className={stayInputClass} />
              </StayField>
              <StayField label="Mobile Number" required className="mt-4">
                <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Enter mobile number" inputMode="numeric" className={stayInputClass} />
              </StayField>
              <StayField label="Service Location" required className="mt-4">
                {locationLabel ? (
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
                    <MapPin className="h-4 w-4 text-pink-600" />
                    Add Location
                  </button>
                )}
              </StayField>
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
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-800">
                  Service Area <span className="text-red-500">*</span>
                </p>
                <div className="mt-2 space-y-2">
                  {BEAUTY_SERVICE_AREAS.map((option) => {
                    const on = serviceAreas.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleArea(option)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm",
                          on ? "border-slate-800 bg-slate-50" : "border-slate-200 bg-[#f8fafc]",
                        )}
                      >
                        <span className={cn("inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border", on ? "border-slate-800 bg-slate-800" : "border-slate-400 bg-white")}>
                          {on ? <span className="text-[11px] font-bold text-white">✓</span> : null}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </StaySection>

            <StaySection n={2} title="Beauty Services">
              <div className="space-y-2.5">
                <div className="grid grid-cols-[minmax(0,1fr)_9rem_auto] items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">
                    Service name <span className="text-red-500">*</span>
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    Amount <span className="text-red-500">*</span>
                  </p>
                  <span />
                </div>
                {rows.map((row, index) => (
                  <div key={index} className="grid grid-cols-[minmax(0,1fr)_9rem_auto] items-center gap-2">
                    <input
                      value={row.name}
                      onChange={(e) => patchRow(index, { name: e.target.value })}
                      placeholder="e.g. Haircut"
                      className="h-11 min-w-0 rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]"
                    />
                    <label className="flex h-11 min-w-0 items-center rounded-xl border border-slate-200 bg-[#f8fafc] px-3 focus-within:border-[var(--primary)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--primary-soft)]">
                      <span className="shrink-0 text-sm text-slate-500">₹</span>
                      <input
                        value={row.amount}
                        onChange={(e) => patchRow(index, { amount: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                        placeholder="0"
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
                          aria-label="Remove service"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      ) : null}
                      {index === rows.length - 1 ? (
                        <button
                          type="button"
                          onClick={addRow}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)] text-white"
                          aria-label="Add service"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-slate-800">Service Images</p>
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
                  {photos.length < 10 ? (
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#c5ced8] text-slate-500">
                      <Plus className="h-5 w-5" />
                      <span className="mt-1 text-[11px] font-medium">Upload Images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          const next = Array.from(e.target.files ?? []);
                          setPhotos((current) => [...current, ...next].slice(0, 10));
                          e.target.value = "";
                        }}
                      />
                    </label>
                  ) : null}
                </div>
              </div>

              <StayField label="Additional Details" className="mt-6">
                <textarea
                  value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                  rows={5}
                  placeholder="Enter additional details"
                  className={`${stayInputClass} h-auto min-h-[8rem] resize-y py-3`}
                />
              </StayField>
            </StaySection>

            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={saving}
              onClick={() => void submit()}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Submitting…" : "Submit Registration"}
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
