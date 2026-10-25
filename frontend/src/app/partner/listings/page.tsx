"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import type { Vehicle } from "@/shared/types/catalog";
import { CabSchedulesManager } from "@/features/vendors/services/cab-schedules-manager";
import { GoodsTransportScheduleManager } from "@/features/vendors/services/goods-transport-schedule-manager";

export default function PartnerListingsPage() {
  const token = useAuth((s) => s.accessToken);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [vehicleError, setVehicleError] = useState("");
  const [activeService, setActiveService] = useState<"cabs" | "goods-transport">("cabs");

  useEffect(() => {
    if (!token) return;
    let active = true;
    api<Vehicle[]>("/cabs/mine", { token })
      .then((result) => {
        if (active) setVehicles(result.data ?? []);
      })
      .catch((cause: unknown) => {
        if (active) {
          setVehicleError(cause instanceof Error ? cause.message : "Could not load your registered cabs.");
        }
      })
      .finally(() => {
        if (active) setIsLoadingVehicles(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div>
      <div className="mb-8 border-b border-[var(--line)] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">My Services</p>
        <h1 className="serif mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Special Schedule</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
          Post and manage upcoming routes for your cab and Goods Transport services.
        </p>
      </div>

      <div role="tablist" aria-label="Special schedule service" className="flex gap-2 border-b border-[var(--line)]">
        {([
          ["cabs", "Cabs"],
          ["goods-transport", "Goods Transport"],
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

      {activeService === "cabs" ? (
        vehicleError ? (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{vehicleError}</p>
        ) : isLoadingVehicles ? (
          <p className="mt-6 text-sm text-[var(--ink-soft)]">Loading your registered cabs…</p>
        ) : (
          <CabSchedulesManager vehicles={vehicles} />
        )
      ) : (
        <GoodsTransportScheduleManager />
      )}
    </div>
  );
}
