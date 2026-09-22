export {
  AVAILABLE_DAYS,
  ELECTRICIAN_DISTRICTS,
  matchDistrict,
  type CoverageType,
} from "./electrician-form-data";

export const TOUR_PROVIDER_TYPES = ["Travel Agency", "Tour Operator", "Individual Guide", "Transport Operator"] as const;

export const TOUR_EXPERIENCE = ["Below 1 Year", "1-3 Years", "3-5 Years", "5-10 Years", "10+ Years"] as const;

export const TOUR_PACKAGES = [
  "One Day Local Tour",
  "Weekend Tour",
  "Family Tour",
  "Pilgrimage Tour",
  "Honeymoon Package",
  "Adventure Tour",
  "Custom Tour",
] as const;

export const TOUR_DURATIONS = [
  "1 Day",
  "2 Days",
  "3 Days",
  "4 Days",
  "5 Days",
  "6 Days",
  "7 Days",
  "2 Weeks",
  "3 Weeks",
  "4 Weeks",
  "5 Weeks",
  "6 Weeks",
  "7 Weeks",
  "8 Weeks",
] as const;

export const TOUR_FOOD = ["Included", "Excluded"] as const;

export const TOUR_LICENSE_STATUS = ["Available", "Not Available"] as const;

export const TOUR_CAPACITIES = ["2", "4", "6", "8", "10", "12", "15", "20", "30", "40"] as const;

export const TOUR_TRAVEL_TYPES = ["Domestic", "International", "One Day Trips", "Multi-Day Trips"] as const;

export const TOUR_INCLUSIONS = [
  "Transport",
  "Hotel Stay",
  "Food",
  "Breakfast",
  "Sightseeing",
  "Tour Guide",
  "Entry Tickets",
  "Pickup & Drop",
] as const;

export const TOUR_TRANSPORT = ["Cab", "Tempo Traveller", "Bus", "Train", "Flight"] as const;

export const TOUR_MIN_GROUP = ["1 Person", "2 People", "4 People", "6 People"] as const;

export const TOUR_MAX_GROUP = ["10 People", "15 People", "20 People", "30 People", "40 People", "50 People"] as const;

export const TOUR_BOOKING_MODES = ["Instant Booking", "On Confirmation"] as const;

export const TOUR_ADVANCE_PAYMENT = ["No Advance", "10%", "25%", "50%", "Full Advance"] as const;

export const TOUR_CANCELLATION = ["Free Cancellation", "Partial Refund", "Non-refundable"] as const;

export const TOUR_ADVANCE_NOTICE = ["Immediate", "1 day", "2 days", "3 days", "1 week"] as const;

export type PackageQuote = { price: string; duration: string; capacity: string };
