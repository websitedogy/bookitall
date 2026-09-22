"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LocateFixed, MapPin } from "lucide-react";
import type { StreetAddress } from "@/shared/lib/format-address";
import { navbarPinLabel } from "@/shared/lib/format-address";
import {
  getExactPosition,
  getQuickPosition,
  locateExactPlace,
  readRecentLocations,
  readSavedLocation,
  rememberRecentLocation,
  writeSavedLocation,
  type SavedLocation,
} from "@/shared/lib/geo";

const POPULAR_PLACES: StreetAddress[] = [
  { line1: "Hyderabad", line2: "Telangana", full: "Hyderabad, Telangana" },
  { line1: "Bengaluru", line2: "Karnataka", full: "Bengaluru, Karnataka" },
  { line1: "Goa", line2: "", full: "Goa" },
  { line1: "Chennai", line2: "Tamil Nadu", full: "Chennai, Tamil Nadu" },
  { line1: "Mumbai", line2: "Maharashtra", full: "Mumbai, Maharashtra" },
  { line1: "Vijayawada", line2: "Andhra Pradesh", full: "Vijayawada, Andhra Pradesh" },
  { line1: "Delhi", line2: "Delhi", full: "Delhi" },
  { line1: "Pune", line2: "Maharashtra", full: "Pune, Maharashtra" },
];

function pickPopular(recent: StreetAddress[], min = 5) {
  const recentKeys = new Set(recent.map(placeKey));
  const unused = POPULAR_PLACES.filter((place) => !recentKeys.has(placeKey(place)));
  const extra = POPULAR_PLACES.filter((place) => recentKeys.has(placeKey(place)));
  return [...unused, ...extra].slice(0, Math.max(min, unused.length));
}

type SearchHit = StreetAddress & { lat: number; lng: number };

function placeKey(place: StreetAddress) {
  return (place.full || place.line1).trim().toLowerCase();
}

export function LiveLocation() {
  const [place, setPlace] = useState<StreetAddress | null>(null);
  const [recent, setRecent] = useState<SavedLocation[]>([]);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = readSavedLocation();
    if (saved) setPlace(saved);
    setRecent(readRecentLocations());
    if (!saved?.houseNumber && !saved?.buildingName) void detect();
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      return;
    }
    window.setTimeout(() => inputRef.current?.focus(), 0);
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as SearchHit[];
        setHits(Array.isArray(data) ? data : []);
      } catch {
        setHits([]);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  function remember(next: SavedLocation, addRecent = true) {
    setPlace(next);
    writeSavedLocation(next);
    if (addRecent) {
      rememberRecentLocation(next);
      setRecent(readRecentLocations());
    }
  }

  async function detect(addRecent = false) {
    if (!navigator.geolocation) return;
    setBusy(true);
    try {
      const position = await getExactPosition(12000).catch(() => getQuickPosition(6000));
      const data = await locateExactPlace(position.coords.latitude, position.coords.longitude);
      remember(
        {
          ...data,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: "gps",
        },
        addRecent,
      );
    } catch {
      // Keep current pin if GPS fails.
    } finally {
      setBusy(false);
    }
  }

  const label = busy ? "Detecting…" : place ? navbarPinLabel(place) : "Your location";
  const currentHint = busy ? "Finding your area…" : place?.full || place?.line1 || "Detect your area";
  const searching = query.trim().length >= 2;
  const popular = pickPopular(recent);

  return (
    <div ref={rootRef} className="font-location relative ml-auto w-[min(100%,9.75rem)] shrink-0 md:ml-0 md:w-[15.75rem]">
      <label className="flex h-8 w-full items-center gap-1.5 rounded-full border border-[#1e3a5f]/35 bg-white px-2.5 shadow-[0_1px_0_rgba(15,23,42,0.02)] md:h-9 md:gap-2 md:px-3">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#2b7cff] md:h-4 md:w-4" aria-hidden />
        <input
          ref={inputRef}
          value={open ? query : label}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!open) setQuery("");
            setOpen(true);
          }}
          placeholder="Search area, city, street"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Search location"
          className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#2563eb] outline-none placeholder:font-normal placeholder:text-[#93c5fd] md:text-[13px]"
        />
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[#9ca3af] md:h-6 md:w-6"
          aria-label={open ? "Close location options" : "Open location options"}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </label>

      {open ? (
        <div
          role="listbox"
          aria-label="Choose location"
          className="absolute right-0 z-50 mt-1.5 max-h-[22rem] w-[min(20.5rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-[#e5e7eb] bg-white py-1 shadow-[0_16px_40px_-18px_rgba(21,32,43,0.38)]"
        >
          <button
            type="button"
            className="flex w-full items-start gap-3 px-3.5 py-3 text-left hover:bg-[#f8fafc]"
            onClick={() => {
              setOpen(false);
              void detect(true);
            }}
          >
            <LocateFixed className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[#2563eb]">{busy ? "Detecting GPS…" : "Use current location"}</span>
              <span className="mt-0.5 block truncate text-[12px] leading-snug text-[#60a5fa]">{currentHint}</span>
            </span>
          </button>

          {searching ? (
            <>
              <div className="mx-3 border-t border-[#eef2f6]" />
              <p className="px-3.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                Search results
              </p>
              {hits.map((hit) => (
                <button
                  key={`${hit.full}-${hit.lat}`}
                  type="button"
                  role="option"
                  className="flex w-full items-start gap-3 px-3.5 py-2.5 text-left hover:bg-[#f8fafc]"
                  onClick={() => {
                    remember({ ...hit, source: "search" });
                    setOpen(false);
                  }}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9ca3af]" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-[#111827]">{navbarPinLabel(hit)}</span>
                    {hit.line2 || hit.full !== navbarPinLabel(hit) ? (
                      <span className="mt-0.5 block truncate text-[12px] text-[#9ca3af]">{hit.line2 || hit.full}</span>
                    ) : null}
                  </span>
                </button>
              ))}
              {hits.length === 0 ? (
                <p className="px-3.5 py-2.5 text-xs text-[#9ca3af]">No match. Try an area, city, or street.</p>
              ) : null}
            </>
          ) : (
            <>
              {recent.length > 0 ? (
                <>
                  <div className="mx-3 border-t border-[#eef2f6]" />
                  <p className="px-3.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                    Recent locations
                  </p>
                  {recent.map((item) => (
                    <button
                      key={placeKey(item)}
                      type="button"
                      role="option"
                      aria-selected={place ? placeKey(place) === placeKey(item) : false}
                      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#f8fafc]"
                      onClick={() => {
                        remember(item);
                        setOpen(false);
                      }}
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-[#9ca3af]" aria-hidden />
                      <span className="min-w-0 truncate text-sm text-[#111827]">{navbarPinLabel(item)}</span>
                    </button>
                  ))}
                </>
              ) : null}

              {popular.length > 0 ? (
                <>
                  <div className="mx-3 border-t border-[#eef2f6]" />
                  <p className="px-3.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                    Popular locations
                  </p>
                  {popular.map((cityPlace) => {
                    const active = place ? placeKey(place) === placeKey(cityPlace) : false;
                    return (
                      <button
                        key={cityPlace.full}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#f8fafc]"
                        onClick={() => {
                          remember({ ...cityPlace, source: "city" });
                          setOpen(false);
                        }}
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-[#9ca3af]" aria-hidden />
                        <span className="min-w-0 truncate text-sm text-[#111827]">{cityPlace.line1}</span>
                      </button>
                    );
                  })}
                </>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
