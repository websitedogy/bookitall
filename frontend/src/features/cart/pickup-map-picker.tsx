"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Navigation } from "lucide-react";
import { loadLeaflet, placeLeafletPin, type LeafletMap, type LeafletMarker } from "@/shared/lib/leaflet-map";

type Props = {
  lat: number | null;
  lng: number | null;
  houseNumber: string;
  buildingName: string;
  address: string;
  locating: boolean;
  resolving: boolean;
  error: string;
  pickup: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onHouse: (value: string) => void;
  onBuilding: (value: string) => void;
  onMoved: (lat: number, lng: number) => void;
};

function streetLine(houseNumber: string, buildingName: string, address: string) {
  const skip = [houseNumber, buildingName].map((v) => v.trim().toLowerCase()).filter(Boolean);
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && !skip.includes(part.toLowerCase()));
  return parts.join(", ") || address;
}

export function PickupMapPicker({
  lat,
  lng,
  houseNumber,
  buildingName,
  address,
  locating,
  resolving,
  error,
  pickup,
  onBack,
  onConfirm,
  onHouse,
  onBuilding,
  onMoved,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const skipMove = useRef(true);
  const onMovedRef = useRef(onMoved);
  const start = useRef<{ lat: number; lng: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const hasFix = lat != null && lng != null;
  onMovedRef.current = onMoved;
  if (hasFix && !start.current && lat != null && lng != null) start.current = { lat, lng };

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    const origin = start.current;
    if (!el || !origin) return;
    const originLat = origin.lat;
    const originLng = origin.lng;
    let cancelled = false;
    let cleanup = () => {};

    async function boot() {
      const L = await loadLeaflet();
      if (cancelled || !el) return;
      const map: LeafletMap = L.map(el, { zoomControl: false, attributionControl: false }).setView([originLat, originLng], 18);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      markerRef.current = await placeLeafletPin(map, null, originLat, originLng, pickup ? "Pickup Point" : "Your location");
      const onMoveEnd = () => {
        if (skipMove.current) {
          skipMove.current = false;
          return;
        }
        const center = map.getCenter();
        if (markerRef.current) markerRef.current.setLatLng([center.lat, center.lng]);
        onMovedRef.current(center.lat, center.lng);
      };
      map.on("moveend", onMoveEnd);
      requestAnimationFrame(() => map.invalidateSize());
      cleanup = () => {
        map.off("moveend", onMoveEnd);
        markerRef.current?.remove();
        markerRef.current = null;
        mapRef.current = null;
        map.remove();
      };
    }

    void boot();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [hasFix]);

  if (!mounted) return null;

  const title = pickup ? "Select a pickup point" : "Select your location";
  const pin = pickup ? "Pickup Point" : "Your location";
  const confirm = pickup ? "Confirm pickup" : "Confirm location";
  const ready = lat != null && lng != null && !locating;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#e8eee8]">
      <div className="relative min-h-0 flex-1">
        {ready ? <div ref={hostRef} className="absolute inset-0 z-0" /> : <div className="absolute inset-0 animate-pulse bg-[#d7e0d6]" />}
        {!ready ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex -translate-y-7 flex-col items-center">
              <span className="rounded-full bg-[#1b8a4a] px-3 py-1 text-[12px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(15,61,56,0.7)]">
                {pin}
              </span>
              <span className="mt-1.5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2b7cff] text-white shadow-[0_8px_18px_-8px_rgba(43,124,255,0.85)] ring-4 ring-white">
                <Navigation className="h-5 w-5 translate-x-[1px] -translate-y-[1px]" strokeWidth={2.6} aria-hidden />
              </span>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="absolute bottom-4 left-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#12241f] shadow-[0_10px_24px_-12px_rgba(7,22,20,0.55)]"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </div>

      <div className="rounded-t-[28px] bg-white px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-16px_40px_-24px_rgba(7,22,20,0.35)]">
        <h2 className="text-[20px] font-semibold tracking-tight text-[#12241f]">{title}</h2>
        <p className="mt-0.5 text-[13px] text-[#8a8f8c]">House and building come from your pin.</p>
        <div className="mt-3 space-y-2 rounded-2xl border border-[#1b8a4a] px-3 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-medium text-[#5b6e68]">House / flat</p>
              <p className="mt-0.5 text-[15px] font-semibold text-[#12241f]">
                {locating || resolving ? "Finding…" : houseNumber.trim() || "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#5b6e68]">Building</p>
              <p className="mt-0.5 text-[15px] font-semibold text-[#12241f]">
                {locating || resolving ? "Finding…" : buildingName.trim() || "—"}
              </p>
            </div>
          </div>
          {!locating && !resolving && (!houseNumber.trim() || !buildingName.trim()) ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {!houseNumber.trim() ? (
                <input value={houseNumber} onChange={(e) => onHouse(e.target.value)} placeholder="House / flat" className={mapInput} />
              ) : null}
              {!buildingName.trim() ? (
                <input value={buildingName} onChange={(e) => onBuilding(e.target.value)} placeholder="Building name" className={mapInput} />
              ) : null}
            </div>
          ) : null}
          <p className="truncate px-0.5 text-[13px] text-[#3d4f4a]">
            {locating ? "Finding your exact location…" : resolving ? "Updating area…" : streetLine(houseNumber, buildingName, address)}
          </p>
        </div>
        {error ? <p className="mt-2 text-sm text-[var(--error)]">{error}</p> : null}
        <button
          type="button"
          disabled={!ready || locating}
          onClick={onConfirm}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#f5c400] text-[16px] font-semibold text-[#12241f] disabled:opacity-50"
        >
          {confirm}
        </button>
      </div>
    </div>,
    document.body,
  );
}

const mapInput =
  "w-full rounded-xl border-0 bg-[#f7f3ea] px-3 py-2.5 text-sm text-[#12241f] outline-none ring-1 ring-[#eadfcd] placeholder:text-[#a89880] focus:bg-white focus:ring-[#1b8a4a]";
