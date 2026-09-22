import type { CartItem } from "./store";

export function taxRate(categoryId: string) {
  if (categoryId === "hotels") return 0.12;
  if (categoryId === "tours") return 0.05;
  if (categoryId === "cabs") return 0;
  return 0.18;
}

export function nightsBetween(checkIn?: string, checkOut?: string) {
  if (!checkIn || !checkOut) return 1;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const nights = Math.round((b.getTime() - a.getTime()) / 86400000);
  return nights < 1 ? 1 : nights;
}

export function lineSubtotal(item: CartItem) {
  if (item.categoryId === "hotels") {
    return item.unitPrice * nightsBetween(item.checkIn, item.checkOut) * item.quantity;
  }
  if (item.categoryId === "tours") {
    return item.unitPrice * (item.travelers || item.quantity);
  }
  return item.unitPrice * item.quantity;
}

export function lineTax(item: CartItem) {
  return Number((lineSubtotal(item) * taxRate(item.categoryId)).toFixed(2));
}

export function lineTotal(item: CartItem) {
  return Number((lineSubtotal(item) + lineTax(item)).toFixed(2));
}

export function cartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + lineSubtotal(item), 0);
  const tax = items.reduce((sum, item) => sum + lineTax(item), 0);
  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number((subtotal + tax).toFixed(2)),
    count: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function quantityLabel(categoryId: string) {
  if (categoryId === "hotels") return "Rooms";
  if (categoryId === "tours") return "Travelers";
  if (categoryId === "cabs") return "Cars";
  return "Service";
}

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function defaultDate(days = 1) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function defaultSlot(days = 1) {
  return `${defaultDate(days)}T10:00`;
}

export function cartItemKey(item: Pick<CartItem, "listingId" | "scheduledAt" | "checkIn" | "pickupAddress">) {
  return [item.listingId, item.scheduledAt || item.checkIn || item.pickupAddress || ""].join(":");
}
