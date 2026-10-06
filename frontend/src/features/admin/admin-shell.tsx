"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useAdminAuth, useAdminAuthHydrated, isPanelRole, isSuperAdmin } from "@/features/auth/store";
import { AdminTopbar } from "@/features/admin/admin-topbar";
import { visibleAdminMenu } from "@/features/admin/admin-menu";
import { CategoryArt } from "@/features/home/components/category-art";
import { api } from "@/shared/lib/api";

function isActive(pathname: string, search: URLSearchParams, href: string) {
  const [path, query] = href.split("?");
  const params = query ? new URLSearchParams(query) : null;
  if (path === "/admin") return pathname === "/admin";
  const onVendorDetail = path === "/admin/vendors" && pathname.startsWith("/admin/vendors/");
  if (pathname !== path && !onVendorDetail) return false;
  for (const key of ["bucket", "status", "category"] as const) {
    const want = params?.get(key) ?? null;
    const raw = key === "bucket" ? search.get("bucket") || search.get("from") || (onVendorDetail ? "active" : null) : search.get(key);
    const current = key === "bucket" && raw === "processing" ? "working" : raw;
    const target = key === "bucket" && want === "processing" ? "working" : want;
    if ((current || null) !== target) return false;
  }
  return true;
}

function NavLinks({ onClick, superAdmin }: { onClick?: () => void; superAdmin: boolean }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const sections = visibleAdminMenu(superAdmin);
  const overviewActive = isActive(pathname, search, "/admin");
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <Link
        href="/admin"
        onClick={onClick}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          overviewActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        Overview
      </Link>
      {sections.map((section) => (
        <div key={section.id} className="pt-3">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{section.label}</p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, search, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClick}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.artId ? (
                    <CategoryArt id={item.artId} size={16} className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
        <header className="sticky top-0 z-30 flex min-w-0 items-center justify-between gap-2 border-b border-emerald-100 bg-white px-3 py-2.5 sm:gap-3 sm:px-4 md:px-6">
          <button type="button" className="rounded-lg p-2 text-slate-600 ring-1 ring-emerald-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
                return;
              }
              if (pathname !== "/admin") router.push("/admin");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-700 ring-1 ring-emerald-100 hover:bg-emerald-50"
            aria-label="Back to the last page"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            Back
          </button>
          <div className="ml-auto">
            <AdminTopbar user={user} />
          </div>
        </header>
        <main className="min-w-0 overflow-x-clip px-3 py-3 sm:px-4 md:px-6 md:py-4">{children}</main>
      </div>
    </div>
  );
}

export function AdminHeader({ title, extra, action }: { title: string; subtitle?: string; extra?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <h1 className="min-w-0 text-sm font-semibold tracking-tight text-slate-900">{title}</h1>
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
        {extra}
        {action}
      </div>
    </div>
  );
}

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-emerald-100 ${className}`}>{children}</div>;
}
