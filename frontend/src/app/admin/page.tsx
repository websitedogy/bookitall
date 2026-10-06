"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAdminAuth, isSuperAdmin } from "@/features/auth/store";
import { AdminHeader } from "@/features/admin/admin-shell";
import { DashBox } from "@/features/admin/admin-ui";
import { visibleAdminMenu } from "@/features/admin/admin-menu";
import type { DashboardCounts } from "@/features/admin/types";

const empty: DashboardCounts = {
  dailyVerified: { pendingUsers: 0, pendingVendors: 0, weeklyAmount: 0 },
  management: { users: 0, customers: 0, vendors: 0, pendingPayments: 0, pendingPayouts: 0, openTickets: 0, staff: 0 },
  vendors: { pending: 0, active: 0, rejected: 0, blocked: 0, pendingPosts: 0, rejectedPosts: 0, categories: [] },
  customers: { total: 0, bookings: 0, working: 0, worked: 0, scheduled: 0 },
  orders: { total: 0, pending: 0, approved: 0, rejected: 0, processing: 0 },
  services: { enabled: 0, total: 0 },
};

export default function AdminHomePage() {
  const token = useAdminAuth((s) => s.accessToken);
  const user = useAdminAuth((s) => s.user);
  const superAdmin = isSuperAdmin(user?.role);
  const [data, setData] = useState<DashboardCounts>(empty);
  const sections = visibleAdminMenu(superAdmin);

  useEffect(() => {
    if (!token) return;
    let live = true;
    async function load() {
      try {
        const r = await api<DashboardCounts>("/admin/dashboard", { token });
        if (live && r.data) setData(r.data);
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
    <div>
      <AdminHeader title={`Welcome${user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`} />
      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.id}>
            <h2 className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              {section.label}
            </h2>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {section.items.map((item) => (
                <DashBox
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  count={item.count(data)}
                  icon={item.icon}
                  artId={item.artId}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
