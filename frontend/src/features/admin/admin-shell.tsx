"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Ban,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileCheck,
  Headphones,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Store,
  UserCog,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useAdminAuth, useAdminAuthHydrated, isPanelRole, isSuperAdmin } from "@/features/auth/store";
import { AdminTopbar } from "@/features/admin/admin-topbar";
import { api } from "@/shared/lib/api";

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; superOnly?: boolean }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/services", label: "Service management", icon: Layers },
  { href: "/admin/users", label: "All users", icon: Users },
  { href: "/admin/payments", label: "Pending payments", icon: CreditCard, superOnly: true },
  { href: "/admin/settlements", label: "Settlements", icon: Wallet, superOnly: true },
  { href: "/admin/staff", label: "Sub editors", icon: UserCog, superOnly: true },
  { href: "/admin/support", label: "User support", icon: Headphones },
  { href: "/admin/vendors?bucket=pending", label: "Pending vendors", icon: ClipboardList },
  { href: "/admin/vendors?bucket=active", label: "Active vendors", icon: Store },
  { href: "/admin/vendors?bucket=rejected", label: "Disabled vendors", icon: Ban },
  { href: "/admin/vendors?bucket=blocked", label: "Blocked vendors", icon: BadgeCheck },
  { href: "/admin/listings", label: "Pending posts", icon: FileCheck },
  { href: "/admin/listings?status=REJECTED", label: "Rejected posts", icon: Ban },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/bookings", label: "Orders", icon: CalendarCheck },
  { href: "/admin/bookings?bucket=pending", label: "Pending orders", icon: ClipboardList },
  { href: "/admin/bookings?bucket=approved", label: "Approved", icon: CheckCircle2 },
  { href: "/admin/bookings?bucket=rejected", label: "Rejected", icon: Ban },
  { href: "/admin/bookings?bucket=working", label: "Processing", icon: Wrench },
  { href: "/admin/bookings?bucket=worked", label: "Worked", icon: CheckCircle2 },
  { href: "/admin/bookings?bucket=scheduled", label: "Scheduled", icon: CalendarClock },
];

function isActive(pathname: string, bucket: string | null, status: string | null, href: string) {
  const [path, query] = href.split("?");
  const params = query ? new URLSearchParams(query) : null;
  const want = params?.get("bucket") ?? null;
  const wantStatus = params?.get("status") ?? null;
  if (path === "/admin") return pathname === "/admin";
  if (path === "/admin/vendors" && pathname.startsWith("/admin/vendors/")) {
    return (bucket || "active") === want;
  }
  if (pathname !== path) return false;
  if (path === "/admin/listings") {
    return (status || null) === wantStatus;
  }
  if (path === "/admin/vendors") {
    return (bucket || null) === want;
  }
  if (path === "/admin/bookings") {
    const current = bucket === "processing" ? "working" : bucket;
    const target = want === "processing" ? "working" : want;
    return (current || null) === target;
  }
  return true;
}

function NavLinks({ onClick, superAdmin }: { onClick?: () => void; superAdmin: boolean }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const bucket = search.get("bucket") || search.get("from");
  const status = search.get("status");
  const items = NAV.filter((item) => superAdmin || !item.superOnly);
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {items.map((item) => {
        const active = isActive(pathname, bucket, status, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const user = useAdminAuth((s) => s.user);
  const logout = useAdminAuth((s) => s.logout);
  const token = useAdminAuth((s) => s.accessToken);
  const updateUser = useAdminAuth((s) => s.updateUser);
  const router = useRouter();
  const ready = useAdminAuthHydrated();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user || !isPanelRole(user.role)) router.replace("/admin/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!token || !user) return;
    api<typeof user>("/auth/me", { token })
      .then((res) => {
        if (res.data) updateUser(res.data);
      })
      .catch(() => undefined);
  }, [token, user?.id, updateUser]);

  if (!ready || !user || !isPanelRole(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f8f5] text-sm text-slate-500">
        Opening admin…
      </div>
    );
  }

  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const brand = (
    <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">B</span>
      <span>
        <span className="block text-sm font-semibold tracking-tight text-white">Book It All</span>
        <span className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Control center</span>
      </span>
    </Link>
  );

  const account = (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-300">
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white">{user.fullName}</span>
        <span className="text-[11px] text-slate-400">{isSuperAdmin(user.role) ? "Super admin" : "Sub editor"}</span>
      </span>
      <button
        type="button"
        onClick={() => {
          void api("/auth/logout", { method: "POST", token }).catch(() => undefined);
          logout();
          router.replace("/admin/login");
        }}
        className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f8f5] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-[#0f172a] text-slate-200 lg:flex">
        <div className="shrink-0 border-b border-white/10 px-5 py-5">{brand}</div>
        <NavLinks superAdmin={isSuperAdmin(user.role)} />
        <div className="shrink-0 border-t border-white/10 p-4">{account}</div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-900/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col bg-[#0f172a] text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              {brand}
              <button type="button" className="rounded-lg p-2 text-slate-400" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks superAdmin={isSuperAdmin(user.role)} onClick={() => setOpen(false)} />
            <div className="border-t border-white/10 p-4">{account}</div>
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-emerald-100 bg-white px-4 py-2.5 md:px-6">
          <button type="button" className="rounded-lg p-2 text-slate-600 ring-1 ring-emerald-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto">
            <AdminTopbar user={user} />
          </div>
        </header>
        <main className="px-4 py-3 md:px-6 md:py-4">{children}</main>
      </div>
    </div>
  );
}

export function AdminHeader({ title, extra, action }: { title: string; subtitle?: string; extra?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <h1 className="shrink-0 text-sm font-semibold tracking-tight text-slate-900">{title}</h1>
      <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
        {extra}
        {action}
      </div>
    </div>
  );
}

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-emerald-100 ${className}`}>{children}</div>;
}
