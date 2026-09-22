"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPeoplePanel } from "@/features/admin/people-panel";
import { api } from "@/shared/lib/api";
import { useAdminAuth } from "@/features/auth/store";
import type { DashboardCounts } from "@/features/admin/types";

type UsersTab = "customers" | "vendors";

export default function AdminUsersPage() {
  const router = useRouter();
  const search = useSearchParams();
  const tab: UsersTab = search.get("tab") === "vendors" ? "vendors" : "customers";
  const status = search.get("status") || undefined;
  const token = useAdminAuth((s) => s.accessToken);
  const [counts, setCounts] = useState({ customers: 0, vendors: 0 });

  useEffect(() => {
    if (!token) return;
    let live = true;
    async function load() {
      try {
        const res = await api<DashboardCounts>("/admin/dashboard", { token });
        if (!live || !res.data) return;
        setCounts({
          customers: res.data.management.customers ?? res.data.customers.total,
          vendors:
            res.data.management.vendors ??
            res.data.vendors.pending + res.data.vendors.active + res.data.vendors.rejected + res.data.vendors.blocked,
        });
      } catch {
        // keep last live counts
      }
    }
    void load();
    const timer = setInterval(() => void load(), 12000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [token]);

  return (
    <AdminPeoplePanel
      title="All users"
      role={tab === "customers" ? "CUSTOMER" : undefined}
      bucket={tab === "vendors" ? "registered" : undefined}
      status={status}
      empty={tab === "customers" ? "No customers registered yet." : "No vendors registered yet."}
      tabs={{
        value: tab,
        items: [
          { id: "customers", label: "Customers", count: counts.customers },
          { id: "vendors", label: "Vendors", count: counts.vendors },
        ],
        onChange: (id) => router.replace(`/admin/users?tab=${id}`),
      }}
    />
  );
}
