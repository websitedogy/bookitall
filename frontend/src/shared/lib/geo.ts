import type { StreetAddress } from "@/shared/lib/format-address";

export const LIVE_LOCATION_KEY = "bookitall-live-location";

export type SavedLocation = StreetAddress & {
  lat?: number;
  lng?: number;
  source?: "search" | "city" | "gps";
};

export function readSavedLocation(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LIVE_LOCATION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedLocation | string;
    if (typeof parsed === "string") return { line1: parsed, line2: "", full: parsed, source: "city" };
    if (!parsed?.line1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSavedLocation(place: SavedLocation) {
  window.localStorage.setItem(LIVE_LOCATION_KEY, JSON.stringify(place));
}

export const RECENT_LOCATIONS_KEY = "bookitall-recent-locations";

function locationKey(place: SavedLocation) {
  return (place.full || place.line1).trim().toLowerCase();
}

export function readRecentLocations(): SavedLocation[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(RECENT_LOCATIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedLocation[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((place) => place?.line1).slice(0, 6);
  } catch {
    return [];
  }
}

export function rememberRecentLocation(place: SavedLocation) {
  if (typeof window === "undefined" || !place.line1) return;
  const key = locationKey(place);
  const next = [place, ...readRecentLocations().filter((item) => locationKey(item) !== key)].slice(0, 6);
  window.localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(next));
}

export function getQuickPosition(timeoutMs = 5000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, (firstError) => {
      navigator.geolocation.getCurrentPosition(resolve, () => reject(firstError), {
        enableHighAccuracy: true,
        timeout: Math.min(4000, timeoutMs),
        maximumAge: 30_000,
      });
    }, {
      enableHighAccuracy: false,
      timeout: timeoutMs,
      maximumAge: 60_000,
    });
  });
}

export function getExactPosition(timeoutMs = 15000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    let best: GeolocationPosition | null = null;
    let settled = false;

    const finish = (value: GeolocationPosition | null, error?: GeolocationPositionError | Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      navigator.geolocation.clearWatch(watchId);
      if (value) resolve(value);
      else reject(error ?? new Error("Could not read GPS"));
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= 20) finish(pos);
      },
      (error) => finish(best, error),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );

    const timer = window.setTimeout(() => {
      if (best) {
        finish(best);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => finish(pos),
        (error) => finish(null, error),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
      );
    }, timeoutMs);
  });
}

export async function reverseGeocodeAddress(lat: number, lon: number): Promise<StreetAddress> {
  const url = new URL("/api/location/reverse", window.location.origin);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  const response = await fetch(url);
  if (!response.ok) throw new Error("geocode failed");
  const data = (await response.json()) as StreetAddress;
  if (!data.line1) throw new Error("empty address");
  return data;
}

export async function locateExactPlace(lat: number, lng: number): Promise<StreetAddress> {
  const place = await reverseGeocodeAddress(lat, lng);
  if (!place?.line1) throw new Error("empty address");
  return place;
}
