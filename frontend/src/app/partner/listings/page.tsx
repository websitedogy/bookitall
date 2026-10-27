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
  const [packersListings, setPackersListings] = useState<GoodsTransportListing[]>([]);
  const [activeService, setActiveService] = useState<
    "cabs" | "goods-transport" | "packers-movers"
  >("cabs");
  const [activeScheduleTab, setActiveScheduleTab] = useState<"form" | "history">("form");

  useEffect(() => {
    if (!token) return;
    let active = true;
    void Promise.all([
      api<GoodsTransportListing[]>("/vendor-listings/mine?category=cabs", { token }),
      api<GoodsTransportListing[]>("/vendor-listings/mine?category=public-transport", { token }),
      api<GoodsTransportListing[]>("/vendor-listings/mine?category=goods-transport", { token }),
      api<GoodsTransportListing[]>("/vendor-listings/mine?category=packers-movers", { token }),
    ])
      .then(async ([cabListingResult, publicTransportResult, goodsListingResult, packersResult]) => {
        if (!active) return;
        const vehicleResult = await api<RegisteredVehicle[]>("/cabs/mine", { token });
        if (!active) return;
        const approvedCabVehicleIds = new Set(
          [...(cabListingResult.data ?? []), ...(publicTransportResult.data ?? [])]
            .filter((listing) => listing.status === "ACCEPTED")
            .flatMap((listing) => [
              ...(listing.catalogId ? [listing.catalogId] : []),
              ...(listing.scheduleVehicleIds ?? []),
            ]),
        );
        const approvedVehicles = (vehicleResult.data ?? []).filter(
          (vehicle) => vehicle.isActive && approvedCabVehicleIds.has(vehicle.id),
        );
        const approvedListings = (goodsListingResult.data ?? []).filter((listing) => listing.status === "ACCEPTED");
        const approvedPackersListings = (packersResult.data ?? []).filter((listing) => listing.status === "ACCEPTED");
        setVehicles(approvedVehicles);
        setGoodsListings(approvedListings);
        setPackersListings(approvedPackersListings);
        if (window.location.hash === "#packers-movers-schedules" || (!approvedVehicles.length && !approvedListings.length && approvedPackersListings.length)) {
          setActiveService("packers-movers");
        } else if (window.location.hash === "#goods-transport-schedules" || (!approvedVehicles.length && approvedListings.length)) {
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

  useEffect(() => {
    if (loading) return;
    const targetId =
      activeService === "cabs"
        ? "scheduled-cab-trips"
        : `${activeService}-schedules`;
    if (!window.location.hash || window.location.hash.slice(1) !== targetId) return;
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    });
  }, [activeService, loading]);

  const availableServices = [
    ...(vehicles.length ? (["cabs"] as const) : []),
    ...(goodsListings.length ? (["goods-transport"] as const) : []),
    ...(packersListings.length ? (["packers-movers"] as const) : []),
  ];

  return (
    <div>
      {!loading && availableServices.length ? (
        <div
          role="tablist"
          aria-label="Special schedule"
          className="mb-2 grid grid-cols-2 border-b border-[var(--line)]"
        >
          {([
            ["form", "Add Schedule"],
            ["history", "History"],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeScheduleTab === tab}
              onClick={() => setActiveScheduleTab(tab)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeScheduleTab === tab
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--ink-soft)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="py-6 text-sm text-[var(--ink-soft)]">Checking approved services…</p> : null}

      {!loading && availableServices.length ? (
      <div role="tablist" aria-label="Special schedule service" className="flex gap-2 border-b border-[var(--line)]">
        {([
          ...(vehicles.length ? ([["cabs", "Passenger schedules"]] as const) : []),
          ...(goodsListings.length ? ([["goods-transport", "Goods Transport"]] as const) : []),
          ...(packersListings.length ? ([["packers-movers", "Packers & Movers"]] as const) : []),
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
            {id === "cabs" ? <span className="sr-only">{label}</span> : label}
          </button>
        ))}
      </div>
      ) : null}

      {!loading && activeService === "cabs" && vehicles.length ? (
        <CabSchedulesManager
          vehicles={vehicles}
          activeTab={activeScheduleTab}
          onTabChange={setActiveScheduleTab}
        />
      ) : null}
      {!loading && activeService === "goods-transport" && goodsListings.length ? (
        <GoodsTransportScheduleManager
          approvedListings={goodsListings}
          activeTab={activeScheduleTab}
          onTabChange={setActiveScheduleTab}
        />
      ) : null}
      {!loading && activeService === "packers-movers" && packersListings.length ? (
        <GoodsTransportScheduleManager
          approvedListings={packersListings}
          serviceCategory="packers-movers"
          activeTab={activeScheduleTab}
          onTabChange={setActiveScheduleTab}
        />
      ) : null}
      {!loading && !availableServices.length && !error ? (
        <p className="mt-6 rounded-xl border border-dashed border-[var(--line)] px-5 py-6 text-sm text-[var(--ink-soft)]">
          Special Schedule becomes available after an administrator approves your Cab, Public Transport, Goods Transport or Packers & Movers service.
        </p>
      ) : null}
    </div>
  );
}
