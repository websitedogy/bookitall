export type Hotel = {
  id: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  state: string;
  address: string;
  starRating: number;
  averageRating: string;
  reviewCount: number;
  coverImageUrl: string;
  amenities: string[];
  roomTypes?: RoomType[];
};

export type RoomType = {
  id: string;
  name: string;
  description: string;
  maxGuests: number;
  pricePerNight: string;
  totalRooms: number;
};

export type Tour = {
  id: string;
  name: string;
  slug: string;
  description: string;
  destination: string;
  city: string;
  durationDays: number;
  pricePerPerson: string;
  averageRating: string;
  reviewCount: number;
  coverImageUrl: string;
  highlights: string[];
  itinerary: string[];
};

export type Vehicle = {
  id: string;
  name: string;
  category: string;
  seats: number;
  baseFare: string;
  perKmRate: string;
  imageUrl: string | null;
  color: string;
};

export type HomeService = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  basePrice: string;
  durationMinutes: number;
  city: string;
  averageRating: string;
  coverImageUrl: string;
};

export type Booking = {
  id: string;
  bookingNumber: string;
  type: "HOTEL" | "TOUR" | "CAB" | "HOME_SERVICE";
  status: string;
  total: string;
  currency: string;
  scheduledAt: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  customerId?: string;
  partnerId?: string | null;
  vendorRespondBy?: string | null;
  escalatedToAdmin?: boolean;
  cancellationReason?: string | null;
  payment?: { status: string; method: string; amount: string; reference?: string };
};
