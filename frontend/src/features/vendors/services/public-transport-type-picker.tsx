import Link from "next/link";
import { CategoryArt } from "@/features/home/components/category-art";
import { PUBLIC_TRANSPORT_TYPES, publicTransportTypeHref } from "./public-transport-data";
import { PublicTransportIcon } from "./public-transport-icons";
import { cn } from "@/shared/lib/cn";

function packersHref(baseHref: string) {
  return baseHref.includes("/vendors/") ? "/vendors/services/packers-movers" : "/packers-movers/hyderabad";
}

export function PublicTransportTypePicker({
  baseHref,
  selected,
  compact = false,
  title = "Cabs",
  subtitle = "Auto, Car, Mini Bus, Bus, Van, or Packers & Movers.",
  kicker = "Cabs",
}: {
  baseHref: string;
  selected?: string | null;
  compact?: boolean;
  title?: string;
  subtitle?: string;
  kicker?: string | null;
}) {
  return (
    <section className={cn(compact ? "px-3 pt-3 md:px-7" : "px-4 py-6 md:px-0")}>
      {compact ? null : (
        <div className="mb-5">
          {kicker ? <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">{kicker}</p> : null}
          <h1 className={cn("font-semibold tracking-tight", kicker ? "mt-1 text-[22px] md:text-3xl" : "text-[18px] md:text-xl")}>{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
        </div>
      )}
      <ul className={cn("grid grid-cols-3 md:grid-cols-6", compact ? "gap-1.5 md:gap-3" : "gap-2 md:gap-4")}>
        {PUBLIC_TRANSPORT_TYPES.map((item) => {
          const active = selected === item.id;
          return (
            <li key={item.id}>
              <Link
                href={publicTransportTypeHref(baseHref, item.id)}
                prefetch
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center transition md:rounded-3xl md:px-2 md:py-3",
                  active
                    ? "bg-[var(--primary-soft)] ring-2 ring-[var(--primary)]"
                    : "bg-white ring-1 ring-[var(--border)] hover:bg-[#f8fafc]",
                )}
              >
                <span className={cn("overflow-hidden rounded-2xl", compact ? "h-12 w-12 md:h-16 md:w-16" : "h-14 w-14 md:h-20 md:w-20")}>
                  <PublicTransportIcon id={item.id} />
                </span>
                <span className={cn("font-medium leading-tight text-[var(--text)]", compact ? "text-[10px] md:text-xs" : "text-[11px] md:text-sm")}>
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href={packersHref(baseHref)}
            prefetch
            className="flex h-full flex-col items-center gap-1.5 rounded-2xl bg-white px-1 py-2 text-center ring-1 ring-[var(--border)] transition hover:bg-[#f8fafc] md:rounded-3xl md:px-2 md:py-3"
          >
            <span className={cn("overflow-hidden rounded-2xl", compact ? "h-12 w-12 md:h-16 md:w-16" : "h-14 w-14 md:h-20 md:w-20")}>
              <CategoryArt id="packers-movers" size={80} className="h-full w-full object-contain" />
            </span>
            <span className={cn("font-medium leading-tight text-[var(--text)]", compact ? "text-[10px] md:text-xs" : "text-[11px] md:text-sm")}>
              Packers & Movers
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
