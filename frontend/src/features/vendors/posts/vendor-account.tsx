"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Bell, ClipboardList, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { enableVendorPush } from "@/shared/lib/vendor-push";
import { publicEmail } from "@/shared/lib/email";
import { isProfilePending, profileStatusOf } from "@/features/customers/lib/profile-completeness";
import { ProfileStatusBadge } from "@/features/customers/components/profile-status-badge";

export function VendorAccount() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const logout = useAuth((s) => s.logout);

  if (!user) {
    return (
      <div className="px-1 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Vendor account</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Sign in as a vendor to manage listings and orders.</p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="px-1 pb-6">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
        Vendor only
      </p>
      <div className="mt-4 flex items-center gap-3">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-xl font-semibold text-white">
          {user.fullName.charAt(0)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{user.fullName}</h1>
          <p className="truncate text-sm text-[var(--text-muted)]">{user.businessName || "Vendor"}</p>
          <div className="mt-2">
            <ProfileStatusBadge status={profileStatusOf(user)} size="sm" />
          </div>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 rounded-[1.5rem] bg-white p-5 ring-1 ring-[var(--border)]">
        <Row label="Phone" value={user.phone || "—"} />
        {publicEmail(user.email) ? <Row label="Email" value={publicEmail(user.email)} /> : null}
        <Row label="Role" value={user.role === "PARTNER" ? "Vendor" : user.role} />
        {user.partnerType ? <Row label="Service type" value={user.partnerType} /> : null}
      </dl>

      <div className="mt-4 grid gap-2">
        <Link
          href="/account"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium text-[var(--primary)] ring-1 ring-[var(--border)]"
        >
          {isProfilePending(user) ? "Complete my profile" : "Edit my profile"}
        </Link>
        <Link
          href="/vendors/services"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--primary)] text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          Place Register
        </Link>
        <Link
          href="/vendors/my-orders"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium text-[var(--primary)] ring-1 ring-[var(--border)]"
        >
          <ClipboardList className="h-4 w-4" aria-hidden />
          My Orders
        </Link>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium text-[var(--primary)] ring-1 ring-[var(--border)]"
          onClick={() => {
            if (!token) return;
            void enableVendorPush(token).catch(() => undefined);
          }}
        >
          <Bell className="h-4 w-4" aria-hidden />
          Turn on order alerts
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium text-[var(--text-muted)]"
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
