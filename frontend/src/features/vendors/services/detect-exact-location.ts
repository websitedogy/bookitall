import { reverseGeocodeAddress } from "@/shared/lib/geo";
import { ELECTRICIAN_DISTRICTS } from "./electrician-form-data";

export type ExactVendorLocation = {
  lat: number;
  lng: number;
  label: string;
  districtName?: string;
};

export function districtNameFromLabel(label: string) {
  const lower = label.toLowerCase();
  return ELECTRICIAN_DISTRICTS.find((item) => lower.includes(item.name.toLowerCase()))?.name;
}

function geocodeAttempts(query: string) {
  const attempts: string[] = [];
  const add = (value: string) => {
    const next = value.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").replace(/^[,\s]+|[,\s]+$/g, "").trim();
    if (next.length < 4) return;
    if (attempts.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    attempts.push(next);
  };

  add(query);
  const landmark = query.match(
    /\b(?:opp\.?|opposite(?:\s+to)?|near(?:by)?|beside|besides|behind|next\s+to|in\s+front\s+of|adjacent\s+to)\b\s*\.?\s*([^,]+)/i,
  );
  const parts = query
    .split(",")
    .map((part) => part.replace(/\b(?:opp\.?|opposite(?:\s+to)?|near(?:by)?|beside|next\s+to)\b\s*\.?\s*/gi, " ").trim())
    .filter((part) => part.length > 2);
  const city = parts[parts.length - 1];
  if (landmark?.[1] && city) add(`${landmark[1].trim()}, ${city}`);
  if (parts.length >= 2) add(`${parts[0]}, ${city}`);
  if (city) add(city);
  const district = districtNameFromLabel(query);
  if (district) {
    add(`${district}, Telangana`);
    add(`${district}, Andhra Pradesh`);
    add(`${district}, India`);
  }
  return attempts;
}

async function searchPin(query: string) {
  const url = new URL("/api/location/search", window.location.origin);
  url.searchParams.set("q", query);
  const res = await fetch(url);
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ lat?: number; lng?: number; full?: string }>;
  const lat = Number(rows[0]?.lat);
  const lng = Number(rows[0]?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return null;
  return { lat, lng, label: rows[0]?.full?.trim() || query };
}

export async function geocodeVendorAddress(query: string) {
  const q = query.trim();
  if (q.length < 4) return null;
  for (const attempt of geocodeAttempts(q)) {
    const pin = await searchPin(attempt);
    if (pin) return pin;
  }
  return null;
}

export function detectExactVendorLocation() {
  return new Promise<ExactVendorLocation>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const place = await reverseGeocodeAddress(lat, lng);
          const label = place.full || [place.line1, place.line2].filter(Boolean).join(", ");
          resolve({
            lat,
            lng,
            label: label || "Current location",
            districtName: districtNameFromLabel(label),
          });
        } catch {
          reject(new Error("Could not detect location. Enter it or pick a district."));
        }
      },
      () => reject(new Error("Allow location access, or pick your district.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
