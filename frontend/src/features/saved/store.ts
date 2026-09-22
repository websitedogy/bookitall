"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SavedListing = {
  id: string;
  title: string;
  href: string;
  image: string;
  categoryId: string;
  category?: string;
  location?: string;
  priceLabel?: string;
};

type SavedState = {
  items: SavedListing[];
  toggle: (item: SavedListing) => void;
  has: (id: string) => boolean;
};

export const useSaved = create<SavedState>()(
  persist(
    (set, get) => ({
      items: [],
      has: (id) => get().items.some((row) => row.id === id),
      toggle: (item) => {
        const exists = get().items.some((row) => row.id === item.id);
        set({
          items: exists ? get().items.filter((row) => row.id !== item.id) : [item, ...get().items],
        });
      },
    }),
    { name: "bookitall-saved" },
  ),
);

export function useSavedReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
