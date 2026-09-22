"use client";

import { useEffect, useState } from "react";
import { Flag, MapPin } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import {
  leftoverDestinationRows,
  tourRouteStops,
  type ListingDetailRow,
} from "./listing-tab-groups";

const STEP_MS = 850;
const HOLD_MS = 700;

export function TourRouteTracker({ rows }: { rows: ListingDetailRow[] }) {
  const stops = tourRouteStops(rows);
  const leftover = leftoverDestinationRows(rows);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (stops.length < 2) return;
    const delay = lit >= stops.length ? HOLD_MS : STEP_MS;
    const id = window.setTimeout(() => {
      setLit((current) => (current >= stops.length ? 0 : current + 1));
    }, delay);
    return () => window.clearTimeout(id);
  }, [lit, stops.length]);

  useEffect(() => {
    setLit(0);
  }, [stops.length]);

  if (!stops.length) return null;

  return (
    <div className="mt-4">
      <ol className="relative" aria-label="Tour route">
        {stops.map((stop, index) => {
          const visited = lit > index;
          const arriving = lit === index;
          const last = index === stops.length - 1;
          return (
            <li
              key={`${stop.kind}-${stop.name}-${index}`}
              className="relative flex gap-3 pb-4 last:pb-0"
              aria-current={arriving ? "step" : undefined}
            >
              {!last ? (
                <span
                  aria-hidden
                  className="absolute top-8 bottom-0 left-[15px] w-px overflow-hidden bg-[#eadfcd]"
                >
                  <span
                    className={cn(
                      "absolute inset-x-0 top-0 h-full w-full origin-top bg-[#0f766e] transition-transform duration-700 ease-out",
                      visited ? "scale-y-100" : "scale-y-0",
                    )}
                  />
                </span>
              ) : null}
              <span
                className={cn(
                  "relative z-[1] mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  arriving
                    ? "route-arrive bg-[#0f766e] text-white"
                    : visited
                      ? "bg-[#0f3d38] text-white"
                      : "bg-[#f4efe4] text-[#7a6a52] ring-1 ring-[#eadfcd]",
                )}
              >
                {stop.kind === "pickup" ? (
                  <MapPin className="h-3.5 w-3.5" strokeWidth={2.4} />
                ) : stop.kind === "drop" ? (
                  <Flag className="h-3.5 w-3.5" strokeWidth={2.4} />
                ) : (
                  stops.slice(0, index).filter((item) => item.kind === "place").length + 1
                )}
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.14em]",
                    arriving || visited ? "text-[#0f766e]" : "text-[#a89880]",
                  )}
                >
                  {stop.label}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-sm font-semibold leading-5",
                    arriving || visited ? "text-[#12241f]" : "text-[#5b6e68]",
                  )}
                >
                  {stop.name}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {leftover.length ? (
        <dl className="mt-2 divide-y divide-[#efe6d4] border-t border-[#efe6d4]">
          {leftover.map((item) => (
            <div key={`${item.key}-${item.label}`} className="flex justify-between gap-4 py-3 text-sm">
              <dt className="shrink-0 text-[#7a6a52]">{item.label}</dt>
              <dd className="max-w-[65%] whitespace-pre-wrap text-right font-medium text-[#12241f]">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
