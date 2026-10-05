import { priceUnitWord } from "@/shared/lib/format";
import type { ListingDetailRow } from "./listing-tab-groups";

const MONEY_KEYS = new Set([
  "price",
  "priceFrom",
  "feeFrom",
  "entryPrice",
  "visitCharge",
  "perKm",
  "hourlyCharge",
  "fullDayCharge",
  "extraKmCharge",
  "waitingCharge",
  "nightCharge",
  "driverAllowance",
  "extraGuestCharge",
  "startingCharge",
]);

const SKIP_CHIP_KEYS = new Set([
  "description",
  "address",
  "location",
  "checkPolicy",
  "cancellation",
  "childPolicy",
  "notes",
  "jobDescription",
  "responsibilities",
  "workChargesNote",
  "additional",
]);

export type RoomRateRow = { name: string; rate: string; guests: string; rooms: string };
export type FareRow = { name: string; rate: string; seats: string; availability: string };
export type PricedRow = { name: string; price: string };
export type StoredList = { kind: "priced"; rows: PricedRow[] } | { kind: "lines"; lines: string[] };

export function parseRoomRates(value: string): RoomRateRow[] | null {
  const parts = splitParts(value);
  if (!parts.length) return null;
  const rows: RoomRateRow[] = [];
  for (const part of parts) {
    const match = part.match(/^(.+?):\s*(?:₹|Rs\.?|INR)?\s*([\d,]+)\s*\/\s*(\d+)\s*guests?\s*\/\s*(\d+)\s*rooms?$/i);
    if (!match) continue;
    rows.push({
      name: match[1].trim(),
      rate: match[2].replace(/,/g, ""),
      guests: match[3],
      rooms: match[4],
    });
  }
  return rows.length ? rows : null;
}

export function parseVehicleFares(value: string): FareRow[] | null {
  const parts = splitParts(value);
  if (!parts.length) return null;
  const rows: FareRow[] = [];
  for (const part of parts) {
    const match = part.match(/^(.+?):\s*₹?\s*([\d,]+)\s*\/\s*(\d+)\s*seats?\s*\/\s*(.+)$/i);
    if (!match) return null;
    rows.push({
      name: match[1].trim(),
      rate: match[2].replace(/,/g, ""),
      seats: match[3],
      availability: match[4].trim(),
    });
  }
  return rows;
}

export function parseStoredList(value: string): StoredList | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }
  const list = Array.isArray(parsed) ? parsed : [parsed];
  if (!list.length) return null;
  if (list.every((item) => typeof item === "string" && item.trim())) {
    return { kind: "lines", lines: list.map((item) => String(item).trim()) };
  }
  if (!list.every(isRecord)) return null;

  if (list.every((item) => namedPrice(item) && !("oneTimeAmount" in item) && !("monthlyAmount" in item))) {
    const rows = list
      .map((item) => namedPrice(item))
      .filter((row): row is PricedRow => Boolean(row));
    return rows.length ? { kind: "priced", rows } : null;
  }

  if (list.every((item) => "oneTimeAmount" in item || "monthlyAmount" in item)) {
    const lines = list.map(cleaningLine).filter(Boolean);
    return lines.length ? { kind: "lines", lines } : null;
  }

  if (list.every((item) => typeof item.state === "string" && Array.isArray(item.districts))) {
    const lines = list
      .map((item) => {
        const districts = (item.districts as unknown[]).map((part) => String(part).trim()).filter(Boolean);
        const state = String(item.state).trim();
        if (!districts.length || !state) return "";
        return `${districts.join(", ")} (${state})`;
      })
      .filter(Boolean);
    return lines.length ? { kind: "lines", lines } : null;
  }

  const lines = list.map(genericLine).filter(Boolean);
  return lines.length ? { kind: "lines", lines } : null;
}

export function parsePricedItems(value: string): PricedRow[] | null {
  const parts = splitParts(value);
  if (parts.length < 2) return null;
  const rows: PricedRow[] = [];
  for (const part of parts) {
    const match = part.match(/^(.+?)\s+₹\s*([\d,]+)$/);
    if (!match) return null;
    rows.push({ name: match[1].trim(), price: match[2].replace(/,/g, "") });
  }
  return rows;
}

export function chipItems(row: ListingDetailRow): string[] | null {
  if (SKIP_CHIP_KEYS.has(row.key) || row.key === "roomRates" || row.key === "vehicleFares") return null;
  if (parseStoredList(row.value)) return null;
  const parts = row.value
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  if (parts.some((part) => part.length > 36 || /₹/.test(part))) return null;
  return parts;
}

export function formatDetailValue(row: ListingDetailRow): string {
  const raw = row.value.trim();
  const stored = parseStoredList(raw);
  if (stored?.kind === "priced") return stored.rows.map((item) => `${item.name} ${inrAmount(item.price)}`).join("\n");
  if (stored?.kind === "lines") return stored.lines.join("\n");
  if (row.key === "priceUnit") {
    const word = priceUnitWord(raw);
    return word ? `Per ${word}` : titleEnum(raw);
  }
  if (/^(booking24x7|emergency|pickupAvailable|dropAvailable|ownerSame|hostOnProperty)$/.test(row.key)) {
    if (/^(yes|true|1)$/i.test(raw)) return "Yes";
    if (/^(no|false|0)$/i.test(raw)) return "No";
  }
  if (MONEY_KEYS.has(row.key) && /^\d[\d,]*$/.test(raw)) {
    return inrAmount(raw);
  }
  if (/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(raw)) return titleEnum(raw);
  return raw;
}

export function inrAmount(value: string) {
  const amount = Number(String(value).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(amount)) return value;
  return `₹${amount.toLocaleString("en-IN")}`;
}

const HIDDEN_PLACE_KEYS = new Set([
  "area",
  "city",
  "state",
  "district",
  "mandals",
  "mandal",
  "street",
  "coverage",
  "coverageType",
  "serviceArea",
  "serviceKm",
]);

const HIDDEN_PLACE_LABELS = new Set([
  "area",
  "city",
  "state",
  "district",
  "mandal",
  "mandals",
  "street",
  "coverage",
  "service coverage",
  "service area",
]);

export function prepareDetailRows(categoryId: string, rows: ListingDetailRow[]): ListingDetailRow[] {
  const hasHotelName = rows.some((row) => row.key === "hotelName" && row.value.trim());
  return rows
    .filter((row) => {
      if (HIDDEN_PLACE_KEYS.has(row.key) || HIDDEN_PLACE_LABELS.has(row.label.trim().toLowerCase())) return false;
      if ((categoryId === "hotels" || categoryId === "homestay") && row.key === "shopName" && hasHotelName) return false;
      return true;
    })
    .map((row) => {
      if (categoryId === "hotels" && (row.key === "hotelName" || row.key === "shopName")) {
        return { ...row, label: "Hotel name" };
      }
      if (categoryId === "homestay" && (row.key === "hotelName" || row.key === "shopName")) {
        return { ...row, label: "Homestay name" };
      }
      return row;
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function namedPrice(item: Record<string, unknown>): PricedRow | null {
  const name = textOf(item.name);
  const price = textOf(item.amount ?? item.price);
  if (!name || !price) return null;
  return { name, price };
}

function cleaningLine(item: Record<string, unknown>) {
  const name = textOf(item.name);
  const bits: string[] = [];
  if (item.oneTime && textOf(item.oneTimeAmount)) bits.push(`One-time ${inrAmount(textOf(item.oneTimeAmount))} / work`);
  if (item.monthly && textOf(item.monthlyAmount)) bits.push(`Monthly ${inrAmount(textOf(item.monthlyAmount))} / month`);
  if (!name && !bits.length) return "";
  return bits.length ? `${name} — ${bits.join(", ")}` : name;
}

function genericLine(item: Record<string, unknown>) {
  const name = textOf(item.name ?? item.title);
  const rest = Object.entries(item)
    .filter(([key, value]) => !["name", "title", "selected", "locked"].includes(key) && value != null && value !== "" && value !== false)
    .map(([key, value]) => `${labelize(key)}: ${textOf(value) || (Array.isArray(value) ? value.map((part) => String(part)).join(", ") : String(value))}`);
  if (name && rest.length) return `${name} — ${rest.join(", ")}`;
  return name || rest.join(", ");
}

function textOf(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function labelize(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function splitParts(value: string) {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function titleEnum(raw: string) {
  return raw
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
