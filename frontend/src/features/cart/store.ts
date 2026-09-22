"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cartItemKey } from "./pricing";

export type CartItem = {
  key: string;
  listingId: string;
  title: string;
  vendor: string;
  location: string;
  image: string;
  categoryId: string;
  category: string;
  unitPrice: number;
  priceUnit: string;
  quantity: number;
  scheduledAt?: string;
  address?: string;
  notes?: string;
  checkIn?: string;
  checkOut?: string;
  travelers?: number;
  pickupAddress?: string;
  dropAddress?: string;
  customerLat?: number;
  customerLng?: number;
};

type CartState = {
  items: CartItem[];
  barDismissed: boolean;
  addItem: (item: Omit<CartItem, "key">) => void;
  updateItem: (key: string, patch: Partial<CartItem>) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  hideBar: () => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      barDismissed: false,
      addItem: (item) => {
        const key = cartItemKey(item);
        set({
          barDismissed: true,
          items: [{ ...item, key, quantity: Math.max(1, item.quantity || 1) }],
        });
      },
      updateItem: (key, patch) => {
        set({
          items: get().items.map((row) => {
            if (row.key !== key) return row;
            const next = { ...row, ...patch };
            return { ...next, key: cartItemKey(next) };
          }),
        });
      },
      setQuantity: (key, quantity) => {
        if (quantity < 1) {
          set({ items: get().items.filter((row) => row.key !== key) });
          return;
        }
        set({ items: get().items.map((row) => (row.key === key ? { ...row, quantity } : row)) });
      },
      removeItem: (key) => set({ items: get().items.filter((row) => row.key !== key) }),
      hideBar: () => set({ barDismissed: true }),
      clear: () => set({ items: [], barDismissed: false }),
    }),
    { name: "bookitall-cart" },
  ),
);

export function useCartCount() {
  const items = useCart((s) => s.items);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return 0;
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
