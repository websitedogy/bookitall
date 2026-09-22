"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ImagePlus, Save, X } from "lucide-react";
import { useAuth, useAuthHydrated } from "@/features/auth/store";
import { api, authFetch, type ApiEnvelope } from "@/shared/lib/api";
import { ListingThumb } from "@/shared/ui/listing-thumb";

type Listing = {
  id: string;
  category: string;
  title: string;
  fields?: Record<string, string>;
  photoUrls?: string[];
};

export function VendorPostEdit({ id }: { id: string }) {
  const token = useAuth((state) => state.accessToken);
  const hydrated = useAuthHydrated();
  const [listing, setListing] = useState<Listing | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const previews = useMemo(() => newPhotos.map((file) => ({ file, url: URL.createObjectURL(file) })), [newPhotos]);

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  useEffect(() => {
    if (!hydrated || !token) return;
    void api<Listing>(`/vendor-listings/${id}`, { token })
      .then((response) => {
        const data = response.data ?? null;
        setListing(data);
        setValues(data?.fields ?? {});
        setPhotoUrls(data?.photoUrls ?? []);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load service"))
      .finally(() => setLoading(false));
  }, [hydrated, id, token]);

  function setField(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (!["listedBy", "latitude", "longitude"].includes(key)) body.append(key, value.trim());
      });
      body.append("keepPhotoUrls", JSON.stringify(photoUrls));
      newPhotos.forEach((photo) => body.append("photos", photo));
      const response = await authFetch(`/vendor-listings/${id}`, { method: "PATCH", token, body });
      const json = (await response.json().catch(() => ({}))) as ApiEnvelope<unknown>;
      if (!response.ok) throw new Error(Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Could not save changes");
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated) return <p className="px-4 py-10 text-sm text-[var(--text-muted)]">Loading service...</p>;
  if (!token) return <div className="px-4 py-10"><p className="text-sm text-[var(--text-muted)]">Sign in to edit this service.</p><Link href={`/login?next=/vendors/posts/${id}/edit`} className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white">Sign in</Link></div>;
  if (loading) return <p className="px-4 py-10 text-sm text-[var(--text-muted)]">Loading service...</p>;
  if (saved) {
    return <div className="mx-auto max-w-lg px-4 py-12 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-[var(--primary)]" /><h1 className="mt-4 text-2xl font-semibold">Changes submitted</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Your service is pending admin review again.</p><Link href="/vendors/posts" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white">Back to My Services</Link></div>;
  }
  if (!listing) return <p className="px-4 py-10 text-sm text-red-600">{error || "Service not found"}</p>;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-3xl bg-[#f6f8fb] px-4 pb-12 pt-4 md:px-6 md:pt-10">
      <Link href="/vendors/posts" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)]"><ArrowLeft className="h-4 w-4" /> My Services</Link>
      <div className="mt-5 rounded-3xl bg-white p-5 ring-1 ring-[var(--border)] md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Edit service</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{listing.title}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Update the details below. Saving sends the post for review again.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <section className="rounded-2xl bg-[var(--background)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-sm font-semibold">Service photos</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Remove old photos or add new ones. Up to 40 photos total.</p></div>
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--primary)] px-3 text-xs font-semibold text-white"><ImagePlus className="h-4 w-4" /> Add photos<input type="file" accept="image/*" multiple className="hidden" onChange={(event) => setNewPhotos((current) => [...current, ...Array.from(event.target.files ?? [])].slice(0, 40 - photoUrls.length))} /></label>
            </div>
            {photoUrls.length || previews.length ? <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">{photoUrls.map((photo) => <div key={photo} className="relative aspect-square overflow-hidden rounded-xl"><ListingThumb src={photo} categoryId={listing.category} className="h-full w-full object-cover" alt="Service photo" /><button type="button" aria-label="Remove photo" onClick={() => setPhotoUrls((current) => current.filter((item) => item !== photo))} className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white"><X className="h-3.5 w-3.5" /></button></div>)}{previews.map((preview) => <div key={preview.url} className="relative aspect-square overflow-hidden rounded-xl"><img src={preview.url} alt="New service photo" className="h-full w-full object-cover" /><button type="button" aria-label="Remove new photo" onClick={() => setNewPhotos((current) => current.filter((file) => file !== preview.file))} className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white"><X className="h-3.5 w-3.5" /></button></div>)}</div> : <p className="mt-4 text-xs text-[var(--text-muted)]">No photos selected. Add at least one to improve your listing.</p>}
          </section>
          {Object.entries(values).filter(([key]) => !["listedBy", "latitude", "longitude"].includes(key)).map(([key, value]) => (
            <label key={key} className="block">
              <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
              {value.length > 100 ? <textarea value={value} onChange={(event) => setField(key, event.target.value)} className="mt-1.5 min-h-28 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)]" /> : <input value={value} onChange={(event) => setField(key, event.target.value)} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)]" />}
            </label>
          ))}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={saving} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save changes"}</button>
        </form>
      </div>
    </main>
  );
}