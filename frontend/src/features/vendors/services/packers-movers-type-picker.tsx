import Link from "next/link";
import { PACKERS_SERVICE_TYPES, packersServiceHref } from "./packers-movers-data";
import { cn } from "@/shared/lib/cn";

export function PackersMoversTypePicker({
  baseHref,
  selected,
  compact = false,
  title = "Packers & Movers",
  subtitle = "Home, office, local or long-distance shifting.",
}: {
  baseHref: string;
  selected?: string | null;
  compact?: boolean;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className={cn(compact ? "px-3 pt-3 md:px-7" : "px-4 py-6 md:px-0")}>
      {compact ? null : (
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Packers & Movers</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
        </div>
      )}
      <ul className={cn("grid grid-cols-3 gap-2 sm:grid-cols-5", compact ? "md:gap-3" : "md:gap-4")}>
        {PACKERS_SERVICE_TYPES.map((item) => {
          const active = selected === item.id;
          return (
            <li key={item.id}>
              <Link
                href={packersServiceHref(baseHref, item.id)}
                prefetch
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center transition md:rounded-3xl md:px-2 md:py-3",
                  active
                    ? "bg-[var(--primary-soft)] ring-2 ring-[var(--primary)]"
                    : "bg-white ring-1 ring-[var(--border)] hover:bg-[#f8fafc]",
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-2xl bg-[#f8fafc]",
                    compact ? "h-12 w-12 text-xl md:h-14 md:w-14" : "h-14 w-14 text-2xl md:h-16 md:w-16",
                  )}
                >
                  {item.emoji}
                </span>
                <span className={cn("font-medium leading-tight text-[var(--text)]", compact ? "text-[10px] md:text-xs" : "text-[11px] md:text-sm")}>
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
