"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/features/auth/store";
import type { Vehicle } from "@/shared/types/catalog";
import { CabSchedulesManager } from "@/features/vendors/services/cab-schedules-manager";

export default function PartnerListingsPage() {
  const token = useAuth((s) => s.accessToken);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [vehicleError, setVehicleError] = useState("");

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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Cab services</p>
        <h1 className="serif mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Scheduled cab trips</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
          Post upcoming journeys, offer available seats, and manage passenger requests.
        </p>
      </div>

      {vehicleError ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {vehicleError}
        </p>
      ) : isLoadingVehicles ? (
        <p className="text-sm text-[var(--ink-soft)]">Loading your registered cabs…</p>
      ) : (
        <CabSchedulesManager vehicles={vehicles} />
      )}
    </div>
  );
}
