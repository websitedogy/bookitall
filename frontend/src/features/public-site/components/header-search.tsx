"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { HOME_SERVICES_PATH, publicBrowsePath } from "@/shared/lib/public-paths";
import { useServiceCatalog } from "@/features/services/service-catalog-provider";

function destinationForQuery(query: string, isEnabled: (slug: string) => boolean) {
  const value = query.toLowerCase();
  const pick = (slug: string, fallback = HOME_SERVICES_PATH) => (isEnabled(slug) ? publicBrowsePath(slug) : fallback);
  if (/(tour|package|tirupati|honeymoon|pilgrim)/.test(value)) return pick("tours");
  if (/(cab|ride|outstation|rental|car)/.test(value)) return pick("cabs");
  if (/(job|consult|resume|placement|hiring)/.test(value)) return pick("jobs");
  if (/(auto|bus|share cab|public transport)/.test(value)) return pick("public-transport");
  if (/(goods|freight|lorry|mini truck|pickup)/.test(value)) return pick("goods-transport");
  if (/(packer|mover|shifting|house shift)/.test(value)) return pick("packers-movers");
  if (/(cloud kitchen|kitchen|catering|tiffin)/.test(value)) return pick("cloud-kitchen");
  if (/(ac|repair|plumb|electric|clean|beaut|paint|carpenter|appliance|fridge|home)/.test(value)) {
    return HOME_SERVICES_PATH;
  }
  return pick("hotels");
}

export function HeaderSearch({ inputId = "header-search" }: { inputId?: string }) {
  const router = useRouter();
  const { isEnabled } = useServiceCatalog();
  const [query, setQuery] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const path = destinationForQuery(query, isEnabled);
    const params = new URLSearchParams({ city: "Hyderabad" });
    if (query.trim()) params.set("q", query.trim());
    router.push(`${path}?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="min-w-0 flex-1 md:w-[22rem] md:max-w-[22rem] md:flex-none lg:w-[26rem] lg:max-w-[26rem]" role="search">
      <label htmlFor={inputId} className="sr-only">
        Search hotels, tours, cabs and home services
      </label>
      <div className="flex h-9 items-center rounded-full border border-[var(--border)] bg-[#f8fafc] px-3 md:bg-white">
        <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
        <input
          id={inputId}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Search "Hotels"'
          className="min-w-0 flex-1 bg-transparent px-2 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>
    </form>
  );
}
