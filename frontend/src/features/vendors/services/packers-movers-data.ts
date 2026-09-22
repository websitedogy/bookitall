import { CITIES_BY_STATE } from "@/shared/lib/india-places";
import { ELECTRICIAN_DISTRICTS } from "./electrician-form-data";

export const PACKERS_SERVICE_TYPES = [
  { id: "home-shifting", name: "Home Shifting", emoji: "🏠" },
  { id: "office-shifting", name: "Office Shifting", emoji: "🏢" },
  { id: "local-shifting", name: "Local Shifting", emoji: "🚚" },
  { id: "long-distance-shifting", name: "Long-Distance Shifting", emoji: "🛣️" },
  { id: "other", name: "Other", emoji: "📦" },
] as const;

export type PackersServiceTypeId = (typeof PACKERS_SERVICE_TYPES)[number]["id"];

export type PackersLocation = { state: string; districts: string[] };

export function emptyPackersLocation(): PackersLocation {
  return { state: "", districts: [] };
}

export function packersServiceById(id: string | undefined | null) {
  if (!id) return null;
  const wanted = id.trim().toLowerCase();
  return (
    PACKERS_SERVICE_TYPES.find(
      (item) => item.id === wanted || item.name.toLowerCase() === wanted || item.name.toLowerCase().replace(/\s+/g, "-") === wanted,
    ) ?? null
  );
}

export function packersServiceHref(base: string, typeId: string) {
  const url = new URL(base, "https://bookitall.local");
  url.searchParams.set("type", typeId);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export function packersStates() {
  const fromDistricts = [...new Set(ELECTRICIAN_DISTRICTS.map((item) => item.state))];
  const extra = Object.keys(CITIES_BY_STATE).filter((state) => !fromDistricts.includes(state));
  return [...fromDistricts, ...extra.sort((a, b) => a.localeCompare(b))];
}

export function packersDistricts(state: string) {
  if (!state) return [];
  const official = ELECTRICIAN_DISTRICTS.filter((item) => item.state === state).map((item) => item.name);
  if (official.length) return official;
  return CITIES_BY_STATE[state] ?? [];
}

export function formatPackersLocations(locations: PackersLocation[]) {
  return locations
    .filter((item) => item.state && item.districts.length)
    .map((item) => `${item.districts.join(", ")} (${item.state})`)
    .join(" · ");
}

export function matchesPackersType(stored: string | undefined, wantedId: string) {
  const wanted = packersServiceById(wantedId);
  if (!wanted) return true;
  const parts = (stored || "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  if (wanted.id === "other") {
    return parts.some((part) => {
      const slug = part.replace(/\s+/g, "-");
      return part === "other" || !PACKERS_SERVICE_TYPES.some((item) => item.id !== "other" && (item.name.toLowerCase() === part || item.id === slug));
    });
  }
  return parts.some((part) => part === wanted.name.toLowerCase() || part === wanted.id || part.replace(/\s+/g, "-") === wanted.id);
}
