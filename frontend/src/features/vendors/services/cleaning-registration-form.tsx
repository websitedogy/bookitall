"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brush, MapPin, Minus, Plus } from "lucide-react";
import { FormBackButton } from "./form-back-button";
import { StayField, StaySection, stayInputClass } from "./stay-form-ui";
import { useAuth } from "@/features/auth/store";
import { ApiError, authFetch } from "@/shared/lib/api";
import { geocodeVendorAddress } from "./detect-exact-location";
import { VendorLocationPopup } from "./vendor-location-popup";
import { cn } from "@/shared/lib/cn";
import { useDraftFiles, useDraftState } from "./use-vendor-form-draft";
import {
  WORK_CHARGES_NOTE,
  cleaningItemLabel,
  cleaningListingPrice,
  defaultCleaningItems,
  emptyCleaningItem,
  selectedCleaningItems,
  type CleaningItem,
} from "./cleaning-form-data";

export function CleaningRegistrationForm() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);

  const [name, setName] = useDraftState("cleaning", "name", "");
  const [mobile, setMobile] = useDraftState("cleaning", "mobile", "");
  const [locationLabel, setLocationLabel] = useDraftState("cleaning", "locationLabel", "");
  const [lat, setLat] = useDraftState<number | null>("cleaning", "lat", null);
  const [lng, setLng] = useDraftState<number | null>("cleaning", "lng", null);
  const [district, setDistrict] = useDraftState("cleaning", "district", "");
  const [serviceKm, setServiceKm] = useDraftState("cleaning", "serviceKm", "");
  const [items, setItems] = useDraftState("cleaning", "cleanTypes", defaultCleaningItems());
  const [chargesDiscussed, setChargesDiscussed] = useDraftState("cleaning", "chargesDiscussed", false);
  const [photos, setPhotos] = useDraftFiles("cleaning", "workPhotos");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  const photoUrls = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);
  const picked = selectedCleaningItems(items);

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
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to list cleaning services</h1>
        <Link href="/login?next=/vendors/services/cleaning" className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white">
          Sign in to continue
        </Link>
      </div>
    );
  }

  function patchItem(index: number, patch: Partial<CleaningItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setError("");
  }

  function addItem() {
    setItems((current) => [...current, emptyCleaningItem()]);
    setError("");
  }

  function removeItem(index: number) {
    setItems((current) => {
      const row = current[index];
      if (!row || row.locked) return current;
      return current.filter((_, i) => i !== index);
    });
    setError("");
  }

  function validate() {
    if (!name.trim()) return "Enter your name.";
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
    if (!locationLabel.trim()) return "Add your service location.";
    if (!serviceKm.trim()) return "Enter service area in KM.";
    if (!picked.length) return "Select at least one thing you clean.";
    for (const item of picked) {
      const oneTimeOk = item.oneTime && item.oneTimeAmount;
      const monthlyOk = item.monthly && item.monthlyAmount;
      if (!oneTimeOk && !monthlyOk) return `Enter one-time or monthly charge for ${item.name.trim()}.`;
    }
    if (!chargesDiscussed) return "Confirm that charges will be discussed before starting the work.";
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
      const listing = cleaningListingPrice(items);
      const body = new FormData();
      body.append("cleanerName", name.trim());
      body.append("serviceName", name.trim());
      body.append("shopName", name.trim());
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("servicesOffered", picked.map(cleaningItemLabel).join("; "));
      body.append("cleaningType", picked[0].name.trim());
      body.append("cleaningItems", JSON.stringify(picked));
      body.append("serviceKm", serviceKm);
      body.append("serviceArea", `Within ${serviceKm} KM`);
      body.append("coverage", `Within ${serviceKm} KM`);
      body.append("visitCharge", listing.price);
      body.append("startingCharge", listing.price);
      body.append("price", listing.price);
      body.append("priceUnit", listing.unit);
      body.append("workChargesNote", WORK_CHARGES_NOTE);
      body.append("location", locationLabel.trim());
      body.append("district", district);
      body.append("city", district);
      body.append("area", locationLabel.trim());
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

      const res = await authFetch("/vendor-listings/cleaning", { method: "POST", token, body });
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
        router.push("/login?next=/vendors/services/cleaning");
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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
              <Brush className="h-5 w-5 text-orange-700" />
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">Cleaning Service Registration</h1>
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
                    <MapPin className="h-4 w-4 text-amber-600" />
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
              <StayField label="Service Area" required className="mt-4">
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm text-slate-600">Within</span>
                  <input
                    value={serviceKm}
                    onChange={(e) => setServiceKm(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="___"
                    inputMode="numeric"
                    className={`${stayInputClass} mt-0 max-w-[7rem] text-center`}
                  />
                  <span className="text-sm font-medium text-slate-700">KM</span>
                </div>
              </StayField>
            </StaySection>

            <StaySection n={2} title="Cleaning Services">
              <p className="text-sm font-medium text-slate-800">
                What do you Clean? <span className="text-red-500">*</span>
              </p>
              <div className="mt-3 space-y-3">
                {items.map((item, index) => (
                  <div key={item.locked ? item.name : `custom-${index}`} className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3">
                    <div className="flex items-center gap-2">
                      <Check on={item.selected} onToggle={() => patchItem(index, { selected: !item.selected })} />
                      {item.locked ? (
                        <span className="flex-1 text-sm font-medium text-slate-900">{item.name}</span>
                      ) : (
                        <input
                          value={item.name}
                          onChange={(e) => patchItem(index, { name: e.target.value, selected: true })}
                          placeholder="Enter type"
                          className={`${stayInputClass} mt-0`}
                        />
                      )}
                      <div className="flex shrink-0 gap-1.5">
                        {!item.locked ? (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
                            aria-label="Remove cleaning type"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        ) : null}
                        {index === items.length - 1 ? (
                          <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)] text-white"
                            aria-label="Add cleaning type"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {item.selected ? (
                      <div className="mt-3 space-y-2 pl-7">
                        <ChargeRow
                          label="One-Time"
                          suffix="/ Work"
                          amount={item.oneTimeAmount}
                          onAmount={(value) =>
                            patchItem(index, { oneTimeAmount: value, oneTime: Boolean(value), selected: true })
                          }
                        />
                        <ChargeRow
                          label="Monthly"
                          suffix="/ Month"
                          amount={item.monthlyAmount}
                          onAmount={(value) =>
                            patchItem(index, { monthlyAmount: value, monthly: Boolean(value), selected: true })
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm font-medium text-slate-800">Work Charges</p>
              <button
                type="button"
                onClick={() => {
                  setChargesDiscussed(!chargesDiscussed);
                  setError("");
                }}
                className={cn(
                  "mt-2 flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm leading-relaxed",
                  chargesDiscussed ? "border-slate-800 bg-slate-50 text-slate-900" : "border-slate-200 bg-[#f8fafc] text-slate-700",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border",
                    chargesDiscussed ? "border-slate-800 bg-slate-800" : "border-slate-400 bg-white",
                  )}
                >
                  {chargesDiscussed ? <span className="text-[11px] font-bold text-white">✓</span> : null}
                </span>
                <span>{WORK_CHARGES_NOTE}</span>
              </button>
            </StaySection>

            <StaySection n={3} title="Service Images">
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

function Check({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border",
        on ? "border-slate-800 bg-slate-800" : "border-slate-400 bg-white",
      )}
      aria-pressed={on}
    >
      {on ? <span className="text-[11px] font-bold text-white">✓</span> : null}
    </button>
  );
}

function ChargeRow({
  label,
  suffix,
  amount,
  onAmount,
}: {
  label: string;
  suffix: string;
  amount: string;
  onAmount: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[4.75rem] text-sm text-slate-700">{label}</span>
      <span className="text-sm text-slate-500">₹</span>
      <input
        value={amount}
        onChange={(e) => onAmount(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="___"
        inputMode="numeric"
        className={`${stayInputClass} mt-0 h-10 max-w-[7rem] text-center`}
      />
      <span className="text-sm text-slate-600">{suffix}</span>
    </div>
  );
}
