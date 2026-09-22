export type ListingDetailRow = { key: string; label: string; value: string };

export type DetailTabId = "destinations" | "location" | "basics" | "prices" | "extra";

export const DETAIL_TAB_ORDER: DetailTabId[] = ["destinations", "location", "basics", "prices", "extra"];

export type TourRouteStop = {
  kind: "pickup" | "place" | "drop";
  label: string;
  name: string;
};

const DESTINATION_KEYS = new Set(["pickupPoint", "dropPoint", "destinations", "pickupAvailable", "dropAvailable"]);

const LOCATION_KEYS = new Set([
  "location",
  "address",
  "city",
  "area",
  "state",
  "street",
  "houseNumber",
  "district",
  "mandals",
  "coverageType",
  "coverage",
  "serviceArea",
  "serviceKm",
  "serviceLocations",
  "routeType",
  "travelType",
]);

const PRICE_KEYS = new Set([
  "price",
  "priceUnit",
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
  "advancePayment",
  "packagePricing",
  "vehicleFares",
  "minKm",
  "minHours",
  "extraGuestCharge",
  "roomRates",
  "servicePricing",
  "startingCharge",
  "workChargesNote",
]);

const EXTRA_KEYS = new Set([
  "description",
  "inclusions",
  "food",
  "meals",
  "houseRules",
  "facilities",
  "roomFeatures",
  "vehicleFeatures",
  "cancellation",
  "childPolicy",
  "checkPolicy",
  "tools",
  "materialResponsibility",
  "productResponsibility",
  "spareParts",
  "paintTypes",
  "cleaningItems",
  "beautyServices",
  "notes",
  "additional",
]);

function withDestinations(rest: Omit<Record<DetailTabId, string>, "destinations">): Record<DetailTabId, string> {
  return { destinations: "Destinations", ...rest };
}

export function detailTabNames(categoryId: string): Record<DetailTabId, string> {
  if (categoryId === "hotels" || categoryId === "homestay") {
    return withDestinations({ location: "Location", basics: "Stay", prices: "Rates", extra: "Extra" });
  }
  if (categoryId === "tours") {
    return withDestinations({ location: "Places", basics: "Package", prices: "Price", extra: "Extra" });
  }
  if (categoryId === "cabs" || categoryId === "public-transport" || categoryId === "goods-transport") {
    return withDestinations({ location: "Area", basics: "Vehicle", prices: "Fares", extra: "Extra" });
  }
  if (categoryId === "packers-movers") {
    return withDestinations({ location: "Area", basics: "Move", prices: "Charges", extra: "Extra" });
  }
  if (categoryId === "cloud-kitchen") {
    return withDestinations({ location: "Place", basics: "Kitchen", prices: "Prices", extra: "Extra" });
  }
  if (categoryId === "jobs") {
    return withDestinations({ location: "Area", basics: "Profile", prices: "Fees", extra: "Extra" });
  }
  if (
    categoryId === "electrician" ||
    categoryId === "plumber" ||
    categoryId === "ac" ||
    categoryId === "cleaning" ||
    categoryId === "carpenter" ||
    categoryId === "painting" ||
    categoryId === "appliance" ||
    categoryId === "beautician"
  ) {
    return withDestinations({ location: "Area", basics: "Service", prices: "Charges", extra: "Extra" });
  }
  return withDestinations({ location: "Location", basics: "Basics", prices: "Prices", extra: "Extra" });
}

export function classifyDetailKey(key: string): DetailTabId {
  const id = key.trim();
  if (DESTINATION_KEYS.has(id)) return "destinations";
  if (LOCATION_KEYS.has(id)) return "location";
  if (PRICE_KEYS.has(id)) return "prices";
  if (EXTRA_KEYS.has(id)) return "extra";
  return "basics";
}

export function groupDetailRows(rows: ListingDetailRow[]) {
  const groups: Record<DetailTabId, ListingDetailRow[]> = {
    destinations: [],
    location: [],
    basics: [],
    prices: [],
    extra: [],
  };
  for (const row of rows) {
    groups[classifyDetailKey(row.key)].push(row);
  }
  return groups;
}

export function parsePlaceList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function tourRouteStops(rows: ListingDetailRow[]): TourRouteStop[] {
  const pickup = rows.find((row) => row.key === "pickupPoint")?.value.trim() ?? "";
  const drop = rows.find((row) => row.key === "dropPoint")?.value.trim() ?? "";
  const places = parsePlaceList(rows.find((row) => row.key === "destinations")?.value ?? "");
  const stops: TourRouteStop[] = [];
  if (pickup) stops.push({ kind: "pickup", label: "Pickup", name: pickup });
  places.forEach((name, index) => stops.push({ kind: "place", label: `Place ${index + 1}`, name }));
  if (drop) stops.push({ kind: "drop", label: "Drop", name: drop });
  return stops;
}

const ROUTE_FIELD_KEYS = new Set(["pickupPoint", "dropPoint", "destinations", "pickupAvailable", "dropAvailable"]);

export function leftoverDestinationRows(rows: ListingDetailRow[]): ListingDetailRow[] {
  return rows.filter((row) => !ROUTE_FIELD_KEYS.has(row.key));
}
