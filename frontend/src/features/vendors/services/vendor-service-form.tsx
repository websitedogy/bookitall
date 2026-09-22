"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, X } from "lucide-react";
import { FormBackButton } from "./form-back-button";
import { useAuth } from "@/features/auth/store";
import { CategoryArt } from "@/features/home/components/category-art";
import { API_URL, ApiError } from "@/shared/lib/api";
import { VENDOR_SERVICE_SPECS, type VendorServiceSpec } from "./vendor-service-specs";

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";

export function VendorServiceForm({ spec }: { spec: VendorServiceSpec }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const priceField = spec.fields.find((field) => field.kind === "price");
  const [values, setValues] = useState<Record<string, string>>({});
  const [priceUnit, setPriceUnit] = useState(priceField && priceField.kind === "price" ? priceField.units[0].value : "");
  const [photos, setPhotos] = useState<File[]>([]);
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState("");
  const previews = useMemo(() => photos.map((file) => ({ file, url: URL.createObjectURL(file) })), [photos]);

  useEffect(() => {
    if (user?.phone && !values.mobileNumber) {
      setValues((current) => ({ ...current, mobileNumber: user.phone }));
    }
  }, [user, values.mobileNumber]);

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to list {spec.title.toLowerCase()}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Details are saved on your account in the database.</p>
        <Link
          href={`/login?next=/vendors/services/${spec.id}`}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  function setField(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    for (const field of spec.fields) {
      if (field.kind === "photos" || field.kind === "price") continue;
      const value = (values[field.name] ?? "").trim();
      if (field.required && !value) {
        setError(`Please fill in ${field.label.toLowerCase()}.`);
        return;
      }
      if (field.kind === "tel" && value && !/^\d{10}$/.test(value.replace(/\s/g, ""))) {
        setError("Enter a 10-digit mobile number.");
        return;
      }
    }
    if (!values.price || Number(values.price) <= 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (!location.trim()) {
      setError("Please add a location.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      for (const [key, value] of Object.entries(values)) {
        if (value) body.append(key, value.trim());
      }
      body.append("priceUnit", priceUnit);
      body.append("location", location.trim());
      for (const photo of photos) body.append("photos", photo);

      const res = await fetch(`${API_URL}/vendor-listings/${spec.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = (await res.json()) as { success?: boolean; message?: string | string[]; data?: { title?: string } };
      if (!res.ok) {
        const message = Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Could not save listing";
        throw new ApiError(message, res.status);
      }
      setSavedName(json.data?.title || spec.title);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?next=/vendors/services/${spec.id}`);
        return;
      }
      setError(err instanceof Error ? err.message : "Could not save listing");
    } finally {
      setSaving(false);
    }
  }

  if (savedName) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 md:max-w-xl md:py-4">
        <div className="rounded-[1.75rem] bg-white px-6 py-8 text-center ring-1 ring-[var(--border)] md:px-10 md:py-12 md:shadow-[var(--shadow-soft)]">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--primary)]" aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Listing saved</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text)]">{savedName}</span> now shows in Posts with photos and location.
          </p>
          <div className="mt-6 grid gap-2">
            <Link href="/vendors/posts" className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-sm font-semibold text-white">
              View My Services
            </Link>
            <Link href="/vendors/services" className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-[var(--primary)] ring-1 ring-[var(--border)]">
              List another service
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:mx-auto md:max-w-2xl">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[var(--border)] bg-white py-2 pl-12 pr-3 md:static md:mb-6 md:rounded-3xl md:border md:px-4 md:py-3">
        <FormBackButton />
        <CategoryArt id={spec.id} size={36} className="h-9 w-9 rounded-xl object-cover" />
        <h1 className="truncate text-[16px] font-semibold tracking-tight">{spec.title}</h1>
      </header>

      <form onSubmit={onSubmit} className="px-4 pb-8 pt-5 md:px-0 md:pb-4">
        <section className="mt-6 rounded-[1.5rem] bg-white p-5 ring-1 ring-[var(--border)] md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium">Location<span className="text-[var(--error)]"> *</span></span>
              <input
                className={inputClass}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Area, city"
                required
              />
            </label>
            {spec.fields.map((field) => {
              if (field.kind === "photos") {
                return (
                  <div key={field.name} className="sm:col-span-2">
                    <span className="text-sm font-medium">{field.label}</span>
                    <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-6 text-sm text-[var(--text-muted)]">
                      <ImagePlus className="mb-2 h-6 w-6" aria-hidden />
                      Add photos (up to 8)
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => setPhotos((current) => [...current, ...Array.from(event.target.files ?? [])].slice(0, 8))} />
                    </label>
                    {previews.length ? (
                      <ul className="mt-3 grid grid-cols-4 gap-2">
                        {previews.map((preview) => (
                          <li key={preview.url} className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview.url} alt="" className="h-20 w-full rounded-xl object-cover" />
                            <button type="button" aria-label="Remove photo" onClick={() => setPhotos((current) => current.filter((file) => file !== preview.file))} className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              }

              if (field.kind === "price") {
                return (
                  <label key={field.name} className="sm:col-span-2">
                    <span className="text-sm font-medium">{field.label}<span className="text-[var(--error)]"> *</span></span>
                    <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                      <input className={`${inputClass} mt-0`} type="number" min="1" value={values.price ?? ""} onChange={(event) => setField("price", event.target.value)} placeholder="499" required />
                      <div className="flex shrink-0 flex-wrap rounded-2xl border border-[var(--border)] bg-[var(--background)] p-1">
                        {field.units.map((unit) => (
                          <button
                            key={unit.value}
                            type="button"
                            onClick={() => setPriceUnit(unit.value)}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold ${priceUnit === unit.value ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)]"}`}
                          >
                            {unit.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </label>
                );
              }

              const wide = field.kind !== "select" && field.wide;
              return (
                <label key={field.name} className={wide ? "sm:col-span-2" : undefined}>
                  <span className="text-sm font-medium">
                    {field.label}
                    {field.required ? <span className="text-[var(--error)]"> *</span> : null}
                  </span>
                  {field.kind === "select" ? (
                    <select className={inputClass} value={values[field.name] ?? ""} onChange={(event) => setField(field.name, event.target.value)} required={field.required}>
                      <option value="">Select</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={inputClass}
                      type={field.kind === "number" ? "number" : "text"}
                      inputMode={field.kind === "tel" || field.kind === "number" ? "numeric" : undefined}
                      value={values[field.name] ?? ""}
                      placeholder={field.placeholder}
                      required={field.required}
                      onChange={(event) => setField(field.name, event.target.value)}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-[var(--error)]">{error}</p> : null}
        <button type="submit" disabled={saving} className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,118,110,0.85)] hover:bg-[var(--primary-hover)] disabled:opacity-60">
          {saving ? "Saving…" : `Submit ${spec.navLabel.toLowerCase()} listing`}
        </button>
      </form>
    </div>
  );
}

export function VendorServiceFormById({ id }: { id: string }) {
  const spec = VENDOR_SERVICE_SPECS[id];
  if (!spec) return null;
  return <VendorServiceForm spec={spec} />;
}
