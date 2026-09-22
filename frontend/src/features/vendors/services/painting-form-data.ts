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

export { MATERIAL_OPTIONS } from "./carpenter-form-data";

export const PAINTING_SERVICES = [
  "Interior Painting",
  "Exterior Painting",
  "Wall Painting",
  "Ceiling Painting",
  "Texture Painting",
  "Waterproofing",
  "Wood / Furniture Painting",
  "Metal Painting",
  "Repainting",
  "Touch-up / Minor Work",
] as const;

export const PAINTING_PROPERTY_TYPES = ["Home", "Apartment", "Shop", "Office", "Commercial", "Industrial"] as const;

export const PAINTING_WORK_TYPES = ["New Painting", "Repainting", "Surface Repair", "Custom Work"] as const;

export const PAINT_TYPES = ["Emulsion", "Distemper", "Enamel", "Texture Paint", "Waterproof Coating", "All Types"] as const;

export const PAINTING_TOOLS = [
  "Roller",
  "Brush",
  "Spray Machine",
  "Ladder",
  "Sanding Machine",
  "Pressure Washer",
  "Scaffolding",
  "Basic Tools",
] as const;
