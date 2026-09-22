import type { CartItem } from "./store";

export function toCheckoutItems(items: CartItem[], address?: string) {
  return items.map((item) => ({
    listingId: item.listingId,
    quantity: item.categoryId === "tours" ? item.travelers || item.quantity : item.quantity,
    scheduledAt: item.scheduledAt,
    address: item.address || address,
    notes: item.notes,
    details: {
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      travelers: item.travelers || (item.categoryId === "tours" ? item.quantity : undefined),
      travelDate: item.scheduledAt?.slice(0, 10) || item.checkIn,
      pickupAddress: item.pickupAddress,
      dropAddress: item.dropAddress,
      quantity: item.quantity,
      customerLat: item.customerLat,
      customerLng: item.customerLng,
    },
  }));
}

export type CheckoutResult = {
  bookings: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    total: string;
    type: string;
    details?: Record<string, unknown>;
  }>;
  total: number;
  paid: boolean;
  currency: string;
  method?: string;
  payAfterService?: boolean;
};

const LAST_ORDER_KEY = "bookitall-last-order";

let lastOrderRaw: string | null | undefined;
let lastOrderSnapshot: CheckoutResult | null = null;

export function saveLastOrder(result: CheckoutResult) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(result);
  sessionStorage.setItem(LAST_ORDER_KEY, raw);
  lastOrderRaw = raw;
  lastOrderSnapshot = result;
}

export function readLastOrder(): CheckoutResult | null {
  return getLastOrderSnapshot();
}

export function subscribeLastOrder(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onChange = () => {
    lastOrderRaw = undefined;
    onStoreChange();
  };
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function getLastOrderSnapshot(): CheckoutResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(LAST_ORDER_KEY);
  if (raw === lastOrderRaw) return lastOrderSnapshot;
  lastOrderRaw = raw;
  if (!raw) {
    lastOrderSnapshot = null;
    return null;
  }
  try {
    lastOrderSnapshot = JSON.parse(raw) as CheckoutResult;
  } catch {
    lastOrderSnapshot = null;
  }
  return lastOrderSnapshot;
}

export function getLastOrderServerSnapshot(): CheckoutResult | null {
  return null;
}
