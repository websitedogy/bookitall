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

export async function geocodeVendorAddress(query: string) {
  const q = query.trim();
  if (q.length < 4) return null;
  const url = new URL("/api/location/search", window.location.origin);
  url.searchParams.set("q", q);
  const res = await fetch(url);
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ lat?: number; lng?: number }>;
  const lat = Number(rows[0]?.lat);
  const lng = Number(rows[0]?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return null;
  return { lat, lng };
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
