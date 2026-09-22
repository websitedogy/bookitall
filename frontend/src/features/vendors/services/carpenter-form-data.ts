export {
  AVAILABLE_DAYS,
  AVAILABLE_TIMES,
  CUSTOMER_TYPES,
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

export const CARPENTER_SERVICES = [
  "Furniture Repair",
  "Door Work",
  "Window Work",
  "Wardrobe Work",
  "Modular Kitchen",
  "Bed / Cot Work",
  "Table / Chair Work",
  "TV Unit",
  "Custom Furniture",
  "Furniture Installation",
] as const;

export const CARPENTER_WORK_TYPES = ["Repair", "Installation", "New Work", "Custom Work"] as const;

export const CARPENTER_TOOLS = [
  "Drill Machine",
  "Circular Saw",
  "Jigsaw",
  "Sander",
  "Router",
  "Nail Gun",
  "Hand Tools",
  "Measuring Tools",
  "Ladder",
  "All Basic Tools",
] as const;

export const MATERIAL_OPTIONS = ["Customer provides", "Vendor provides", "Both / as discussed"] as const;
