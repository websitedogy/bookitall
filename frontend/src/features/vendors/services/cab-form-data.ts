export {
  AVAILABLE_DAYS,
  ELECTRICIAN_DISTRICTS,
  EMERGENCY_OPTIONS,
  matchDistrict,
  type CoverageType,
} from "./electrician-form-data";

export const CAB_PROVIDER_TYPES = ["Individual Driver", "Fleet Owner", "Travel Agency", "Company"] as const;

export const CAB_VEHICLES = ["Hatchback", "Sedan", "SUV", "Premium SUV", "Tempo Traveller", "Auto"] as const;

export const VEHICLE_CAPACITIES = ["3", "4", "5", "6", "7", "8", "12", "14", "17"] as const;

export const VEHICLE_AVAILABILITY = ["Available", "Limited", "On Request"] as const;

export const VEHICLE_FEATURES = ["AC", "Non-AC", "GPS", "FASTag", "Child Seat", "Music System"] as const;

export const CAB_BOOKING_TYPES = ["One Way", "Round Trip", "Local / City", "Airport Transfer", "Outstation", "Hourly Rental"] as const;

export const MIN_KM_OPTIONS = ["5 KM", "10 KM", "15 KM", "20 KM", "25 KM", "30 KM"] as const;

export const MIN_HOUR_OPTIONS = ["1 Hour", "2 Hours", "3 Hours", "4 Hours", "5 Hours", "8 Hours"] as const;

export const DRIVING_EXPERIENCE = ["Below 1 Year", "1-3 Years", "3-5 Years", "5-10 Years", "10+ Years"] as const;

export const DRIVER_VERIFICATION = ["Verified", "Pending", "Not Verified"] as const;

export const CAB_DOCUMENTS = ["Driving Licence", "RC", "Insurance", "Permit"] as const;

export const BOOKING_MODES = ["Instant Booking", "On Confirmation"] as const;

export const ADVANCE_NOTICE = ["Immediate", "30 minutes", "1 hour", "2 hours", "4 hours", "1 day"] as const;

export const DRIVER_AVAILABILITY = ["Available Now", "Available Today", "On Call"] as const;

export type VehicleQuote = { fare: string; capacity: string; availability: string };
