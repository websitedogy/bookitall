export const APP_NAME = 'Book It All';
export const API_PREFIX = 'api/v1';

export const REDIS_KEYS = {
  refreshToken: (userId: string) => `auth:refresh:${userId}`,
  bookingLock: (key: string) => `lock:booking:${key}`,
  driverLocation: (driverId: string) => `gps:driver:${driverId}`,
  technicianLocation: (technicianId: string) => `gps:technician:${technicianId}`,
  listingCache: (type: string, id: string) => `cache:listing:${type}:${id}`,
  searchCache: (hash: string) => `cache:search:${hash}`,
} as const;

export const QUEUE_NAMES = {
  notifications: 'notifications',
  payouts: 'payouts',
  bookingExpiry: 'booking-expiry',
} as const;

export const DEFAULT_COMMISSION_PERCENT: Record<string, number> = {
  HOTEL: 12,
  TOUR: 10,
  CAB: 15,
  HOME_SERVICE: 18,
};

export const BOOKING_NUMBER_PREFIX = 'BIA';
