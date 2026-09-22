export {
  AVAILABLE_DAYS,
  AVAILABLE_TIMES,
  ELECTRICIAN_DISTRICTS,
  EMERGENCY_OPTIONS,
  EXPERIENCE_OPTIONS,
  FULL_DAY_CHARGES,
  HOURLY_CHARGES,
  TEAM_SIZES,
  VISIT_CHARGES,
  matchDistrict,
  visitChargeAmount,
  type CoverageType,
} from "./electrician-form-data";

export const APPLIANCES_SERVICED = [
  "TV",
  "Refrigerator",
  "Washing Machine",
  "Microwave Oven",
  "Geyser",
  "Air Cooler",
  "Water Purifier",
  "Kitchen Chimney",
  "Dishwasher",
  "Other Appliances",
] as const;

export const APPLIANCE_SERVICES = [
  "Repair",
  "Installation",
  "Maintenance",
  "Parts Replacement",
  "Cleaning / Service",
  "Electrical Issue",
  "Water Leakage",
  "Noise / Vibration Issue",
  "Not Working / Diagnosis",
  "Annual Maintenance",
] as const;

export const APPLIANCE_BRANDS = [
  "LG",
  "Samsung",
  "Whirlpool",
  "IFB",
  "Sony",
  "Panasonic",
  "Godrej",
  "Haier",
  "Voltas",
  "All Brands",
] as const;

export const APPLIANCE_TOOLS = [
  "Multimeter",
  "Screwdriver Set",
  "Testing Meter",
  "Drill Machine",
  "Soldering Kit",
  "Gas / Pressure Tools",
  "Cleaning Tools",
  "Basic Tools",
] as const;

export const SERVICE_MODES = ["Home Service", "Shop / Center"] as const;

export const SPARE_PARTS_OPTIONS = ["Customer Provides", "Vendor Provides", "Both / as discussed"] as const;

export type ServiceMode = (typeof SERVICE_MODES)[number];
