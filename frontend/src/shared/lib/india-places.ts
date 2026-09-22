export type Place = {
  label: string;
  area: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
};

export function placeLabel(place: Place) {
  return [place.area !== place.city ? place.area : null, place.city, place.state].filter(Boolean).join(", ");
}

const STATE_COORDS: Record<string, [number, number]> = {
  "Andhra Pradesh": [16.5062, 80.648],
  Telangana: [17.385, 78.4867],
  Karnataka: [12.9716, 77.5946],
  "Tamil Nadu": [13.0827, 80.2707],
  Kerala: [9.9312, 76.2673],
  Maharashtra: [19.076, 72.8777],
  Delhi: [28.6139, 77.209],
  Gujarat: [23.0225, 72.5714],
  Rajasthan: [26.9124, 75.7873],
  "West Bengal": [22.5726, 88.3639],
  "Uttar Pradesh": [26.8467, 80.9462],
  "Madhya Pradesh": [23.2599, 77.4126],
};

const CITY_COORDS: Record<string, [number, number]> = {
  Hyderabad: [17.385, 78.4867],
  Rajahmundry: [16.9891, 81.7821],
  Visakhapatnam: [17.6868, 83.2185],
  Vijayawada: [16.5062, 80.648],
  Guntur: [16.3067, 80.4365],
  Tirupati: [13.6288, 79.4192],
  Warangal: [17.9689, 79.5941],
  Khammam: [17.2473, 80.1514],
  Bengaluru: [12.9716, 77.5946],
  Mysuru: [12.2958, 76.6394],
  Chennai: [13.0827, 80.2707],
  Coimbatore: [11.0168, 76.9558],
  Mumbai: [19.076, 72.8777],
  Pune: [18.5204, 73.8567],
  Kolkata: [22.5726, 88.3639],
  "New Delhi": [28.6139, 77.209],
  Ahmedabad: [23.0225, 72.5714],
  Jaipur: [26.9124, 75.7873],
  Lucknow: [26.8467, 80.9462],
  Kochi: [9.9312, 76.2673],
  Goa: [15.4909, 73.8278],
  Panaji: [15.4909, 73.8278],
  Indore: [22.7196, 75.8577],
  Bhopal: [23.2599, 77.4126],
  Chandigarh: [30.7333, 76.7794],
  Gurugram: [28.4595, 77.0266],
};

export const CITIES_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Rajahmundry", "Kakinada", "Tirupati", "Nellore", "Kurnool"],
  Telangana: ["Hyderabad", "Warangal", "Khammam", "Nizamabad", "Karimnagar"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
  Rajasthan: ["Jaipur", "Udaipur", "Jodhpur"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Varanasi", "Agra"],
  "Madhya Pradesh": ["Bhopal", "Indore"],
  Goa: ["Panaji", "Margao"],
  Punjab: ["Amritsar", "Ludhiana", "Chandigarh"],
  Haryana: ["Gurugram", "Faridabad"],
  Odisha: ["Bhubaneswar", "Cuttack"],
  Bihar: ["Patna"],
};

export function coordsFor(city: string, state = ""): [number, number] | undefined {
  return CITY_COORDS[city] ?? STATE_COORDS[state];
}

export function makeCityPlace(city: string, state: string): Place {
  const coords = coordsFor(city, state);
  return {
    label: city,
    area: city,
    city,
    state,
    latitude: coords?.[0],
    longitude: coords?.[1],
  };
}

export function searchPlaces(query: string): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches: Place[] = [];
  for (const [state, cities] of Object.entries(CITIES_BY_STATE)) {
    for (const city of cities) {
      if (`${city} ${state}`.toLowerCase().includes(q)) {
        matches.push(makeCityPlace(city, state));
      }
    }
  }
  return matches.slice(0, 16);
}

export async function reverseGeocode(lat: number, lng: number): Promise<Place | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat.toFixed(6));
  url.searchParams.set("lon", lng.toFixed(6));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("accept-language", "en");
  const res = await fetch(url.toString(), { headers: { "User-Agent": "BookItAll/1.0" } });
  if (!res.ok) return null;
  const json = (await res.json()) as { address?: Record<string, string> };
  const address = json.address;
  if (!address) return null;
  const pick = (...keys: string[]) => keys.map((key) => address[key]).find((value) => value?.trim());
  const area = pick("neighbourhood", "suburb", "quarter", "residential", "city_district") ?? "";
  const city = pick("city", "town", "village", "county") ?? "Current location";
  const state = pick("state") ?? "";
  return {
    label: area ? `${area}, ${city}` : city,
    area: area || city,
    city,
    state,
    latitude: lat,
    longitude: lng,
  };
}
