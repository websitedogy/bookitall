import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function InnerPageShell({
  kicker,
  title,
  subtitle,
  tabs,
  breadcrumbs,
  children,
  className,
  titleStyle = "heading",
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  tabs?: ReactNode;
  breadcrumbs?: ReactNode;
  children: ReactNode;
  className?: string;
  titleStyle?: "heading" | "badge";
}) {
  const badge = titleStyle === "badge";
  return (
    <div
      className={cn(
        "min-h-full bg-[var(--studio)] md:bg-white md:ring-1 md:ring-[var(--studio-line)]",
        className,
      )}
    >
      {breadcrumbs}
      <header
        className={cn(
          "sticky top-0 z-20 border-b border-[var(--studio-line)] bg-[var(--studio)]/92 pl-12 pr-4 backdrop-blur-md md:static md:border-0 md:bg-transparent md:px-7",
          badge ? "md:pt-4 md:pb-1" : "md:pt-3 md:pb-3",
        )}
      >
        <div className={cn("flex h-14 md:h-auto", badge ? "items-center" : "flex-col justify-center")}>
          {kicker && !badge ? (
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)] md:block">
              {kicker}
            </p>
          ) : null}
          <h1
            className={
              badge
                ? "inline-flex max-w-full truncate rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[12px] font-semibold tracking-wide text-[var(--primary)]"
                : "truncate text-[18px] font-semibold tracking-[-0.03em] text-[var(--studio-ink)] md:mt-1 md:text-[28px]"
            }
          >
            {title}
          </h1>
          {subtitle && !badge ? <p className="mt-1 hidden text-sm text-[var(--studio-muted)] md:block">{subtitle}</p> : null}
        </div>
      </header>
      {tabs}
      {children}
    </div>
  );
}
