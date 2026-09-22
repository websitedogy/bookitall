export const PUBLIC_TRANSPORT_TYPES = [
  { id: "auto", name: "Auto" },
  { id: "car", name: "Car" },
  { id: "mini-bus", name: "Mini Bus" },
  { id: "bus", name: "Bus" },
  { id: "van", name: "Van" },
] as const;

export type PublicTransportTypeId = (typeof PUBLIC_TRANSPORT_TYPES)[number]["id"];

export const PUBLIC_TRANSPORT_SERVICES = ["Local", "Outstation"] as const;

export const DEFAULT_SEATS: Record<PublicTransportTypeId, string> = {
  auto: "3",
  car: "4",
  "mini-bus": "12",
  bus: "40",
  van: "7",
};

export function publicTransportTypeById(id: string | undefined | null) {
  if (!id) return null;
  const normalized = id.trim().toLowerCase();
  return PUBLIC_TRANSPORT_TYPES.find((item) => item.id === normalized || item.name.toLowerCase() === normalized) ?? null;
}

export function publicTransportTypeHref(base: string, typeId: string) {
  const url = new URL(base, "https://bookitall.local");
  url.searchParams.set("type", typeId);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

const currentYear = new Date().getFullYear();
export const MANUFACTURING_YEARS = Array.from({ length: currentYear - 1994 }, (_, index) => String(currentYear - index));
