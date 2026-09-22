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

  if (googleMapsKey()) {
    const google = await googleSearchPlaces(q);
    if (google.length) return Response.json(google);
  }

  const queries = [q];
  if (!/telangana|india/i.test(q)) queries.push(`${q} village Telangana`);

  const rows = (await Promise.all(queries.map(nominatimSearch))).flat();
  const seen = new Set<string>();
  const results: LocationSearchResult[] = [];

  for (const row of rows.sort((a, b) => score(b) - score(a))) {
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !row.address) continue;
    const place = formatExactAddress(row.address, row.display_name);
    const key = `${place.full}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ ...place, lat, lng });
    if (results.length >= 8) break;
  }

  return Response.json(results);
}
