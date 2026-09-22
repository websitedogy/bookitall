"use client";

import { AppShell } from "@/shared/ui/app-shell";

export function DriverClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="DRIVER" title="Driver" nav={[{ href: "/driver", label: "Jobs" }]}>
      {children}
    </AppShell>
  );
}
