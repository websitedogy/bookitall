export {
  AVAILABLE_DAYS,
  ELECTRICIAN_DISTRICTS,
  EMERGENCY_OPTIONS,
  EXPERIENCE_OPTIONS,
  TEAM_SIZES,
  matchDistrict,
  type CoverageType,
} from "./electrician-form-data";

export const BEAUTY_SERVICES = [
  "Haircut",
  "Hair Styling",
  "Hair Wash",
  "Facial",
  "Cleanup",
  "Threading",
  "Waxing",
  "Manicure",
  "Pedicure",
  "Bridal Makeup",
  "Party Makeup",
  "Mehendi",
] as const;

export const SUITABLE_FOR = ["Women", "Men", "Kids"] as const;

export const BEAUTY_BRANDS = ["L'Oréal", "Lakmé", "Lotus", "VLCC", "Other"] as const;

export const BEAUTY_TOOLS = [
  "Hair Dryer",
  "Straightener",
  "Curling Iron",
  "Makeup Kit",
  "Wax Heater",
  "Manicure Kit",
  "Pedicure Kit",
  "Mehendi Kit",
] as const;

export const BEAUTY_SERVICE_MODES = ["Home Service", "Salon / Studio"] as const;

export const PRODUCT_RESPONSIBILITY = ["Provider Provides", "Customer Provides", "Both / as discussed"] as const;

export const SERVICE_DURATIONS = ["15 min", "30 min", "45 min", "60 min", "90 min", "120 min"] as const;

export const BOOKING_BUFFERS = ["5 minutes", "10 minutes", "15 minutes", "20 minutes", "30 minutes"] as const;

export type BeautyServiceMode = (typeof BEAUTY_SERVICE_MODES)[number];

export type ServiceQuote = { fee: string; duration: string };

export const BEAUTY_SERVICE_AREAS = ["Only shop visit customer", "Door step"] as const;

export type BeautyServiceRow = {
  name: string;
  amount: string;
};

export function emptyBeautyService(): BeautyServiceRow {
  return { name: "", amount: "" };
}

export function filledBeautyServices(rows: BeautyServiceRow[]) {
  return rows.filter((row) => row.name.trim() && row.amount.trim());
}
