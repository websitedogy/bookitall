"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUser, Headphones, LayoutDashboard, LogOut, MessageCircle, Phone, UserRound } from "lucide-react";
import { useAuth, isPanelRole, type AuthUser } from "@/features/auth/store";
import { api } from "@/shared/lib/api";
import { isProfilePending } from "@/features/customers/lib/profile-completeness";
import { ProfileStatusBadge } from "@/features/customers/components/profile-status-badge";
import { mediaUrl } from "@/shared/lib/stable-image";
import { cn } from "@/shared/lib/cn";

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function HeaderAccount({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const updateUser = useAuth((s) => s.updateUser);
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pending = isProfilePending(user);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api<AuthUser>("/auth/me", { token })
      .then((res) => {
        if (!cancelled && res.data) updateUser(res.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [token, updateUser]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/login?next=/"
        className={cn(
          "inline-flex shrink-0 items-center justify-center text-[var(--text)]",
          compact ? "h-9 w-9" : "h-8 gap-1.5 rounded-full px-2 text-[13px] font-medium text-[var(--text-muted)] hover:bg-[var(--background-blue)] hover:text-[var(--text)]",
        )}
        aria-label="Sign in"
      >
        <CircleUser className={compact ? "h-5 w-5" : "h-4 w-4"} strokeWidth={1.8} aria-hidden />
        {compact ? null : <span>Sign in</span>}
      </Link>
    );
  }

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Profile"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-[var(--text)]",
          compact ? "h-9 w-9" : "h-8 w-8 hover:bg-[var(--background-blue)]",
        )}
      >
        <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-[11px] font-semibold text-white">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(user.avatarUrl)} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            initialsFor(user.fullName)
          )}
          {pending ? <ProfileStatusBadge status="PENDING" className="absolute -right-0.5 -top-0.5" /> : null}
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--border)] bg-white py-1 shadow-[0_16px_40px_-24px_rgba(21,32,43,0.45)]"
        >
          <div className="border-b border-[var(--border)] px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{user.phone || user.email}</p>
          </div>
          <Link
            href="/account"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--background-blue)]"
            onClick={() => setOpen(false)}
          >
            <UserRound className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
            My Profile
            <ProfileStatusBadge status={pending ? "PENDING" : "COMPLETE"} variant="label" className="ml-auto" />
          </Link>
          {isPanelRole(user.role) ? (
            <Link
              href="/admin"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--background-blue)]"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
              Admin panel
            </Link>
          ) : null}
          <div className="border-t border-[var(--border)] px-3 pb-1 pt-2">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              <Headphones className="h-3.5 w-3.5" aria-hidden />
              Support
            </p>
          </div>
          <Link
            href="/support/chat"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--background-blue)]"
            onClick={() => setOpen(false)}
          >
            <MessageCircle className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
            Chat with Support
          </Link>
          <Link
            href="/contact"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--background-blue)]"
            onClick={() => setOpen(false)}
          >
            <Phone className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
            Contact Support
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"
            onClick={() => {
              setOpen(false);
              logout();
              router.replace("/");
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
