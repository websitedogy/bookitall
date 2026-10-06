"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { useAdminAuth, isSuperAdmin } from "@/features/auth/store";
import { AdminHeader } from "@/features/admin/admin-shell";
import { DashBox, visibleAdminMenu } from "@/features/admin/admin-ui";
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
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {sections.map((section) => {
          const wide = section.items.length >= 4 || section.id === "posts";
          return (
            <section key={section.id} className={`rounded-2xl bg-white p-3 ring-1 ring-emerald-100 ${wide ? "xl:col-span-2" : ""}`}>
              <h2 className="mb-2.5 px-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">{section.label}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
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
          );
        })}
      </div>
    </div>
  );
}
