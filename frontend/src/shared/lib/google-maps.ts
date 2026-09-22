import { formatExactAddress, type StreetAddress } from "@/shared/lib/format-address";
import { mergeGoogleResults, placeFromGoogle, type GoogleComponent } from "@/shared/lib/google-address";

export type GoogleLocatedPlace = StreetAddress & { lat: number; lng: number };

const SCRIPT_ID = "bookitall-google-maps";

type MapsWindow = Window & {
  google?: {
    maps?: {
      Geocoder: new () => {
        geocode: (
          req: { location?: { lat: number; lng: number }; region?: string },
          cb: (results: GoogleMapsResult[] | null, status: string) => void,
        ) => void;
      };
      places?: {
        AutocompleteService: new () => {
          getPlacePredictions: (
            req: { input: string; componentRestrictions?: { country: string }; types?: string[] },
            cb: (predictions: Array<{ place_id: string; description: string }> | null, status: string) => void,
          ) => void;
        };
        PlacesService: new (el: HTMLElement) => {
          getDetails: (
            req: { placeId: string; fields: string[] },
            cb: (place: GooglePlaceDetails | null, status: string) => void,
          ) => void;
        };
      };
    };
  };
};

type GoogleMapsResult = {
  formatted_address?: string;
  types?: string[];
  address_components?: GoogleComponent[];
};

type GooglePlaceDetails = GoogleMapsResult & {
  geometry?: { location?: { lat: () => number; lng: () => number } };
};

export function googleBrowserKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
}

export function loadGoogleMaps() {
  const key = googleBrowserKey();
  if (!key) return Promise.resolve(null);
  const existing = (window as MapsWindow).google?.maps;
  if (existing?.places) return Promise.resolve(existing);

  return new Promise<NonNullable<MapsWindow["google"]>["maps"] | null>((resolve, reject) => {
    const ready = () => resolve((window as MapsWindow).google?.maps ?? null);
    const current = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (current) {
      current.addEventListener("load", () => ready(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly&region=IN&language=en`;
    script.onload = () => ready();
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });
}

export async function googleMapsReverse(lat: number, lng: number): Promise<StreetAddress | null> {
  const maps = await loadGoogleMaps();
  if (!maps) return null;
  return new Promise((resolve) => {
    const geocoder = new maps.Geocoder();
    geocoder.geocode({ location: { lat, lng }, region: "IN" }, (results, status) => {
      if (status !== "OK" || !results?.[0]) {
        resolve(null);
        return;
      }
      resolve(formatExactAddress(mergeGoogleResults(results), results[0].formatted_address));
    });
  });
}

export async function googleMapsSearch(query: string): Promise<GoogleLocatedPlace[]> {
  const maps = await loadGoogleMaps();
  const placesApi = maps?.places;
  if (!placesApi) return [];
  const predictions = await new Promise<Array<{ place_id: string; description: string }>>((resolve) => {
    const service = new placesApi.AutocompleteService();
    service.getPlacePredictions(
      { input: query, componentRestrictions: { country: "in" }, types: ["address"] },
      (rows, status) => resolve(status === "OK" && rows ? rows.slice(0, 6) : []),
    );
  });
  const host = document.createElement("div");
  const places = new placesApi.PlacesService(host);
  const details = await Promise.all(
    predictions.map(
      (row) =>
        new Promise<GoogleLocatedPlace | null>((resolve) => {
          places.getDetails({ placeId: row.place_id, fields: ["address_component", "formatted_address", "geometry"] }, (place, status) => {
            const lat = place?.geometry?.location?.lat();
            const lng = place?.geometry?.location?.lng();
            if (status !== "OK" || lat == null || lng == null || !place) {
              resolve(null);
              return;
            }
            resolve({ ...placeFromGoogle(place, row.description), lat, lng });
          });
        }),
    ),
  );
  return details.filter((row): row is GoogleLocatedPlace => Boolean(row));
}
