"use client";

import { useState } from "react";
import { Building2, Home } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { FormBackButton } from "./form-back-button";
import { HotelRegistrationForm } from "./hotel-registration-form";
import { HomestayRegistrationForm } from "./homestay-registration-form";

type StayTab = "hotels" | "homestays";

export function StayVendorPage() {
  const [tab, setTab] = useState<StayTab>("hotels");

  return (
    <div className="min-h-[100dvh] bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:min-h-[70vh] md:bg-[#f4f6f8] md:pb-10">
      <div className="md:mx-auto md:max-w-2xl md:px-0 md:pt-6 md:pb-8">
        <article className="bg-white md:rounded-2xl md:p-8 md:shadow-sm md:ring-1 md:ring-slate-200">
          <header className="sticky top-0 z-20 border-b border-slate-100 bg-white pl-12 pr-4 md:static md:border-0 md:px-0">
            <div className="flex h-12 items-center gap-2.5 md:h-auto md:pb-3">
              <FormBackButton />
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50">
                {tab === "hotels" ? <Building2 className="h-5 w-5 text-sky-700" /> : <Home className="h-5 w-5 text-sky-700" />}
              </span>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
                {tab === "hotels" ? "Hotels" : "Homestays"}
              </h1>
            </div>
            <div className="flex gap-1 pb-3">
              {(
                [
                  ["hotels", "Hotels"],
                  ["homestays", "Homestays"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "h-9 flex-1 rounded-full text-sm font-semibold",
                    tab === id ? "bg-[var(--primary)] text-white" : "bg-slate-100 text-slate-600",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>
          <div className={tab === "hotels" ? "block" : "hidden"}>
            <HotelRegistrationForm embedded />
          </div>
          <div className={tab === "homestays" ? "block" : "hidden"}>
            <HomestayRegistrationForm embedded />
          </div>
        </article>
      </div>
    </div>
  );
}
