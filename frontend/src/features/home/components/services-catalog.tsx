"use client";

import Link from "next/link";
import { useVisibleServices } from "@/features/services/service-catalog-provider";
import { CategoryArt } from "./category-art";
import { useEffect, useState } from "react";
import { LIVE_LOCATION_CHANGE_EVENT, readSavedLocation, type SavedLocation } from "@/shared/lib/geo";
import { navbarPinLabel } from "@/shared/lib/format-address";

export function ServicesCatalog({
  heading = "Home services in Hyderabad",
  serviceIds,
  locationAware = false,
}: {
  heading?: string;
  serviceIds?: readonly string[];
  locationAware?: boolean;
}) {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const services = useVisibleServices();
  const items = serviceIds ? services.filter((service) => serviceIds.includes(service.id)) : services;

  useEffect(() => {
    if (!locationAware) return;
    const updateLocation = () => setLocation(readSavedLocation());
    updateLocation();
    window.addEventListener(LIVE_LOCATION_CHANGE_EVENT, updateLocation);
    window.addEventListener("storage", updateLocation);
    return () => {
      window.removeEventListener(LIVE_LOCATION_CHANGE_EVENT, updateLocation);
      window.removeEventListener("storage", updateLocation);
    };
  }, [locationAware]);

  const pageHeading = locationAware
    ? `${heading}${location ? ` in ${navbarPinLabel(location)}` : " near you"}`
    : heading;

  return (
    <>
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-white pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:hidden">
        <header className="flex h-11 shrink-0 items-center border-b border-[var(--border)] pl-12 pr-3">
          <h1 className="text-[17px] font-semibold tracking-tight">{pageHeading}</h1>
        </header>

        <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 content-start gap-2 overflow-y-auto bg-white p-3">
          {items.map((service, index) => (
            <li key={service.id}>
              <Link
                href={service.href}
                prefetch
                className="group flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-[18px] border border-slate-200/80 bg-white px-2 py-3 text-center shadow-[0_6px_20px_-16px_rgba(15,23,42,0.7)] transition duration-200 active:scale-[0.98] active:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                <CategoryArt
                  id={service.id}
                  size={56}
                  priority={index < 4}
                  className="h-14 w-14 shrink-0 object-contain"
                />
                <span className="text-[13px] font-semibold leading-tight tracking-[-0.01em] text-[var(--text)]">
                  {service.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden bg-white md:block">
        <header className="flex h-11 items-center border-b border-[var(--border)] pl-12 pr-3">
          <h1 className="text-[17px] font-semibold tracking-tight">{pageHeading}</h1>
        </header>
        <ul className="mt-6 grid grid-cols-4 gap-3.5 px-4 pb-8 lg:grid-cols-6">
          {items.map((service, index) => (
            <li key={service.id} className="min-w-0">
              <Link
                href={service.href}
                className="group flex min-h-32 flex-col items-center justify-center gap-2 rounded-[20px] border border-slate-200/80 bg-white px-2 py-3.5 text-center shadow-[0_6px_20px_-16px_rgba(15,23,42,0.7)] transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_14px_28px_-16px_rgba(15,118,110,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                <CategoryArt id={service.id} size={72} priority={index < 6} className="h-16 w-16 object-contain" />
                <span className="w-full text-sm font-semibold leading-tight tracking-[-0.01em] text-[var(--text)]">
                  {service.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
