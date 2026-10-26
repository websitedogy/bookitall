"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import type { Vehicle } from "@/shared/types/catalog";
import { CabSchedulesManager } from "@/features/vendors/services/cab-schedules-manager";
import {
  GoodsTransportScheduleManager,
  type GoodsTransportListing,
} from "@/features/vendors/services/goods-transport-schedule-manager";

type RegisteredVehicle = Vehicle & { isActive: boolean };

export default function PartnerListingsPage() {
  const token = useAuth((s) => s.accessToken);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [goodsListings, setGoodsListings] = useState<GoodsTransportListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeService, setActiveService] = useState<"cabs" | "goods-transport">("cabs");

  useEffect(() => {
    if (!token) return;
    let active = true;
    void Promise.all([
      api<RegisteredVehicle[]>("/cabs/mine", { token }),
      api<GoodsTransportListing[]>("/vendor-listings/mine?category=goods-transport", { token }),
    ])
      .then(([vehicleResult, listingResult]) => {
        if (!active) return;
        const approvedVehicles = (vehicleResult.data ?? []).filter((vehicle) => vehicle.isActive);
        const approvedListings = (listingResult.data ?? []).filter((listing) => listing.status === "ACCEPTED");
        setVehicles(approvedVehicles);
        setGoodsListings(approvedListings);
        if (!approvedVehicles.length && approvedListings.length) {
          setActiveService("goods-transport");
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your approved services.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const availableServices = [
    ...(vehicles.length ? (["cabs"] as const) : []),
    ...(goodsListings.length ? (["goods-transport"] as const) : []),
  ];

  return (
    <div>
      <div className="mb-8 border-b border-[var(--line)] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">My Services</p>
        <h1 className="serif mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Special Schedule</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
          Post and manage upcoming routes for your cab and Goods Transport services.
        </p>
      </div>

      {error ? <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="py-6 text-sm text-[var(--ink-soft)]">Checking approved services…</p> : null}

      {!loading && availableServices.length ? (
      <div role="tablist" aria-label="Special schedule service" className="flex gap-2 border-b border-[var(--line)]">
        {([
          ...(vehicles.length ? ([["cabs", "Cabs"]] as const) : []),
          ...(goodsListings.length ? ([["goods-transport", "Goods Transport"]] as const) : []),
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeService === id}
            onClick={() => setActiveService(id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeService === id ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--ink-soft)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      ) : null}

      {!loading && activeService === "cabs" && vehicles.length ? <CabSchedulesManager vehicles={vehicles} /> : null}
      {!loading && activeService === "goods-transport" && goodsListings.length ? (
        <GoodsTransportScheduleManager approvedListings={goodsListings} />
      ) : null}
      {!loading && !availableServices.length && !error ? (
        <p className="mt-6 rounded-xl border border-dashed border-[var(--line)] px-5 py-6 text-sm text-[var(--ink-soft)]">
          Special Schedule becomes available after an administrator approves your Cab or Goods Transport service.
        </p>
      ) : null}
    </div>
  );
}
