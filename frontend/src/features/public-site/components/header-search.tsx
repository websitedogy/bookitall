"use client";

import { FormEvent, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SERVICE_NAV } from "@/features/home/service-nav";
import { useServiceCatalog } from "@/features/services/service-catalog-provider";
import { API_URL } from "@/shared/lib/api";
import type { PublicListingPost } from "@/shared/lib/catalog-fetch";
import { ListingThumb } from "@/shared/ui/listing-thumb";

const CATEGORY_WORDS: Record<string, string[]> = {
  hotels: ["hotel", "hotels", "stay", "room", "lodge", "resort"],
  tours: ["tour", "tours", "package", "tirupati", "honeymoon", "pilgrim"],
  cabs: ["cab", "cabs", "taxi", "ride", "outstation", "car"],
  electrician: ["electrician", "electric", "wiring"],
  plumber: ["plumber", "plumbing", "pipe"],
  ac: ["ac", "air conditioner", "cooling"],
  cleaning: ["cleaning", "cleaner", "housekeeping"],
  jobs: ["job", "jobs", "hiring", "vacancy"],
  beautician: ["beauty", "beautician", "salon", "makeup"],
  painting: ["painting", "painter"],
  carpenter: ["carpenter", "furniture", "wood"],
  appliance: ["appliance", "fridge", "washing machine"],
  "public-transport": ["bus", "auto", "public transport"],
  "goods-transport": ["goods", "freight", "lorry", "truck"],
  "packers-movers": ["packer", "movers", "shifting", "relocation"],
  "cloud-kitchen": ["kitchen", "catering", "tiffin", "food"],
};

type Suggestion =
  | { key: string; kind: "query"; label: string; href: string }
  | { key: string; kind: "listing"; label: string; href: string; meta: string; image?: string; categoryId: string };

function searchHref(query: string) {
  return `/search?q=${encodeURIComponent(query.trim())}`;
}

function categorySuggestions(query: string, isEnabled: (slug: string) => boolean): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return SERVICE_NAV.flatMap((item) => {
    if (!isEnabled(item.id)) return [];
    const name = item.name.toLowerCase();
    const aliasHit =
      q.length >= 3 &&
      (CATEGORY_WORDS[item.id] ?? []).some((word) => word.startsWith(q) || q.startsWith(word));
    if (!name.includes(q) && !aliasHit) return [];
    return [{ key: `cat-${item.id}`, kind: "query" as const, label: item.name, href: item.href }];
  });
}

function listingSuggestions(rows: PublicListingPost[]): Suggestion[] {
  return rows.slice(0, 6).map((row) => ({
    key: `listing-${row.id}`,
    kind: "listing" as const,
    label: row.title,
    href: row.canonicalPath || row.href,
    meta: [row.category, row.location].filter(Boolean).join(" · "),
    image: row.image,
    categoryId: row.categoryId || row.category || "hotels",
  }));
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (!q || index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent font-semibold text-[var(--text)]">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  );
}

export function HeaderSearch({ inputId = "header-search" }: { inputId?: string }) {
  const router = useRouter();
  const { isEnabled } = useServiceCatalog();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<PublicListingPost[]>([]);
  const [active, setActive] = useState(0);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  const suggestions = [
    ...(query.trim()
      ? [{ key: "typed", kind: "query" as const, label: query.trim(), href: searchHref(query) }]
      : []),
    ...categorySuggestions(query, isEnabled),
    ...listingSuggestions(listings.filter((row) => `${row.title} ${row.category}`.toLowerCase().includes(query.trim().toLowerCase()) || (query.trim().length >= 3 && (row.location || "").toLowerCase().includes(query.trim().toLowerCase())))),
  ]
    .filter((item, index, all) => all.findIndex((other) => other.key === item.key) === index)
    .slice(0, 8);
  const showList = open && query.trim().length > 0;

  useLayoutEffect(() => {
    if (!showList) return;
    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setBox({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [showList, query, suggestions.length]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setListings([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`${API_URL}/vendor-listings?q=${encodeURIComponent(q)}`, { cache: "no-store", signal: controller.signal })
        .then((res) => res.json() as Promise<{ data?: PublicListingPost[] }>)
        .then((json) => {
          setListings(Array.isArray(json.data) ? json.data : []);
          setActive(0);
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === "AbortError") return;
          setListings([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const picked = suggestions[active];
    if (open && picked) {
      go(picked.href);
      return;
    }
    const q = query.trim();
    if (!q) return;
    go(searchHref(q));
  }

  const suggestionList =
    showList && box
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            style={{ position: "fixed", top: box.top, left: box.left, width: box.width, zIndex: 100 }}
            className="max-h-80 overflow-auto rounded-2xl border border-[var(--border)] bg-white py-1 shadow-lg"
          >
            {suggestions.map((item, index) => (
              <li key={item.key} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => go(item.href)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left ${index === active ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--primary-soft)]"}`}
                >
                  {item.kind === "listing" ? (
                    <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[var(--studio)]">
                      <ListingThumb src={item.image} categoryId={item.categoryId} alt="" className="h-full w-full object-cover" />
                    </span>
                  ) : (
                    <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] text-[var(--text-muted)]">
                      <Highlight text={item.label} query={query} />
                    </span>
                    {item.kind === "listing" && item.meta ? (
                      <span className="block truncate text-[11px] text-[var(--text-muted)]">{item.meta}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
            {loading && !listings.length ? (
              <li className="px-3 py-2 text-[12px] text-[var(--text-muted)]">Looking for matches…</li>
            ) : null}
            {!loading && suggestions.length <= 1 && listings.length === 0 ? (
              <li className="px-3 py-2 text-[12px] text-[var(--text-muted)]">No similar listings yet. Press enter to search.</li>
            ) : null}
          </ul>,
          document.body,
        )
      : null;

  return (
    <form
      ref={rootRef}
      onSubmit={onSubmit}
      className="relative min-w-0 flex-1 md:w-[22rem] md:max-w-[22rem] md:flex-none lg:w-[26rem] lg:max-w-[26rem]"
      role="search"
    >
      <label htmlFor={inputId} className="sr-only">
        Search hotels, tours, cabs and home services
      </label>
      <div className="flex h-9 items-center rounded-full border border-[var(--border)] bg-[#f8fafc] px-3 md:bg-white">
        <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
        <input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (!showList || !suggestions.length) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => (index + 1) % suggestions.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => (index - 1 + suggestions.length) % suggestions.length);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder='Search "Hotels"'
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          suppressHydrationWarning
          className="min-w-0 flex-1 bg-transparent px-2 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>
      {suggestionList}
    </form>
  );
}
