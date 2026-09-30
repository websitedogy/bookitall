"use client";

import { Heart } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useSaved, useSavedReady, type SavedListing } from "./store";

export function WishlistButton({
  item,
  className,
  labeled = false,
}: {
  item: SavedListing;
  className?: string;
  labeled?: boolean;
}) {
  const ready = useSavedReady();
  const saved = useSaved((s) => s.items.some((row) => row.id === item.id));
  const toggle = useSaved((s) => s.toggle);
  const on = ready && saved;

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Saved" : "Save"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(item);
      }}
      className={cn(
        labeled
          ? "inline-flex h-8 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200"
          : "inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm ring-1 ring-black/5 hover:bg-white",
        on && "text-rose-500",
        className,
      )}
    >
      <Heart className="h-4 w-4" strokeWidth={2} fill={on ? "currentColor" : "none"} aria-hidden />
      {labeled ? <span>{on ? "Saved" : "Save"}</span> : null}
    </button>
  );
}
