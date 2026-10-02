import { formatExactAddress, type NominatimAddress, type StreetAddress } from "@/shared/lib/format-address";
import { googleMapsKey, googleSearchPlaces } from "@/app/api/location/google";

export const dynamic = "force-dynamic";

type SearchHit = {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
  class?: string;
  type?: string;
};

export type LocationSearchResult = StreetAddress & { lat: number; lng: number };

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "BookItAll/1.0 (bookitallinfo@gmail.com)",
};

async function nominatimSearch(q: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("limit", "8");
  url.searchParams.set("accept-language", "en");
  const response = await fetch(url, { headers: NOMINATIM_HEADERS, cache: "no-store" });
  if (!response.ok) return [] as SearchHit[];
  return (await response.json()) as SearchHit[];
}

function addressAttempts(q: string) {
  const attempts: string[] = [];
  const add = (value: string) => {
    const next = value
      .replace(/\s+/g, " ")
      .replace(/\s*,\s*/g, ", ")
      .replace(/(?:,\s*){2,}/g, ", ")
      .replace(/^[,\s]+|[,\s]+$/g, "")
      .trim();
    if (next.length < 2) return;
    if (attempts.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    attempts.push(next);
  };

  const landmark = q.match(
    /\b(?:opp\.?|opposite(?:\s+to)?|near(?:by)?|beside|besides|behind|next\s+to|in\s+front\s+of|adjacent\s+to)\b\s*\.?\s*([^,]+)/i,
  );
  const stripped = q.replace(
    /\b(?:opp\.?|opposite(?:\s+to)?|near(?:by)?|beside|besides|behind|next\s+to|in\s+front\s+of|adjacent\s+to)\b[^,]*/gi,
    " ",
  );
  const parts = stripped
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 2);
  const tail = parts[parts.length - 1];
  add(stripped);
  if (parts.length >= 2 && tail) add(`${parts[0]}, ${tail}`);
  add(q);
  if (landmark?.[1] && tail) add(`${landmark[1].trim()}, ${tail}`);
  if (tail) add(tail);
  return attempts.slice(0, 5);
}

function score(row: SearchHit) {
  const address = row.address ?? {};
  let n = 0;
  if (address.hamlet || address.village) n += 8;
  if (address.county || address.municipality) n += 3;
  if (address.state_district) n += 2;
  if (row.type === "village" || row.type === "hamlet" || row.class === "place") n += 6;
  if (address.town || address.city) n += 1;
  return n;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json([]);

  const attempts = addressAttempts(q);
  let rows: SearchHit[] = [];

  for (const attempt of attempts) {
    if (googleMapsKey()) {
      const google = await googleSearchPlaces(attempt);
      if (google.length) return Response.json(google);
    }
    rows = await nominatimSearch(attempt);
    if (!rows.length && !attempt.includes(",") && !/telangana|andhra|india/i.test(attempt)) {
      rows = await nominatimSearch(`${attempt} Telangana`);
    }
    if (rows.length) break;
  }
  const seen = new Set<string>();
  const results: LocationSearchResult[] = [];

  for (const row of rows.sort((a, b) => score(b) - score(a))) {
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const place = row.address
      ? formatExactAddress(row.address, row.display_name)
      : { line1: row.display_name || q, line2: "", full: row.display_name || q };
    const key = `${place.full}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ ...place, lat, lng });
    if (results.length >= 8) break;
  }

  return Response.json(results);
}
