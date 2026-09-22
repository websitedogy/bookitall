import { cache } from "react";
import { publicApi } from "@/shared/lib/api";
import { getServiceCatalog, isServiceEnabled } from "@/features/services/catalog";
import type { HomeService, Hotel, Tour } from "@/shared/types/catalog";

const serviceLive = cache(async (slug: string) => {
  const catalog = await getServiceCatalog();
  return !catalog.length || isServiceEnabled(catalog, slug);
});

export type PublicListingPost = {
  id: string;
  categoryId: string;
  category?: string;
  title: string;
  vendor: string;
  location: string;
  image: string;
  photoUrls?: string[];
  href: string;
  canonicalPath?: string;
  status?: string;
  distanceKm?: number | null;
  priceLabel?: string;
  unitPrice?: number | null;
  priceUnit?: string;
  bookable?: boolean;
  description?: string;
  mobileNumber?: string | null;
  vehicleType?: string;
  serviceType?: string;
  loadCapacity?: string;
};

export const getHotels = cache(async (city?: string) => {
  if (!(await serviceLive("hotels"))) return [];
  const query = city ? `?city=${encodeURIComponent(city)}&limit=12` : "?limit=12";
  const result = await publicApi<Hotel[]>(`/hotels${query}`).catch(() => ({ data: [] as Hotel[] }));
  return result.data ?? [];
});

export const getHotel = cache(async (slug: string) => {
  if (!(await serviceLive("hotels"))) return undefined;
  const result = await publicApi<Hotel>(`/hotels/${slug}`).catch(() => ({ data: undefined }));
  return result.data;
});

export const getTours = cache(async (city?: string) => {
  if (!(await serviceLive("tours"))) return [];
  const query = city ? `?city=${encodeURIComponent(city)}` : "";
  const result = await publicApi<Tour[]>(`/tours${query}`).catch(() => ({ data: [] as Tour[] }));
  return result.data ?? [];
});

export const getTour = cache(async (slug: string) => {
  if (!(await serviceLive("tours"))) return undefined;
  const result = await publicApi<Tour>(`/tours/${slug}`).catch(() => ({ data: undefined }));
  return result.data;
});

export const getHomeServices = cache(async (path: string, city?: string) => {
  const slug = path === "ac-repair" ? "ac" : path === "job-consultancy" ? "jobs" : path;
  if (!(await serviceLive(slug))) return [];
  const params = new URLSearchParams();
  if (city) params.set("city", city);
  const query = params.toString();
  const result = await publicApi<HomeService[]>(`/${path}${query ? `?${query}` : ""}`).catch(() => ({
    data: [] as HomeService[],
  }));
  return result.data ?? [];
});

export const getHomeService = cache(async (path: string, slug: string) => {
  const category = path === "ac-repair" ? "ac" : path === "job-consultancy" ? "jobs" : path;
  if (!(await serviceLive(category))) return undefined;
  const result = await publicApi<HomeService>(`/${path}/${slug}`).catch(() => ({ data: undefined }));
  return result.data;
});

export const getAcceptedListings = cache(async (category: string) => {
  if (!(await serviceLive(category))) return [];
  const params = new URLSearchParams({ category });
  const result = await publicApi<PublicListingPost[]>(`/vendor-listings?${params.toString()}`).catch(() => ({
    data: [] as PublicListingPost[],
  }));
  return result.data ?? [];
});

export const getVendorListing = cache(async (id: string) => {
  const result = await publicApi<PublicListingPost>(`/vendor-listings/${id}`).catch(() => ({ data: undefined }));
  const slug = result.data?.categoryId || result.data?.category;
  if (slug && !(await serviceLive(slug))) return undefined;
  return result.data;
});
