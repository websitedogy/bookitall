export type SavedVendorListing = {
  id: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
  fields: Record<string, string>;
};

const STORAGE_KEY = "bookitall-vendor-listings";

export function loadVendorListings(): SavedVendorListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedVendorListing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVendorListing(listing: Omit<SavedVendorListing, "id" | "createdAt">) {
  const next: SavedVendorListing = {
    ...listing,
    id: `${listing.categoryId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const listings = [next, ...loadVendorListings()];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  return next;
}
