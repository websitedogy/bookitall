"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, LocateFixed, Navigation, X } from "lucide-react";
import { getExactPosition, locateExactPlace } from "@/shared/lib/geo";
import { withBuildingDetails } from "@/shared/lib/format-address";
import { loadLeaflet, placeLeafletPin, type LeafletMap, type LeafletMarker } from "@/shared/lib/leaflet-map";
import { districtNameFromLabel, geocodeVendorAddress } from "./detect-exact-location";

export type VendorPickedLocation = {
  label: string;
  lat: number | null;
  lng: number | null;
  districtName?: string;
};

type Props = {
  initialLabel: string;
  initialLat: number | null;
  initialLng: number | null;
  pinLabel?: string;
  onClose: () => void;
  onConfirm: (found: VendorPickedLocation) => void;
};

const DEFAULT_CENTER = { lat: 17.385044, lng: 78.486671 };
const inputClass =
  "mt-0 w-full rounded-xl border-0 bg-white px-3 py-2.5 text-sm text-[#12241f] outline-none ring-1 ring-[#eadfcd] placeholder:text-[#a89880] focus:ring-[#1b8a4a]";

export function VendorLocationPopup({ initialLabel, initialLat, initialLng, pinLabel = "Your location", onClose, onConfirm }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const pinSource = useRef<"none" | "gps" | "map">(initialLat != null && initialLng != null ? "map" : "none");
  const applyCoordsRef = useRef<(nextLat: number, nextLng: number, fly: boolean) => Promise<void>>(async () => {});
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [mounted, setMounted] = useState(false);
  const [houseNumber, setHouseNumber] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [address, setAddress] = useState(initialLabel);
  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!mounted || !el) return;
    let cancelled = false;
    let cleanup = () => {};

    async function boot() {
      const L = await loadLeaflet();
      if (cancelled || !el) return;
      const startLat = initialLat ?? DEFAULT_CENTER.lat;
      const startLng = initialLng ?? DEFAULT_CENTER.lng;
      const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(
        [startLat, startLng],
        initialLat != null && initialLng != null ? 18 : 12,
      );
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      if (initialLat != null && initialLng != null) {
        await placePin(initialLat, initialLng, pinLabel);
      }
      const onDragEnd = () => {
        const center = map.getCenter();
        pinSource.current = "map";
        void applyCoordsRef.current(center.lat, center.lng, false);
      };
      map.on("dragend", onDragEnd);
      requestAnimationFrame(() => map.invalidateSize());
      cleanup = () => {
        map.off("dragend", onDragEnd);
        markerRef.current?.remove();
        markerRef.current = null;
        map.remove();
        mapRef.current = null;
      };
    }

    void boot();
    return () => {
      cancelled = true;
      cleanup();
    };
    // Map boots once when the popup mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const refresh = () => mapRef.current?.invalidateSize();
    const timer = window.setTimeout(refresh, 80);
    window.addEventListener("resize", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", refresh);
    };
  }, [mounted]);

  async function placePin(nextLat: number, nextLng: number, label: string) {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current = await placeLeafletPin(map, markerRef.current, nextLat, nextLng, label);
  }

  async function applyCoords(nextLat: number, nextLng: number, fly: boolean) {
    setLat(nextLat);
    setLng(nextLng);
    if (mapRef.current) {
      if (fly) mapRef.current.setView([nextLat, nextLng], 18);
      await placePin(nextLat, nextLng, pinLabel);
    }
    setResolving(true);
    try {
      const place = await locateExactPlace(nextLat, nextLng);
      if (place.houseNumber?.trim()) setHouseNumber(place.houseNumber);
      if (place.buildingName?.trim()) setBuildingName(place.buildingName);
      setAddress(place.full || [place.line1, place.line2].filter(Boolean).join(", ") || `${nextLat.toFixed(6)}, ${nextLng.toFixed(6)}`);
    } catch {
      setAddress(`${nextLat.toFixed(6)}, ${nextLng.toFixed(6)}`);
    } finally {
      setResolving(false);
    }
  }
  applyCoordsRef.current = applyCoords;

  async function useCurrentLocation() {
    setLocating(true);
    setError("");
    try {
      const pos = await getExactPosition(15000);
      pinSource.current = "gps";
      await applyCoords(pos.coords.latitude, pos.coords.longitude, true);
    } catch {
      setError("Allow location access, or enter the address below.");
    } finally {
      setLocating(false);
    }
  }

  async function confirm() {
    const label = withBuildingDetails(houseNumber, buildingName, address).trim();
    if (!label) {
      setError("Use current location, or enter the hotel address.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let pinLat = lat;
      let pinLng = lng;
      if (pinSource.current === "none" || pinLat == null || pinLng == null) {
        const pin = await geocodeVendorAddress(label);
        pinLat = pin?.lat ?? null;
        pinLng = pin?.lng ?? null;
      }
      onConfirm({
        label,
        lat: pinLat,
        lng: pinLng,
        districtName: districtNameFromLabel(label),
      });
    } catch {
      setError("Could not save this location. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  const busy = locating || resolving;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-stretch bg-[#e8eee8] md:items-center md:justify-center md:bg-[#071614]/50 md:p-6">
      <button type="button" className="absolute inset-0 hidden md:block" aria-label="Close" onClick={onClose} />
      <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#e8eee8] md:h-[min(42rem,calc(100vh-3rem))] md:max-w-5xl md:flex-row md:rounded-[28px] md:bg-white md:shadow-[0_28px_80px_-32px_rgba(7,22,20,0.55)]">
        <div className="relative min-h-0 flex-1 md:min-w-0">
          <div ref={hostRef} className="absolute inset-0 z-0" />
          {lat == null || lng == null ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex -translate-y-7 flex-col items-center">
                <span className="rounded-full bg-[#1b8a4a] px-3 py-1 text-[12px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(15,61,56,0.7)]">
                  {pinLabel}
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
            onClick={onClose}
            className="absolute bottom-4 left-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#12241f] shadow-[0_10px_24px_-12px_rgba(7,22,20,0.55)] md:hidden"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            disabled={locating}
            onClick={() => void useCurrentLocation()}
            className="absolute bottom-4 right-4 z-10 inline-flex h-11 items-center gap-2 rounded-full bg-white px-3.5 text-sm font-semibold text-[#12241f] shadow-[0_10px_24px_-12px_rgba(7,22,20,0.55)] disabled:opacity-60"
          >
            <LocateFixed className="h-4 w-4 text-[#2b7cff]" strokeWidth={2.2} aria-hidden />
            {locating ? "Finding…" : "Current location"}
          </button>
        </div>

        <div className="flex max-h-[58%] min-h-0 flex-col rounded-t-[28px] bg-white shadow-[0_-16px_40px_-24px_rgba(7,22,20,0.35)] md:max-h-none md:h-full md:w-[24.5rem] md:shrink-0 md:rounded-none md:shadow-none">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 md:px-6 md:pt-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-semibold tracking-tight text-[#12241f]">Property location</h2>
                <p className="mt-0.5 text-[13px] text-[#8a8f8c]">Pin on the map, use current location, or type the address.</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4efe4] text-[#5b6e68] md:inline-flex"
              >
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>

            <button
              type="button"
              disabled={locating}
              onClick={() => void useCurrentLocation()}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0f3d38] text-sm font-semibold text-white disabled:opacity-60"
            >
              <LocateFixed className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              {locating ? "Detecting current location…" : "Use current location"}
            </button>

            <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b3a48c]">
              <span className="h-px flex-1 bg-[#efe6d4]" />
              or
              <span className="h-px flex-1 bg-[#efe6d4]" />
            </div>

            <div className="space-y-2.5 rounded-2xl bg-[#f7f3ea] p-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-[#7a6a52]">House / plot</span>
                  <input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} placeholder="12A" className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-[#7a6a52]">Building</span>
                  <input value={buildingName} onChange={(e) => setBuildingName(e.target.value)} placeholder="Name" className={inputClass} />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-[#7a6a52]">Street, area, city</span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Road, area, city"
                  className={`${inputClass} resize-none`}
                />
              </label>
              <p className="truncate px-0.5 text-[13px] text-[#3d4f4a]">
                {locating ? "Finding your current location…" : resolving ? "Updating area…" : address || "Move the map or type the address."}
              </p>
            </div>
          </div>
          <div className="shrink-0 px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-3 md:px-6 md:pb-6">
            {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={busy || saving}
              onClick={() => void confirm()}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#f5c400] text-[16px] font-semibold text-[#12241f] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Use this location"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
