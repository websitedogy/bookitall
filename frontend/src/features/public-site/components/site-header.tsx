"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { HeaderAccount } from "./header-account";
import { HeaderSearch } from "./header-search";
import { HeaderSupport } from "./header-support";
import { LiveLocation } from "./live-location";

function Brand({ homePage = false }: { homePage?: boolean }) {
  return (
    <Link href="/" className="min-w-0 shrink-0">
      <span
        className={`block truncate text-[17px] font-semibold tracking-tight md:text-[18px] ${
          homePage ? "text-white" : "text-[var(--primary)]"
        }`}
      >
        Book It All
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isHomePage = pathname === "/";
  const hideOnMobile = pathname !== "/" && !isAuth;

  return (
    <header
      className={`z-40 border-b ${
        isHomePage ? "border-[#193b60] bg-[#102b4c]" : "border-[var(--border)] bg-white"
      } ${hideOnMobile ? "max-md:hidden" : ""}`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <div className={`mx-auto max-w-6xl md:hidden ${isHomePage || isAuth ? "px-4" : "pl-12 pr-4"}`}>
        <div
          className={`flex min-h-12 items-center justify-between gap-3 py-1 ${
            isHomePage ? "-mx-4 bg-[#102b4c] px-4" : ""
          }`}
        >
          <Brand homePage={isHomePage} />
          <div className="ml-auto flex shrink-0 justify-end">
            <LiveLocation homePage={isHomePage} />
          </div>
        </div>
        <div className={`flex items-center gap-2 pb-2.5 ${isHomePage ? "bg-white" : ""}`}>
          <HeaderSearch inputId="header-search-mobile" homePage={isHomePage} />
          <Link
            href="/saved"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-orange-50 ${
              isHomePage ? "text-[#f97316]" : "text-rose-500"
            }`}
            aria-label="Likes"
          >
            <Heart
              className={`h-7 w-7 ${isHomePage ? "text-[#f97316]" : ""}`}
              strokeWidth={2.1}
              aria-hidden
            />
          </Link>
          <HeaderSupport compact homePage={isHomePage} />
          <HeaderAccount compact homePage={isHomePage} />
        </div>
      </div>

      <div className="mx-auto hidden h-16 max-w-7xl items-center gap-5 px-8 md:flex">
        <Brand homePage={isHomePage} />
        <div className="ml-auto flex min-w-0 items-center gap-2.5">
          <HeaderSearch inputId="header-search-desktop" homePage={isHomePage} />
          <LiveLocation homePage={isHomePage} />
          <Link
            href="/saved"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 ${
              isHomePage ? "text-[#fb923c]" : "text-rose-500"
            }`}
            aria-label="Likes"
          >
            <Heart
              className={`h-6 w-6 ${isHomePage ? "text-[#fb923c]" : ""}`}
              strokeWidth={2.1}
              aria-hidden
            />
          </Link>
          <HeaderSupport homePage={isHomePage} />
          <HeaderAccount homePage={isHomePage} />
        </div>
      </div>
    </header>
  );
}
