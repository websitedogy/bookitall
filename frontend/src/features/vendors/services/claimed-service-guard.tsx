"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FormBackButton } from "./form-back-button";
import { useClaimedCategories } from "./use-claimed-categories";

export function ClaimedServiceGuard({ category, children }: { category: string; children: ReactNode }) {
  const { claimed, loading, signedIn } = useClaimedCategories();

  if (!signedIn || loading) return children;
  if (!claimed.has(category)) return children;

  return (
    <div className="flex min-h-[60dvh] flex-col bg-white pb-[calc(4.85rem+env(safe-area-inset-bottom))]">
      <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-[var(--border)] pl-12 pr-4 md:h-auto md:border-0 md:px-0 md:pt-2">
        <FormBackButton fallback="/vendors/services" />
        <h1 className="text-[17px] font-semibold tracking-tight md:text-3xl">Already listed</h1>
      </header>
      <div className="px-4 py-8 md:px-0">
        <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">
          You already have this service listed. After admin accepts it, it stays hidden on Place Register so you
          cannot add the same service twice.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/vendors/posts"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white"
          >
            View My Services
          </Link>
          <Link
            href="/vendors/services"
            className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-[var(--primary)] ring-1 ring-[var(--border)]"
          >
            Other services
          </Link>
        </div>
      </div>
    </div>
  );
}
