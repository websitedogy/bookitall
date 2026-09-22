"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";
import { useVisibleServices } from "@/features/services/service-catalog-provider";
import { CategoryArt } from "@/features/home/components/category-art";
import { cn } from "@/shared/lib/cn";

export function ServicesSidebar() {
  const pathname = usePathname();
  const items = useVisibleServices();
  const homeActive = pathname === "/";

  return (
    <aside className="hidden md:block">
      <div className="sticky top-24 bg-white p-4 ring-1 ring-[var(--studio-line)]">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">All services</p>
        <nav aria-label="All services" className="mt-3 grid gap-0.5">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 px-2 py-2 text-sm transition",
              homeActive
                ? "bg-[var(--primary-soft)] font-semibold text-[var(--primary)]"
                : "text-[var(--studio-muted)] hover:bg-[var(--studio)] hover:text-[var(--studio-ink)]",
            )}
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--studio)]">
              <House className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </span>
            Home
          </Link>
          {items.map((service) => {
            const active = pathname === service.href || pathname.startsWith(`${service.href}/`);
            return (
              <Link
                key={service.id}
                href={service.href}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 text-sm transition",
                  active
                    ? "bg-[var(--primary-soft)] font-semibold text-[var(--primary)]"
                    : "text-[var(--studio-muted)] hover:bg-[var(--studio)] hover:text-[var(--studio-ink)]",
                )}
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--studio)]">
                  <CategoryArt id={service.id} size={32} className="h-7 w-7 object-contain" />
                </span>
                {service.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function DesktopServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:grid md:grid-cols-[240px_minmax(0,1fr)] md:items-start md:gap-8">
      <ServicesSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
