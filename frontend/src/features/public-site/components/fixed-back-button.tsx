"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/shared/lib/cn";

export function FixedBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname === "/vendors/services/jobs"
  ) {
    return null;
  }

  const nearFormOnDesktop = pathname.startsWith("/vendors/services");

  return (
    <button
      type="button"
      aria-label="Back"
      suppressHydrationWarning
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push("/");
      }}
      className={cn(
        "fixed left-2.5 top-[calc(env(safe-area-inset-top)+0.4rem)] z-[60] inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--text)] shadow-[0_4px_14px_-8px_rgba(15,23,42,0.45)]",
        nearFormOnDesktop ? "md:hidden" : "md:left-4 md:top-3",
      )}
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
    </button>
  );
}
