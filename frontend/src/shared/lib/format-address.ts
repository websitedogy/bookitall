export type StreetAddress = {
  line1: string;
  line2: string;
  full: string;
  houseNumber?: string;
  buildingName?: string;
};

export type NominatimAddress = {
  house_number?: string;
  house_name?: string;
  formatted_address?: string;
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  residential?: string;
  city_district?: string;
  village?: string;
  hamlet?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
};

function fold(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ");
}

function pinKey(value: string) {
  return fold(value)
    .replace(/^(?:h\.?\s*no\.?|house\s*(?:no\.?|number)?|plot\s*(?:no\.?)?|flat\s*(?:no\.?)?|door\s*(?:no\.?)?|shop\s*(?:no\.?)?)\s*/i, "")
    .replace(/[\s./-]+/g, "-")
    .replace(/^-|-$/g, "");
}

function unique(parts: Array<string | undefined>) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const value = part?.trim();
    if (!value) continue;
    const key = fold(value);
    const door = pinKey(value);
    if (seen.has(key) || (door && seen.has(`pin:${door}`))) continue;
    seen.add(key);
    if (door) seen.add(`pin:${door}`);
    out.push(value);
  }
  return out;
}

function same(a?: string, b?: string) {
  return Boolean(a && b && fold(a) === fold(b));
}

function samePin(a?: string, b?: string) {
  return Boolean(a && b && pinKey(a) && pinKey(a) === pinKey(b));
}

function isPlusCode(value: string) {
  return /^[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}\b/i.test(value.trim());
}

function stripPlusCodes(value?: string) {
  if (!value?.trim()) return "";
  return unique(
    value
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part && part.toLowerCase() !== "india" && !isPlusCode(part)),
  ).join(", ");
}

function cleanFormatted(value?: string) {
  return stripPlusCodes(value);
}

function isHouseToken(value: string) {
  const v = value.trim();
  if (!v || v.length > 28 || isPlusCode(v)) return false;
  if (/^(?:h\.?\s*no\.?|house\s*(?:no\.?|number)?|plot\s*(?:no\.?)?|flat\s*(?:no\.?)?|door\s*(?:no\.?)?|shop\s*(?:no\.?)?)\s*/i.test(v)) {
    return /\d/.test(v);
  }
  return /^\d{1,4}([-./][\w]+){0,5}$/.test(v);
}

function isBuildingToken(value: string) {
  const v = value.trim();
  if (v.length < 3 || v.length > 48) return false;
  if (isHouseToken(v) || isPlusCode(v) || /^\d{6}$/.test(v)) return false;
  if (
    /\b(mandal|district|tehsil|tahsil|state|nagar panchayat|municipality|urban|rural|highway|road|rd\.?|street|cross|colony|layout|phase|nagar)\b/i.test(
      v,
    )
  ) {
    return false;
  }
  if (/\b(residency|apartments?|complex|towers?|heights|enclave|villas?|nilayam|arcade|chambers|plaza|house|bhavan|manor|court|pg|hostel)\b/i.test(v)) {
    return true;
  }
  return /^[A-Za-z][A-Za-z .']+$/.test(v) && v.includes(" ") && v.split(/\s+/).length <= 5;
}

export function parsePinFromFormatted(formatted?: string): { houseNumber?: string; buildingName?: string } {
  if (!formatted?.trim()) return {};
  const parts = unique(
    formatted
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part && part.toLowerCase() !== "india" && !isPlusCode(part)),
  );
  let houseNumber: string | undefined;
  let buildingName: string | undefined;
  for (const part of parts.slice(0, 3)) {
    if (!houseNumber && isHouseToken(part)) {
      houseNumber =
        part
          .replace(
            /^(?:h\.?\s*no\.?|house\s*(?:no\.?|number)?|plot\s*(?:no\.?)?|flat\s*(?:no\.?)?|door\s*(?:no\.?)?|shop\s*(?:no\.?)?)\s*/i,
            "",
          )
          .trim() || part;
      continue;
    }
    if (!buildingName && isBuildingToken(part)) buildingName = part;
    if (houseNumber && buildingName) break;
  }
  return { houseNumber, buildingName };
}

export function pickRicherPlace(a?: StreetAddress | null, b?: StreetAddress | null): StreetAddress | null {
  const score = (place?: StreetAddress | null) => {
    if (!place) return -1;
    return (place.houseNumber ? 4 : 0) + (place.buildingName ? 4 : 0) + (place.full?.split(",").length ?? 0);
  };
  return score(a) >= score(b) ? a ?? b ?? null : b ?? a ?? null;
}

function hasDoorNumber(value: string) {
  const first = value.split(",")[0]?.trim() ?? "";
  if (!first || isPlusCode(first)) return false;
  return isHouseToken(first) || /h\.?\s*no|plot|flat|shop/i.test(first);
}

function richerAddress(googleFull: string, structuredFull: string) {
  const google = stripPlusCodes(googleFull);
  const structured = stripPlusCodes(structuredFull);
  if (!google) return structured;
  if (!structured) return google;
  const googleHasPin = hasDoorNumber(google);
  const structuredHasPin = hasDoorNumber(structured);
  if (structuredHasPin && !googleHasPin) return structured;
  if (googleHasPin && !structuredHasPin) return google;
  return google.split(",").length >= structured.split(",").length ? google : structured;
}

export function mergeNominatim(primary: NominatimAddress, extra?: NominatimAddress): NominatimAddress {
  return { ...extra, ...primary, ...pickDefined(extra), ...pickDefined(primary) };
}

function pickDefined(address?: NominatimAddress): NominatimAddress {
  if (!address) return {};
  const next: NominatimAddress = {};
  for (const [key, value] of Object.entries(address)) {
    if (typeof value === "string" && value.trim()) {
      (next as Record<string, string>)[key] = value.trim();
    }
  }
  return next;
}

export function navbarPinLabel(place: StreetAddress) {
  const pin = unique([place.houseNumber, place.buildingName]).join(", ");
  if (pin) return pin;
  return unique(place.line1.split(",")).join(", ") || place.line1;
}

export function withBuildingDetails(houseNumber?: string, buildingName?: string, rest?: string) {
  return unique([houseNumber, buildingName, ...(rest ?? "").split(",")]).join(", ");
}

export function formatExactAddress(address: NominatimAddress, displayName?: string): StreetAddress {
  const display = stripPlusCodes(displayName || address.formatted_address);
  const parsed = parsePinFromFormatted(display);
  const rawHouse = address.house_number?.trim() || parsed.houseNumber;
  const houseNo = rawHouse && !isPlusCode(rawHouse) ? rawHouse : parsed.houseNumber;
  const road = address.road?.trim() || address.pedestrian?.trim();
  const district = address.state_district || (address.city && address.county ? undefined : address.city);
  const areaRaw =
    address.neighbourhood ||
    address.suburb ||
    address.hamlet ||
    address.village ||
    address.quarter ||
    address.residential;
  const area = areaRaw && district && same(areaRaw, district) ? undefined : areaRaw;
  const named =
    address.house_name?.trim() && address.house_name.trim().toLowerCase() !== "yes"
      ? address.house_name.trim()
      : undefined;
  const namedIsHouse = Boolean(named && (samePin(named, houseNo) || isHouseToken(named)));
  const building =
    named && !namedIsHouse && !same(named, areaRaw) && !same(named, district) && !same(named, address.city)
      ? named
      : parsed.buildingName && !samePin(parsed.buildingName, houseNo) && !same(parsed.buildingName, areaRaw)
        ? parsed.buildingName
        : undefined;
  const mandalRaw = address.county || address.municipality || address.city_district;
  const mandal = mandalLabel(mandalRaw);
  const pin = unique([houseNo, building]).join(", ");
  const line1 = pin || area || road || mandalRaw || district || display.split(",")[0]?.trim() || "Current location";
  const line2 = unique([
    area && !same(area, line1) ? area : undefined,
    road && !same(road, line1) && !same(road, area) ? road : undefined,
    mandal && !same(mandalRaw, line1) ? mandal : undefined,
    district && !same(district, line1) ? district : undefined,
  ]).join(", ");
  const structuredFull = unique([
    houseNo,
    building,
    road,
    area,
    mandalRaw,
    district,
    address.state,
    address.postcode,
  ]).join(", ");
  const full = richerAddress(display, structuredFull);

  return {
    line1,
    line2: line2 || address.state || "",
    full: full || line1,
    houseNumber: houseNo,
    buildingName: building,
  };
}

function mandalLabel(name?: string) {
  if (!name?.trim()) return undefined;
  return /mandal|tahsil|tehsil/i.test(name) ? name.trim() : `${name.trim()} mandal`;
}
