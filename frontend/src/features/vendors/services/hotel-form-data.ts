export {
  ELECTRICIAN_DISTRICTS,
  matchDistrict,
  type CoverageType,
} from "./electrician-form-data";

export const HOTEL_PROPERTY_TYPES = [
  "Hotel",
  "Lodge",
  "Guest House",
  "Resort",
  "Hostel",
  "Apartment",
  "Serviced Apartment",
  "Villa",
  "Farmhouse",
  "Cottage",
  "Boutique Hotel",
  "Heritage / Palace",
  "Bed & Breakfast",
  "Motel",
  "Studio",
  "Penthouse",
  "Dormitory",
  "Paying Guest (PG)",
  "Camp / Tent",
  "Houseboat",
  "Treehouse",
] as const;

export const HOTEL_STAR_CATEGORIES = ["Budget", "1 Star", "2 Star", "3 Star", "4 Star", "5 Star", "Boutique", "Heritage"] as const;

export const HOTEL_CHECK_POLICIES = ["Standard", "Flexible", "Strict"] as const;

export const HOTEL_ROOMS = ["Single Room", "Double Room", "Deluxe Room", "Family Room", "Suite", "Dormitory"] as const;

export const ROOM_OCCUPANCY = ["1", "2", "3", "4", "5", "6"] as const;

export const ROOMS_AVAILABLE = ["1", "2", "3", "4", "5", "6", "8", "10", "12", "15", "20"] as const;

export const HOTEL_ROOM_FEATURES = [
  "AC",
  "Non-AC",
  "Attached Bathroom",
  "TV",
  "Free Wi-Fi",
  "Hot Water",
  "Power Backup",
  "Room Service",
] as const;

export const HOTEL_FACILITIES = [
  "Parking",
  "Restaurant",
  "Breakfast",
  "Swimming Pool",
  "Gym",
  "Lift",
  "Laundry",
  "24x7 Reception",
] as const;

export const HOTEL_SUITABLE_FOR = ["Family", "Couples", "Business", "Groups"] as const;

export const HOTEL_BOOKING_MODES = ["Instant Booking", "On Confirmation"] as const;

export const HOTEL_CANCELLATION = ["Free Cancellation", "Partial Refund", "Non-refundable"] as const;

export const HOTEL_CHILD_POLICY = ["Children Allowed", "Children Not Allowed", "Extra Charge"] as const;

export const HOTEL_ADVANCE_NOTICE = ["Immediate", "1 hour", "4 hours", "1 day", "2 days"] as const;

export type RoomQuote = { rate: string; occupancy: string; available: string };
