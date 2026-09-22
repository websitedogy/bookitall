import { formatExactAddress, parsePinFromFormatted, type NominatimAddress, type StreetAddress } from "@/shared/lib/format-address";

export type GoogleComponent = { long_name: string; types: string[] };
export type GoogleAddressResult = {
  formatted_address?: string;
  types?: string[];
  address_components?: GoogleComponent[];
};

export function addressFromGoogle(result: GoogleAddressResult): NominatimAddress {
  const components = result.address_components ?? [];
  const pick = (...types: string[]) => components.find((row) => types.some((type) => row.types.includes(type)))?.long_name;
  const parsed = parsePinFromFormatted(result.formatted_address);
  const rawHouse = pick("street_number") || pick("subpremise") || parsed.houseNumber;
  const houseNumber = rawHouse && !/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}$/i.test(rawHouse.trim()) ? rawHouse : parsed.houseNumber;
  const buildingRaw = pick("premise", "establishment", "point_of_interest") || parsed.buildingName;
  const building = buildingRaw && houseNumber && buildingRaw.trim().toLowerCase() === houseNumber.trim().toLowerCase() ? undefined : buildingRaw;
  const colony = pick("sublocality_level_2", "sublocality_level_3", "sublocality_level_1", "sublocality", "neighborhood", "hamlet");
  const locality = pick("locality");
  const mandal = pick("administrative_area_level_3");
  const district = pick("administrative_area_level_2");
  const road = pick("route");
  const localityIsDistrict = Boolean(locality && district && locality.toLowerCase() === district.toLowerCase());
  const area = colony || (!localityIsDistrict ? locality : undefined) || road;
  return {
    house_number: houseNumber,
    house_name: building,
    road,
    hamlet: area,
    village: area,
    neighbourhood: colony,
    suburb: colony,
    town: localityIsDistrict ? undefined : locality,
    city: locality,
    county: mandal,
    state_district: district || (localityIsDistrict ? locality : undefined),
    state: pick("administrative_area_level_1"),
    postcode: pick("postal_code"),
  };
}

export function mergeGoogleResults(results: GoogleAddressResult[]): NominatimAddress {
  const rank = (types?: string[]) => {
    if (types?.includes("street_address")) return 0;
    if (types?.includes("premise") || types?.includes("subpremise")) return 1;
    if (types?.includes("route")) return 2;
    if (types?.includes("plus_code")) return 8;
    return 5;
  };
  return [...results]
    .sort((a, b) => rank(a.types) - rank(b.types))
    .reduce<NominatimAddress>((merged, row) => {
      const part = addressFromGoogle(row);
      const precise = row.types?.some((type) => ["street_address", "premise", "subpremise"].includes(type));
      return {
        house_name: merged.house_name || part.house_name,
        house_number: merged.house_number || part.house_number,
        formatted_address:
          (precise ? row.formatted_address : undefined) ||
          merged.formatted_address ||
          (row.types?.includes("plus_code") ? undefined : row.formatted_address),
        road: merged.road || part.road,
        neighbourhood: merged.neighbourhood || part.neighbourhood,
        suburb: merged.suburb || part.suburb,
        hamlet: merged.hamlet || part.hamlet,
        village: merged.village || part.village,
        town: merged.town || part.town,
        city: merged.city || part.city,
        county: merged.county || part.county,
        state_district: merged.state_district || part.state_district,
        state: merged.state || part.state,
        postcode: merged.postcode || part.postcode,
      };
    }, {});
}

export function placeFromGoogle(result: GoogleAddressResult, fallback = ""): StreetAddress {
  return formatExactAddress(addressFromGoogle(result), result.formatted_address || fallback);
}
