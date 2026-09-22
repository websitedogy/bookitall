"use client";

import { AppShell } from "@/shared/ui/app-shell";

export function TechnicianClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="TECHNICIAN" title="Technician" nav={[{ href: "/technician", label: "Jobs" }]}>
      {children}
    </AppShell>
  );
}
