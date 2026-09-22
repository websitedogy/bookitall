import {
  formatExactAddress,
  mergeNominatim,
  type NominatimAddress,
  type StreetAddress,
} from "@/shared/lib/format-address";
import { googleReverseAddress } from "@/app/api/location/google";

export const dynamic = "force-dynamic";

type NominatimReverse = {
  display_name?: string;
  name?: string;
  addresstype?: string;
  address?: NominatimAddress & Record<string, string | undefined>;
  error?: string;
};

type BigDataAdmin = { name?: string; description?: string; adminLevel?: number; order?: number };
type BigDataReverse = {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  postcode?: string;
  localityInfo?: { administrative?: BigDataAdmin[] };
};

type OverpassElement = {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "BookItAll/1.0 (bookitallinfo@gmail.com)",
};

const AREA_TYPES = new Set([
  "suburb",
  "village",
  "hamlet",
  "town",
  "city",
  "county",
  "state",
  "neighbourhood",
  "neighborhood",
  "postcode",
  "road",
  "industrial",
  "municipality",
  "district",
  "quarter",
  "region",
  "country",
]);

function poiLabel(name?: string, area?: string) {
  if (!name?.trim() || name.trim().toLowerCase() === "yes") return undefined;
  const first = name.split(",")[0].trim();
  if (area && first.toLowerCase() === area.trim().toLowerCase()) return undefined;
  return first;
}

function areaOf(address?: NominatimAddress) {
  return address?.neighbourhood || address?.suburb || address?.hamlet || address?.village;
}

function fromNominatim(data: NominatimReverse): NominatimAddress | null {
  const address = data.address;
  if (!address) return null;
  const extra = address as Record<string, string | undefined>;
  const poiRaw =
    extra.amenity ||
    extra.shop ||
    extra.tourism ||
    extra.office ||
    extra.leisure ||
    extra.man_made ||
    extra.club ||
    extra.craft ||
    extra["addr:housename"] ||
    (address.building && address.building !== "yes" ? address.building : undefined) ||
    (data.addresstype && !AREA_TYPES.has(data.addresstype) ? data.name : undefined);
  return {
    ...address,
    house_number: address.house_number || extra["addr:housenumber"],
    house_name: poiLabel(poiRaw, areaOf(address)),
    formatted_address: data.display_name,
  };
}

async function reverseNominatimZoom(lat: number, lon: number, zoom: string): Promise<NominatimAddress | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat.toFixed(6));
  url.searchParams.set("lon", lon.toFixed(6));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("namedetails", "1");
  url.searchParams.set("zoom", zoom);
  url.searchParams.set("accept-language", "en");
  const response = await fetch(url, { headers: NOMINATIM_HEADERS, cache: "no-store" });
  if (!response.ok) return null;
  return fromNominatim((await response.json()) as NominatimReverse);
}

function fromBigData(data: BigDataReverse): NominatimAddress {
  const admins = [...(data.localityInfo?.administrative ?? [])].sort((a, b) => (b.adminLevel ?? 0) - (a.adminLevel ?? 0));
  const byLevel = (min: number, max: number) =>
    admins.find((row) => (row.adminLevel ?? 0) >= min && (row.adminLevel ?? 0) <= max)?.name;
  const village = byLevel(8, 10) || data.locality;
  const mandal = byLevel(6, 7);
  const district = byLevel(4, 5) || data.city;
  return {
    hamlet: village && village !== district ? village : undefined,
    village: village && village !== district ? village : undefined,
    county: mandal,
    state_district: district,
    city: data.city,
    state: data.principalSubdivision,
    postcode: data.postcode,
  };
}

async function reverseWithBigData(lat: number, lon: number): Promise<NominatimAddress | null> {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", lat.toFixed(6));
  url.searchParams.set("longitude", lon.toFixed(6));
  url.searchParams.set("localityLanguage", "en");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  return fromBigData((await response.json()) as BigDataReverse);
}

function metres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

function buildingNameOf(tags: Record<string, string>) {
  return tags["addr:housename"] || tags["building:name"] || (tags.building && tags.building !== "yes" ? tags.building : undefined) || tags.name;
}

function isBuildingFeature(tags: Record<string, string>) {
  return Boolean(tags.building || tags["addr:housename"] || tags["addr:housenumber"] || tags["building:name"]);
}

async function reverseOverpass(lat: number, lon: number): Promise<NominatimAddress | null> {
  const query = `[out:json][timeout:12];
(
  way(around:70,${lat},${lon})["building"]["name"];
  way(around:70,${lat},${lon})["building:name"];
  way(around:70,${lat},${lon})["addr:housename"];
  relation(around:70,${lat},${lon})["building"]["name"];
  node(around:50,${lat},${lon})["building"]["name"];
  node(around:40,${lat},${lon})["addr:housenumber"];
  way(around:40,${lat},${lon})["addr:housenumber"];
  node(around:20,${lat},${lon})["amenity"]["name"];
  node(around:20,${lat},${lon})["shop"]["name"];
  node(around:20,${lat},${lon})["office"]["name"];
);
out tags center 30;`;
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: `data=${encodeURIComponent(query)}`,
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { elements?: OverpassElement[] };
    const ranked = (data.elements ?? [])
      .map((el) => {
        const elLat = el.lat ?? el.center?.lat;
        const elLon = el.lon ?? el.center?.lon;
        if (elLat == null || elLon == null) return null;
        return { tags: el.tags ?? {}, dist: metres(lat, lon, elLat, elLon) };
      })
      .filter((row): row is { tags: Record<string, string>; dist: number } => Boolean(row))
      .sort((a, b) => a.dist - b.dist);
    const house = ranked.find((row) => row.tags["addr:housenumber"] && row.dist <= 40);
    const namedBuilding = ranked.find((row) => isBuildingFeature(row.tags) && buildingNameOf(row.tags) && row.dist <= 70);
    const namedPoi = ranked.find((row) => !isBuildingFeature(row.tags) && row.tags.name && row.dist <= 18);
    const named = namedBuilding || namedPoi;
    if (!house && !named) return null;
    return {
      house_number: house?.tags["addr:housenumber"] || house?.tags["addr:unit"] || house?.tags["addr:flats"],
      house_name: poiLabel(named ? buildingNameOf(named.tags) : undefined),
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return Response.json({ message: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const [google, villageZoom, streetZoom, buildingZoom, bigData, osmPin] = await Promise.all([
      googleReverseAddress(lat, lon),
      reverseNominatimZoom(lat, lon, "14"),
      reverseNominatimZoom(lat, lon, "18"),
      reverseNominatimZoom(lat, lon, "20"),
      reverseWithBigData(lat, lon),
      reverseOverpass(lat, lon),
    ]);
    const merged = mergeNominatim(
      google ?? {},
      mergeNominatim(
        buildingZoom ?? {},
        mergeNominatim(streetZoom ?? {}, mergeNominatim(osmPin ?? {}, mergeNominatim(villageZoom ?? {}, bigData ?? {}))),
      ),
    );
    if (!Object.keys(merged).length) {
      return Response.json({ message: "No address for this point" }, { status: 404 });
    }
    const place: StreetAddress = formatExactAddress(merged, merged.formatted_address);
    return Response.json(place);
  } catch {
    return Response.json({ message: "Could not resolve address" }, { status: 502 });
  }
}
