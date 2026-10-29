"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { HeaderAccount } from "./header-account";
import { HeaderSearch } from "./header-search";
import { HeaderSupport } from "./header-support";
import { LiveLocation } from "./live-location";

function Brand() {
  return (
    <Link href="/" aria-label="Book It All home" className="min-w-0 shrink-0">
      <Image
        src="/brand/bookitall.png"
        alt="Book It All"
        width={820}
        height={130}
        sizes="(max-width: 768px) 32vw, 160px"
        priority
        className="block h-auto w-[min(32vw,8.5rem)] rounded-md object-contain md:w-40"
      />
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <header className="z-40 border-b border-[#193b60] bg-[#102b4c] shadow-sm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <div className="mx-auto max-w-6xl px-4 md:hidden">
        <div
          className={`flex min-h-14 items-center justify-between gap-2 py-1 ${
            isHomePage ? "" : "pl-8"
          }`}
        >
          <Brand />
          <div className="ml-auto flex shrink-0 justify-end">
            <LiveLocation homePage mobileCompact={!isHomePage} />
          </div>
        </div>
        <div className="-mx-4 flex items-center gap-2 bg-white px-4 pb-2.5">
          <HeaderSearch inputId="header-search-mobile" homePage />
          <Link
            href="/saved"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#f97316] hover:bg-orange-50"
            aria-label="Likes"
          >
            <Heart
              className="h-7 w-7"
              strokeWidth={2.1}
              aria-hidden
            />
          </Link>
          <HeaderSupport compact homePage />
          <HeaderAccount compact homePage />
        </div>
      </div>

      <div className="mx-auto hidden h-16 max-w-7xl items-center gap-5 px-8 md:flex">
        <Brand />
        <div className="ml-auto flex min-w-0 items-center gap-2.5">
          <HeaderSearch inputId="header-search-desktop" homePage />
          <LiveLocation homePage />
          <Link
            href="/saved"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#fb923c] hover:bg-white/10"
            aria-label="Likes"
          >
            <Heart
              className="h-6 w-6"
              strokeWidth={2.1}
              aria-hidden
            />
          </Link>
          <HeaderSupport homePage />
          <HeaderAccount homePage />
        </div>
      </div>
    </header>
  );
}
