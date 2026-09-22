"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, ClipboardList, House, Newspaper, Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const tabs = [
  {
    href: "/",
    label: "Home",
    icon: House,
    match: (path: string) => path === "/",
  },
  {
    href: "/vendors/posts",
    label: "My Services",
    icon: Newspaper,
    match: (path: string) => path.startsWith("/vendors/posts") || path.startsWith("/posts"),
  },
  {
    href: "/vendors/services",
    label: "Register",
    official: true,
    match: (path: string) => path.startsWith("/vendors/services") || path.startsWith("/add-service") || path.startsWith("/partner/listings"),
  },
  {
    href: "/vendors/my-orders",
    label: "Orders",
    icon: ClipboardList,
    match: (path: string) => path.startsWith("/vendors/my-orders") || path.startsWith("/my-orders") || path.startsWith("/partner/bookings"),
  },
  {
    href: "/my-bookings",
    label: "Bookings",
    icon: CalendarCheck,
    match: (path: string) => path.startsWith("/my-bookings"),
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/support/chat")
  ) {
    return null;
  }

  return (
    <nav aria-label="App" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:bottom-5">
      <div className="pointer-events-auto border-t border-[var(--border)] bg-white/96 backdrop-blur-xl md:mx-auto md:w-max md:rounded-full md:border md:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.45)]">
        <ul className="grid grid-cols-5 px-0.5 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))] md:flex md:items-end md:gap-1 md:px-3 md:py-1.5">
          {tabs.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <li key={tab.href} className="relative z-10 flex min-w-0 justify-center md:w-[5.75rem]">
                <Link
                  href={tab.href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 w-full min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-center text-[10px] font-medium leading-tight md:min-h-0 md:py-1 md:text-[11px]",
                    tab.official ? "-mt-6 md:mt-0" : "",
                    active ? "text-[var(--primary)]" : "text-[var(--text-muted)]",
                  )}
                >
                  {tab.official ? (
                    <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_10px_22px_-8px_rgba(15,118,110,0.7)] ring-4 ring-white md:h-10 md:w-10 md:shadow-none md:ring-0">
                      <Plus className="h-6 w-6 md:h-5 md:w-5" strokeWidth={2.4} aria-hidden />
                      <span className="sr-only">Register</span>
                    </span>
                  ) : Icon ? (
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform md:h-8 md:w-8",
                        active && "scale-110 bg-[var(--primary-soft)]",
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} aria-hidden />
                    </span>
                  ) : null}
                  <span className={tab.official ? "mt-1 font-semibold text-[var(--primary)]" : undefined}>{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
