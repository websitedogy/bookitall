"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, LocateFixed, Navigation } from "lucide-react";
import { getQuickPosition } from "@/shared/lib/geo";
import {
  loadLeaflet,
  placeLeafletPin,
  type LeafletMap,
  type LeafletMarker,
  type LeafletPolyline,
} from "@/shared/lib/leaflet-map";

type Point = { lat: number; lng: number };

type Props = {
  destination: Point;
  address: string;
  externalUrl: string;
  onClose: () => void;
};

function validPoint(lat: unknown, lng: unknown): Point | null {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { lat: latitude, lng: longitude };
}

export function VendorRouteMap({ destination, address, externalUrl, onClose }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const destinationMarkerRef = useRef<LeafletMarker | null>(null);
  const originMarkerRef = useRef<LeafletMarker | null>(null);
  const routeRef = useRef<LeafletPolyline | null>(null);
  const [origin, setOrigin] = useState<Point | null>(null);
  const [locating, setLocating] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getQuickPosition(8000)
      .then((position) => {
        if (cancelled) return;
        setOrigin(validPoint(position.coords.latitude, position.coords.longitude));
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Allow location access to show your route.");
      })
      .finally(() => {
        if (!cancelled) setLocating(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let cancelled = false;
    let cleanup = () => {};

    async function boot() {
      try {
        const L = await loadLeaflet();
        if (cancelled || !el) return;
        const center = origin ?? destination;
        const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(
          [center.lat, center.lng],
          origin ? 14 : 16,
        );
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        destinationMarkerRef.current = await placeLeafletPin(map, null, destination.lat, destination.lng, "Customer");
        if (origin) {
          originMarkerRef.current = await placeLeafletPin(map, null, origin.lat, origin.lng, "You");
          const bounds = L.latLngBounds([
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ]);
          map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
          try {
            const response = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`,
            );
            if (!response.ok) throw new Error("route unavailable");
            const data = (await response.json()) as {
              routes?: Array<{ geometry?: { coordinates?: Array<[number, number]> } }>;
            };
            const coordinates = data.routes?.[0]?.geometry?.coordinates
              ?.map(([lng, lat]) => [lat, lng] as [number, number])
              .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
            if (!cancelled && coordinates?.length) {
              routeRef.current = L.polyline(coordinates, {
                color: "#1b8a4a",
                weight: 6,
                opacity: 0.9,
              }).addTo(map);
              map.fitBounds(L.latLngBounds(coordinates), { padding: [48, 48], maxZoom: 16 });
            }
          } catch {
            if (!cancelled) setError("Road route is unavailable. The two locations are still shown.");
          }
        }
        requestAnimationFrame(() => map.invalidateSize());
        cleanup = () => {
          routeRef.current?.remove();
          routeRef.current = null;
          destinationMarkerRef.current?.remove();
          destinationMarkerRef.current = null;
          originMarkerRef.current?.remove();
          originMarkerRef.current = null;
          map.remove();
          mapRef.current = null;
        };
      } catch {
        if (!cancelled) setError("Map could not be loaded. Try Google Maps instead.");
      }
    }

    void boot();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [destination, origin]);

  async function locateAgain() {
    setLocating(true);
    setError("");
    try {
      const position = await getQuickPosition(8000);
      setOrigin(validPoint(position.coords.latitude, position.coords.longitude));
    } catch {
      setError("Allow location access to show your route.");
    } finally {
      setLocating(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#e8eee8] md:items-center md:justify-center md:bg-[#071614]/50 md:p-6">
      <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#e8eee8] md:h-[min(46rem,calc(100vh-3rem))] md:max-w-5xl md:rounded-[28px] md:bg-white md:shadow-[0_28px_80px_-32px_rgba(7,22,20,0.55)]">
        <div className="relative min-h-0 flex-1">
          <div ref={hostRef} className="absolute inset-0" />
          <button
            type="button"
            aria-label="Back"
            onClick={onClose}
            className="absolute bottom-4 left-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#12241f] shadow-[0_10px_24px_-12px_rgba(7,22,20,0.55)]"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            aria-label="Use my current location"
            onClick={() => void locateAgain()}
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1b8a4a] shadow-[0_10px_24px_-12px_rgba(7,22,20,0.55)]"
          >
            <LocateFixed className="h-5 w-5" />
          </button>
        </div>
        <div className="rounded-t-[28px] bg-white px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-16px_40px_-24px_rgba(7,22,20,0.35)] md:rounded-t-none">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6f5ec] text-[#1b8a4a]">
              <Navigation className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[18px] font-semibold tracking-tight text-[#12241f]">Route to customer</h2>
              <p className="truncate text-[13px] text-[#6d7973]">{address || "Customer location"}</p>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-[#6d7973]">
            {locating ? "Finding your current location…" : origin ? "Your location to customer location" : "Customer location shown"}
          </p>
          {error ? <p className="mt-2 text-[12px] text-[#b42318]">{error}</p> : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void locateAgain()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d7e1da] text-[13px] font-semibold text-[#1b8a4a]"
            >
              <LocateFixed className="h-4 w-4" />
              {locating ? "Locating…" : "Refresh location"}
            </button>
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#1b8a4a] text-[13px] font-semibold text-white"
            >
              Open in Maps
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
