import { formatExactAddress, type NominatimAddress, type StreetAddress } from "@/shared/lib/format-address";
import { addressFromGoogle, mergeGoogleResults, type GoogleAddressResult, type GoogleComponent } from "@/shared/lib/google-address";

export type LocatedPlace = StreetAddress & { lat: number; lng: number };

type GoogleResult = GoogleAddressResult & {
  geometry?: { location?: { lat: number; lng: number } };
};
type GoogleGeocode = { status: string; results?: GoogleResult[] };
type PlacePrediction = { place_id: string; description: string };
type PlaceAutocomplete = { status: string; predictions?: PlacePrediction[] };
type PlaceDetails = {
  status: string;
  result?: { address_components?: GoogleComponent[]; formatted_address?: string; geometry?: { location?: { lat: number; lng: number } } };
};
type NearbySearch = { status: string; results?: Array<{ name?: string; types?: string[]; vicinity?: string; geometry?: { location?: { lat: number; lng: number } } }> };

export function googleMapsKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GOOGLE_GEOCODING_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

async function geocode(params: Record<string, string>): Promise<GoogleResult[]> {
  const key = googleMapsKey();
  if (!key) return [];
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("key", key);
  url.searchParams.set("language", "en");
  url.searchParams.set("region", "in");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];
  const data = (await response.json()) as GoogleGeocode;
  return data.status === "OK" ? (data.results ?? []) : [];
}

export async function googleReverseAddress(lat: number, lon: number): Promise<NominatimAddress | null> {
  if (!googleMapsKey()) return null;
  const pin = `${lat},${lon}`;
  const [rooftop, street, political, nearby, all] = await Promise.all([
    geocode({
      latlng: pin,
      location_type: "ROOFTOP",
      result_type: "street_address|premise|subpremise",
    }),
    geocode({
      latlng: pin,
      result_type: "street_address|premise|subpremise|route",
    }),
    geocode({
      latlng: pin,
      result_type: "premise|sublocality|sublocality_level_1|locality|administrative_area_level_3|political",
    }),
    googleNearbyPlace(lat, lon),
    geocode({ latlng: pin }),
  ]);
  const full = [...(rooftop ?? []), ...(street ?? []), ...(all ?? []), ...(political ?? [])];
  const best = mergeGoogleResults(full);
  const formatted =
    full.find((row) => row.types?.some((type) => ["street_address", "premise", "subpremise"].includes(type)))
      ?.formatted_address || full[0]?.formatted_address;
  const areaName = (best.neighbourhood || best.hamlet || best.village || best.city || "").toLowerCase();
  const nearbyName = nearby?.house_name?.trim();
  const nearbyIsArea = Boolean(nearbyName && areaName && nearbyName.toLowerCase() === areaName);
  return {
    ...best,
    formatted_address: formatted || best.formatted_address,
    house_name: (!nearbyIsArea && nearbyName) || best.house_name,
    house_number: best.house_number || nearby?.house_number,
    neighbourhood: best.neighbourhood || nearby?.neighbourhood,
    hamlet: best.hamlet || nearby?.hamlet,
    village: best.village || nearby?.village,
    county: best.county || nearby?.county,
  };
}

async function googleNearbyPlace(lat: number, lon: number): Promise<NominatimAddress | null> {
  const key = googleMapsKey();
  if (!key) return null;
  const hits = await Promise.all([
    nearbySearch(lat, lon, "premise", true),
    nearbySearch(lat, lon, "subpremise", true),
    nearbySearch(lat, lon, "point_of_interest", true),
    nearbySearch(lat, lon, "establishment", true),
  ]);
  const first = hits.find((row) => {
    if (!row?.name?.trim()) return false;
    const types = (row.types ?? []).join(",");
    return !/political|locality|sublocality|route|plus_code|administrative/i.test(types);
  });
  if (!first?.name) return null;
  return {
    house_name: first.name,
    neighbourhood: first.vicinity?.split(",")[0],
    hamlet: first.vicinity?.split(",")[0],
  };
}

async function nearbySearch(lat: number, lon: number, type: string, rankByDistance = false) {
  const key = googleMapsKey();
  if (!key) return null;
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lon}`);
  if (rankByDistance) url.searchParams.set("rankby", "distance");
  else url.searchParams.set("radius", type === "premise" ? "50" : "80");
  url.searchParams.set("type", type);
  url.searchParams.set("key", key);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as NearbySearch;
  return data.results?.[0] ?? null;
}

export async function googleSearchPlaces(query: string): Promise<LocatedPlace[]> {
  const key = googleMapsKey();
  if (!key) return [];

  const autoUrl = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  autoUrl.searchParams.set("input", query);
  autoUrl.searchParams.set("components", "country:in");
  autoUrl.searchParams.set("types", "address");
  autoUrl.searchParams.set("language", "en");
  autoUrl.searchParams.set("key", key);
  const autoRes = await fetch(autoUrl, { cache: "no-store" });
  if (!autoRes.ok) return [];
  const autoJson = (await autoRes.json()) as PlaceAutocomplete;
  const predictions = (autoJson.predictions ?? []).slice(0, 6);

  const details = await Promise.all(
    predictions.map(async (row) => {
      const detailUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      detailUrl.searchParams.set("place_id", row.place_id);
      detailUrl.searchParams.set("fields", "address_component,formatted_address,geometry");
      detailUrl.searchParams.set("language", "en");
      detailUrl.searchParams.set("key", key);
      const detailRes = await fetch(detailUrl, { cache: "no-store" });
      if (!detailRes.ok) return null;
      const detailJson = (await detailRes.json()) as PlaceDetails;
      const result = detailJson.result;
      const lat = result?.geometry?.location?.lat;
      const lng = result?.geometry?.location?.lng;
      if (lat == null || lng == null || !result) return null;
      return {
        ...formatExactAddress(addressFromGoogle(result), result.formatted_address ?? row.description),
        lat,
        lng,
      };
    }),
  );

  return details.filter((row): row is LocatedPlace => Boolean(row));
}
