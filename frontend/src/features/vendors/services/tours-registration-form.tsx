"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bus, FileUp, MapPin, Minus, Plus } from "lucide-react";
import { FormBackButton } from "./form-back-button";
import { StayField, StaySection, stayInputClass } from "./stay-form-ui";
import { useAuth } from "@/features/auth/store";
import { ApiError, authFetch } from "@/shared/lib/api";
import { geocodeVendorAddress } from "./detect-exact-location";
import { VendorLocationPopup } from "./vendor-location-popup";
import { ELECTRICIAN_DISTRICTS, TOUR_DURATIONS, TOUR_FOOD, TOUR_LICENSE_STATUS } from "./tours-form-data";
import { useDraftFile, useDraftFiles, useDraftState } from "./use-vendor-form-draft";

export function ToursRegistrationForm() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);

  const [agencyName, setAgencyName] = useDraftState("tours", "agencyName", "");
  const [ownerName, setOwnerName] = useDraftState("tours", "ownerName", "");
  const [mobile, setMobile] = useDraftState("tours", "mobile", "");
  const [locationLabel, setLocationLabel] = useDraftState("tours", "locationLabel", "");
  const [lat, setLat] = useDraftState<number | null>("tours", "lat", null);
  const [lng, setLng] = useDraftState<number | null>("tours", "lng", null);
  const [district, setDistrict] = useDraftState("tours", "district", "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tourName, setTourName] = useDraftState("tours", "tourName", "");
  const [places, setPlaces] = useDraftState("tours", "places", [""]);
  const [pickupPoint, setPickupPoint] = useDraftState("tours", "pickupPoint", "");
  const [dropPoint, setDropPoint] = useDraftState("tours", "dropPoint", "");
  const [amount, setAmount] = useDraftState("tours", "amount", "");
  const [food, setFood] = useDraftState("tours", "food", "");
  const [duration, setDuration] = useDraftState("tours", "duration", "");
  const [licenseStatus, setLicenseStatus] = useDraftState("tours", "licenseStatus", "");
  const [licenseFile, setLicenseFile] = useDraftFile("tours", "licenseFile");
  const [photos, setPhotos] = useDraftFiles("tours", "photos");
  const [extraInfo, setExtraInfo] = useDraftState("tours", "extraInfo", "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  const photoUrls = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);
  const filledPlaces = places.map((place) => place.trim()).filter(Boolean);

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
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to list tour packages</h1>
        <Link href="/login?next=/vendors/services/tours" className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-white">
          Sign in to continue
        </Link>
      </div>
    );
  }

  function addPlace() {
    setPlaces((current) => [...current, ""]);
    setError("");
  }

  function removePlace(index: number) {
    setPlaces((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
    setError("");
  }

  function updatePlace(index: number, value: string) {
    setPlaces((current) => current.map((place, i) => (i === index ? value : place)));
    setError("");
  }

  function validate() {
    if (!agencyName.trim()) return "Enter agency name.";
    if (!ownerName.trim()) return "Enter owner name.";
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return "Enter a 10-digit mobile number.";
    if (!locationLabel.trim()) return "Use current location, or enter the address.";
    if (!tourName.trim()) return "Enter tour name.";
    if (!filledPlaces.length) return "Enter at least one place.";
    if (!pickupPoint.trim()) return "Enter pickup point.";
    if (!dropPoint.trim()) return "Enter drop point.";
    if (!amount.trim()) return "Enter package amount.";
    if (!food) return "Select food option.";
    if (!licenseStatus) return "Select license status.";
    if (licenseStatus === "Available" && !licenseFile) return "Upload the travel license.";
    if (!photos.length) return "Add at least one tour image.";
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
      const destinations = filledPlaces.join(", ");
      body.append("shopName", agencyName.trim());
      body.append("businessName", agencyName.trim());
      body.append("ownerName", ownerName.trim());
      body.append("mobileNumber", mobile.replace(/\s/g, ""));
      body.append("packageName", tourName.trim());
      body.append("destinations", destinations);
      body.append("pickupPoint", pickupPoint.trim());
      body.append("dropPoint", dropPoint.trim());
      body.append("pickupAvailable", "Yes");
      body.append("dropAvailable", "Yes");
      body.append("price", amount.replace(/\D/g, "") || "0");
      body.append("priceFrom", amount.replace(/\D/g, "") || "0");
      body.append("priceUnit", "PER_PERSON");
      body.append("food", food);
      body.append("inclusions", food === "Included" ? "Food" : "");
      body.append("duration", duration);
      body.append("tripDuration", duration);
      body.append("licenseStatus", licenseStatus);
      body.append("location", locationLabel.trim());
      body.append("district", district);
      body.append("state", info?.state || "");
      body.append("city", district);
      body.append("area", locationLabel.trim());
      let pinLat = lat;
      let pinLng = lng;
      if (pinLat == null || pinLng == null) {
        const pin = await geocodeVendorAddress(locationLabel.trim());
        if (!pin) throw new Error("Could not pin this location. Use current location or enter a clearer address.");
        pinLat = pin.lat;
        pinLng = pin.lng;
      }
      body.append("latitude", String(pinLat));
      body.append("longitude", String(pinLng));
      body.append("listedBy", user?.fullName ?? "");
      if (extraInfo.trim()) body.append("description", extraInfo.trim());
      if (licenseFile) body.append("license", licenseFile);
      for (const photo of photos.slice(0, 10)) body.append("photos", photo);

      const res = await authFetch("/vendor-listings/tours", { method: "POST", token, body });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string | string[];
        data?: { title?: string };
      };
      if (!res.ok) {
        const text = Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Could not submit";
        throw new ApiError(text, res.status);
      }
      setSaved(json.data?.title || agencyName.trim());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login?next=/vendors/services/tours");
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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
              <Bus className="h-5 w-5 text-violet-700" />
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">Tour Packages</h1>
          </header>

          <div className="px-4 pb-6 md:px-0">
            <StaySection n={1} title="Agency Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <StayField label="Agency Name" required className="sm:col-span-2">
                  <input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Enter agency name" className={stayInputClass} />
                </StayField>
                <StayField label="Owner Name" required>
                  <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Enter owner name" className={stayInputClass} />
                </StayField>
                <StayField label="Mobile Number" required>
                  <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Enter mobile number" inputMode="numeric" className={stayInputClass} />
                </StayField>
              </div>
              <StayField label="Current Location" required className="mt-4">
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
                    <MapPin className="h-4 w-4 text-violet-700" />
                    Use Current Location
                  </button>
                )}
              </StayField>
              {pickerOpen ? (
                <VendorLocationPopup
                  initialLabel={locationLabel}
                  initialLat={lat}
                  initialLng={lng}
                  pinLabel="Tour location"
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
            </StaySection>

            <StaySection n={2} title="Tour Details">
              <StayField label="Tour Name" required>
                <input value={tourName} onChange={(e) => setTourName(e.target.value)} placeholder="Enter tour name" className={stayInputClass} />
              </StayField>
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-800">
                  Places <span className="text-red-500">*</span>
                </p>
                <div className="mt-2 space-y-2">
                  {places.map((place, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-sm text-slate-500">Place {index + 1}</span>
                      <input
                        value={place}
                        onChange={(e) => updatePlace(index, e.target.value)}
                        placeholder="Enter place"
                        className={`${stayInputClass} mt-0`}
                      />
                      <div className="flex shrink-0 gap-1.5">
                        {places.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removePlace(index)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
                            aria-label={`Remove place ${index + 1}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        ) : null}
                        {index === places.length - 1 ? (
                          <button
                            type="button"
                            onClick={addPlace}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)] text-white"
                            aria-label="Add place"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <StayField label="Pickup Point" required>
                  <input value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)} placeholder="Enter pickup point" className={stayInputClass} />
                </StayField>
                <StayField label="Drop Point" required>
                  <input value={dropPoint} onChange={(e) => setDropPoint(e.target.value)} placeholder="Enter drop point" className={stayInputClass} />
                </StayField>
              </div>
            </StaySection>

            <StaySection n={3} title="Package Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <StayField label="Package Amount" required>
                  <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))} placeholder="₹ Enter amount" inputMode="numeric" className={stayInputClass} />
                </StayField>
                <StayField label="Food" required>
                  <select value={food} onChange={(e) => setFood(e.target.value)} className={stayInputClass}>
                    <option value="">Select</option>
                    {TOUR_FOOD.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </StayField>
                <StayField label="Trip Duration" className="sm:col-span-2">
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} className={stayInputClass}>
                    <option value="">Select</option>
                    {TOUR_DURATIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </StayField>
              </div>
            </StaySection>

            <StaySection n={4} title="Travel License">
              <StayField label="License Status" required>
                <select
                  value={licenseStatus}
                  onChange={(e) => {
                    setLicenseStatus(e.target.value);
                    if (e.target.value !== "Available") setLicenseFile(null);
                    setError("");
                  }}
                  className={stayInputClass}
                >
                  <option value="">Select</option>
                  {TOUR_LICENSE_STATUS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </StayField>
              {licenseStatus === "Available" ? (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-800">
                    License Document <span className="text-red-500">*</span>
                  </p>
                  <label className="mt-1.5 flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#c5ced8] bg-[#f8fafc] px-3.5 text-sm text-slate-600">
                    <FileUp className="h-4 w-4" />
                    <span className="truncate">{licenseFile ? licenseFile.name : "Upload License"}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,application/pdf"
                      className="sr-only"
                      onChange={(e) => {
                        setLicenseFile(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              ) : null}
            </StaySection>

            <StaySection n={5} title="Tour Images">
              <p className="text-sm font-medium text-slate-800">
                Add Images <span className="text-red-500">*</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {photoUrls.map((url, index) => (
                  <button key={url} type="button" onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))} className="h-24 w-24 overflow-hidden rounded-xl bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
                {photos.length < 10 ? (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#c5ced8] text-slate-500">
                    <Plus className="h-5 w-5" />
                    <span className="mt-1 text-[11px] font-medium">Add Images</span>
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
              <p className="mt-2 text-xs text-slate-500">Add multiple tour images. Tap a photo to remove it.</p>
            </StaySection>

            <StaySection n={6} title="Additional Information">
              <textarea
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                rows={4}
                placeholder="Enter additional information"
                className={`${stayInputClass} mt-0 h-auto min-h-[6.5rem] resize-y py-3`}
              />
            </StaySection>

            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={saving}
              onClick={() => void submit()}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Submitting…" : "Submit Tour"}
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
