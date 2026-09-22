"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, X } from "lucide-react";
import { FormBackButton } from "./form-back-button";
import { useAuth } from "@/features/auth/store";
import { CategoryArt } from "@/features/home/components/category-art";
import { API_URL, ApiError } from "@/shared/lib/api";

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";

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

export function HotelVendorForm() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const [hotelName, setHotelName] = useState("");
  const [mobile, setMobile] = useState(user?.phone ?? "");
  const [hotelType, setHotelType] = useState("");
  const [roomType, setRoomType] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState<"PER_ROOM" | "PER_DAY">("PER_ROOM");
  const [entryPrice, setEntryPrice] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState("");

  useEffect(() => {
    if (user?.phone && !mobile) setMobile(user.phone);
  }, [user, mobile]);

  const previews = useMemo(() => photos.map((file) => ({ file, url: URL.createObjectURL(file) })), [photos]);

  if (!user || !token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to list your hotel</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          The hotel is saved on your account, so customers can book the listing you submit.
        </p>
        <Link
          href="/login?next=/vendors/services/hotels"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    const next = [...photos, ...Array.from(list)].slice(0, 8);
    setPhotos(next);
    setError("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const name = hotelName.trim();
    const phone = mobile.replace(/\s/g, "");
    if (!name) return setError("Please fill in hotel name.");
    if (!/^\d{10}$/.test(phone)) return setError("Enter a 10-digit mobile number.");
    if (!hotelType) return setError("Please choose hotel type.");
    if (!roomType) return setError("Please choose room type.");
    if (!location.trim()) return setError("Please fill in location.");
    if (!price || Number(price) <= 0) return setError("Please enter a valid price.");
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("hotelName", name);
      body.append("mobileNumber", phone);
      body.append("hotelType", hotelType);
      body.append("roomType", roomType);
      body.append("location", location.trim());
      body.append("price", price);
      body.append("priceUnit", priceUnit);
      if (entryPrice) body.append("entryPrice", entryPrice);
      body.append("checkInTime", "12:00");
      body.append("checkOutTime", "11:00");
      for (const photo of photos) body.append("photos", photo);

      const res = await fetch(`${API_URL}/hotels/listings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = (await res.json()) as { success?: boolean; message?: string | string[]; data?: { name?: string } };
      if (!res.ok) {
        const message = Array.isArray(json.message) ? json.message.join(", ") : json.message ?? "Could not save hotel";
        throw new ApiError(message, res.status);
      }
      setSavedName(json.data?.name || name);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login?next=/vendors/services/hotels");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not save hotel");
    } finally {
      setSaving(false);
    }
  }

  if (savedName) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 md:max-w-xl md:py-4">
        <div className="rounded-[1.75rem] bg-white px-6 py-8 text-center ring-1 ring-[var(--border)] md:px-10 md:py-12 md:shadow-[var(--shadow-soft)]">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--primary)]" aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Hotel saved</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text)]">{savedName}</span> now shows in Posts with photos and location.
          </p>
          <div className="mt-6 grid gap-2">
            <Link
              href="/vendors/posts"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-sm font-semibold text-white"
            >
              View My Services
            </Link>
            <Link
              href="/vendors/services"
              className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-[var(--primary)] ring-1 ring-[var(--border)]"
            >
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
        <CategoryArt id="hotels" size={36} className="h-9 w-9 rounded-xl object-cover" />
        <h1 className="truncate text-[16px] font-semibold tracking-tight">Hotels</h1>
      </header>

      <form onSubmit={onSubmit} className="px-4 pb-8 pt-5 md:px-0 md:pb-4">
        <section className="mt-6 rounded-[1.5rem] bg-white p-5 ring-1 ring-[var(--border)] md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium">Hotel Name<span className="text-[var(--error)]"> *</span></span>
              <input className={inputClass} value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="Rajahmundry Grand Inn" required />
            </label>
            <label>
              <span className="text-sm font-medium">Mobile Number<span className="text-[var(--error)]"> *</span></span>
              <input className={inputClass} inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9876543210" required />
            </label>
            <label>
              <span className="text-sm font-medium">Hotel Type<span className="text-[var(--error)]"> *</span></span>
              <select className={inputClass} value={hotelType} onChange={(e) => setHotelType(e.target.value)} required>
                <option value="">Select</option>
                {HOTEL_TYPES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium">Room Type<span className="text-[var(--error)]"> *</span></span>
              <select className={inputClass} value={roomType} onChange={(e) => setRoomType(e.target.value)} required>
                <option value="">Select</option>
                {ROOM_TYPES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium">Location<span className="text-[var(--error)]"> *</span></span>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Danavaipeta, Rajahmundry" required />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium">Price<span className="text-[var(--error)]"> *</span></span>
              <div className="mt-1.5 flex gap-2">
                <input className={`${inputClass} mt-0`} type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2499" required />
                <div className="flex shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-1">
                  <button
                    type="button"
                    onClick={() => setPriceUnit("PER_ROOM")}
                    className={`rounded-xl px-3 text-xs font-semibold ${priceUnit === "PER_ROOM" ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)]"}`}
                  >
                    Per Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceUnit("PER_DAY")}
                    className={`rounded-xl px-3 text-xs font-semibold ${priceUnit === "PER_DAY" ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)]"}`}
                  >
                    Per Day
                  </button>
                </div>
              </div>
            </label>
            <label>
              <span className="text-sm font-medium">Entry Price</span>
              <input className={inputClass} type="number" min="0" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="Optional" />
            </label>
            <div className="sm:col-span-2">
              <span className="text-sm font-medium">Hotel Photos</span>
              <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-6 text-sm text-[var(--text-muted)]">
                <ImagePlus className="mb-2 h-6 w-6" aria-hidden />
                Add photos (up to 8)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => addPhotos(event.target.files)}
                />
              </label>
              {previews.length ? (
                <ul className="mt-3 grid grid-cols-4 gap-2">
                  {previews.map((preview) => (
                    <li key={preview.url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview.url} alt="" className="h-20 w-full rounded-xl object-cover" />
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() => setPhotos((current) => current.filter((file) => file !== preview.file))}
                        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>

        {error ? <p className="mt-4 text-sm text-[var(--error)]">{error}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(15,118,110,0.85)] hover:bg-[var(--primary-hover)] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Submit hotel listing"}
        </button>
      </form>
    </div>
  );
}
