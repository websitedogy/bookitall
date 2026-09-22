"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AdminShell } from "@/features/admin/admin-shell";

export function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return children;
  }
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f3f8f5] text-sm text-slate-500">Loading admin…</div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
