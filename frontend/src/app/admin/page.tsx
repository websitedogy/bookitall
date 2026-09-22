"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Ban,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileCheck,
  Headphones,
  Layers,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "@/shared/lib/api";
import { useAdminAuth, isSuperAdmin } from "@/features/auth/store";
import { AdminHeader } from "@/features/admin/admin-shell";
import { DashBox, OrderStatGrid } from "@/features/admin/admin-ui";
import { CategoryArt } from "@/features/home/components/category-art";
import { SERVICE_NAV } from "@/features/home/service-nav";
import Link from "next/link";
import type { DashboardCounts } from "@/features/admin/types";

const empty: DashboardCounts = {
  dailyVerified: { pendingUsers: 0, pendingVendors: 0, weeklyAmount: 0 },
  management: { users: 0, customers: 0, vendors: 0, pendingPayments: 0, pendingPayouts: 0, openTickets: 0 },
  vendors: { pending: 0, active: 0, rejected: 0, blocked: 0, pendingPosts: 0, categories: [] },
  customers: { total: 0, bookings: 0, working: 0, worked: 0, scheduled: 0 },
  orders: { total: 0, pending: 0, approved: 0, rejected: 0, processing: 0 },
  services: { enabled: 16, total: 16 },
};

export default function AdminHomePage() {
  const token = useAdminAuth((s) => s.accessToken);
  const user = useAdminAuth((s) => s.user);
  const superAdmin = isSuperAdmin(user?.role);
  const [data, setData] = useState<DashboardCounts>(empty);

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

      <section>
        <h2 className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Daily verified</h2>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          <DashBox href="/admin/users?status=PENDING_VERIFICATION" label="Pending users" count={data.dailyVerified.pendingUsers} icon={Users} />
          <DashBox href="/admin/vendors?bucket=pending" label="Pending vendors" count={data.dailyVerified.pendingVendors} icon={Store} />
          <DashBox href="/admin/payments" label="Weekly amount" count={`₹${data.dailyVerified.weeklyAmount.toLocaleString("en-IN")}`} icon={CreditCard} />
        </div>
      </section>

      <section>
        <h2 className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Management</h2>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
          <DashBox href="/admin/users" label="All users" count={data.management.users} icon={Users} />
          {superAdmin ? (
            <>
              <DashBox href="/admin/payments" label="Pending payments" count={data.management.pendingPayments} icon={CreditCard} />
              <DashBox href="/admin/settlements" label="Settlement payments" count={data.management.pendingPayouts} icon={Wallet} />
            </>
          ) : null}
          <DashBox href="/admin/support" label="User support" count={data.management.openTickets} icon={Headphones} />
          <DashBox href="/admin/services" label="Service management" count={data.services?.enabled ?? 16} icon={Layers} />
        </div>
      </section>

      <section className="mt-4">
        <h2 className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Vendor section</h2>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <DashBox href="/admin/vendors?bucket=active" label="Active vendors" count={data.vendors.active} icon={Store} />
          <DashBox href="/admin/vendors?bucket=rejected" label="Disabled vendors" count={data.vendors.rejected} icon={Ban} />
          <DashBox href="/admin/vendors?bucket=blocked" label="Blocked vendors" count={data.vendors.blocked} icon={BadgeCheck} />
          <DashBox href="/admin/listings" label="Pending posts" count={data.vendors.pendingPosts} icon={FileCheck} />
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {SERVICE_NAV.map((service) => {
            const count = data.vendors.categories.find((c) => c.id === service.id)?.count ?? 0;
            return (
            <Link
              key={service.id}
              href={`/admin/listings?category=${service.id}&owner=active`}
              className="flex min-h-[5.75rem] flex-col justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-emerald-100 transition hover:-translate-y-0.5 hover:ring-emerald-300"
            >
              <div className="flex items-center justify-between gap-2">
                <CategoryArt id={service.id} size={28} className="h-7 w-7 object-contain" />
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">{count}</span>
              </div>
              <p className="text-xs font-semibold text-slate-600">{service.name}</p>
            </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-4">
        <h2 className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Orders</h2>
        <div className="mt-2.5">
          <OrderStatGrid counts={data.orders} />
        </div>
      </section>

      <section className="mt-4">
        <h2 className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">User side</h2>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
          <DashBox href="/admin/customers" label="All users (customers)" count={data.customers.total} icon={Users} />
          <DashBox href="/admin/bookings?bucket=worked" label="Worked list" count={data.customers.worked} icon={CheckCircle2} />
          <DashBox href="/admin/bookings?bucket=scheduled" label="Schedule bookings" count={data.customers.scheduled} icon={CalendarClock} />
        </div>
      </section>
    </div>
  );
}
