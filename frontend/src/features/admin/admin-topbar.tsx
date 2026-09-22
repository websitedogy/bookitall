"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, KeyRound, LogOut } from "lucide-react";
import { useAdminAuth, type AuthUser } from "@/features/auth/store";
import { api } from "@/shared/lib/api";

type AdminNote = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  metadata?: { href?: string } | null;
};

function formatLastSeen(iso?: string | null, isOnline?: boolean) {
  if (isOnline) return "Online now";
  if (!iso) return "No activity yet";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "No activity yet";
  const diff = Date.now() - then;
  if (diff < 2 * 60_000) return "Online now";
  if (diff < 60 * 60_000) return `Last seen ${Math.max(1, Math.floor(diff / 60_000))} min ago`;
  if (diff < 24 * 60 * 60_000) return `Last seen ${Math.floor(diff / 3_600_000)} hr ago`;
  return `Last seen ${new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`;
}

function formatWhen(iso: string) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  if (diff < 60_000) return "Just now";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function noteHref(note: AdminNote) {
  if (typeof note.metadata?.href === "string" && note.metadata.href.startsWith("/")) {
    return note.metadata.href;
  }
  if (note.type.startsWith("BOOKING") || note.type === "PAYMENT_SUCCESS") return "/admin/bookings";
  if (note.title.toLowerCase().includes("support")) return "/admin/support";
  if (note.type === "PAYOUT_PAID") return "/admin/settlements";
  return "/admin/listings";
}

export function AdminTopbar({ user }: { user: AuthUser }) {
  const router = useRouter();
  const token = useAdminAuth((s) => s.accessToken);
  const logout = useAdminAuth((s) => s.logout);
  const updateUser = useAdminAuth((s) => s.updateUser);
  const [open, setOpen] = useState<"profile" | "notes" | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const signOut = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST", token });
    } catch {
      // Local logout still runs.
    }
    logout();
    router.replace("/admin/login");
  }, [logout, router, token]);

  useEffect(() => {
    if (!token) return;
    const ping = () => {
      api<{ lastSeenAt: string; isOnline: boolean }>("/auth/seen", { method: "POST", token })
        .then((res) => {
          if (res.data?.lastSeenAt) {
            updateUser({ lastSeenAt: res.data.lastSeenAt, isOnline: res.data.isOnline });
          }
        })
        .catch(() => undefined);
    };
    ping();
    const id = window.setInterval(ping, 60_000);
    return () => window.clearInterval(id);
  }, [token, updateUser]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <>
      <div ref={wrapRef} className="flex shrink-0 items-center gap-2">
        <Link href="/" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline">
          View site
        </Link>
        <AdminNotifications
          token={token}
          open={open === "notes"}
          onToggle={() => setOpen((cur) => (cur === "notes" ? null : "notes"))}
          onClose={() => setOpen(null)}
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((cur) => (cur === "profile" ? null : "profile"))}
            className="inline-flex items-center gap-2 rounded-full p-0.5 pr-1.5 text-left hover:bg-slate-50"
            aria-expanded={open === "profile"}
            aria-haspopup="menu"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
              {initials}
            </span>
            <span className="hidden max-w-[8rem] truncate text-sm font-medium text-slate-800 md:block">{user.fullName}</span>
          </button>
          {open === "profile" ? (
            <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                <p className="truncate text-xs text-slate-500">{user.email || user.phone}</p>
                <p className="mt-1 text-xs text-emerald-700">{formatLastSeen(user.lastSeenAt, user.isOnline)}</p>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(null);
                    setPasswordOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <KeyRound className="h-4 w-4 text-slate-400" />
                  Update password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(null);
                    void signOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {passwordOpen ? <PasswordModal token={token} onClose={() => setPasswordOpen(false)} /> : null}
    </>
  );
}

function AdminNotifications({
  token,
  open,
  onToggle,
  onClose,
}: {
  token: string | null;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api<number>("/notifications/unread-count", { token });
      setUnread(typeof res.data === "number" ? res.data : 0);
    } catch {
      // Keep last count.
    }
  }, [token]);

  const loadList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api<AdminNote[]>("/notifications?limit=20", { token });
      setNotes(res.data ?? []);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadCount();
    const id = window.setInterval(() => void loadCount(), 15_000);
    return () => window.clearInterval(id);
  }, [loadCount]);

  useEffect(() => {
    if (open) void loadList();
  }, [open, loadList]);

  async function openNote(note: AdminNote) {
    if (!note.isRead && token) {
      try {
        await api(`/notifications/${note.id}/read`, { method: "PATCH", token });
        setNotes((cur) => cur.map((row) => (row.id === note.id ? { ...row, isRead: true } : row)));
        setUnread((cur) => Math.max(0, cur - 1));
      } catch {
        // Still navigate.
      }
    }
    onClose();
    router.push(noteHref(note));
  }

  async function markAll() {
    if (!token || unread === 0) return;
    try {
      await api("/notifications/read-all", { method: "PATCH", token });
      setNotes((cur) => cur.map((row) => ({ ...row, isRead: true })));
      setUnread(0);
    } catch {
      // Keep unread state.
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative rounded-lg p-2 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <button
              type="button"
              onClick={() => void markAll()}
              disabled={unread === 0}
              className="text-xs font-medium text-emerald-700 disabled:text-slate-400"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && notes.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Loading…</p>
            ) : notes.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => void openNote(note)}
                  className={`block w-full border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50 ${
                    note.isRead ? "bg-white" : "bg-emerald-50/60"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">{note.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{note.body}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatWhen(note.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PasswordModal({ token, onClose }: { token: string | null; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await api("/auth/password", {
        method: "PATCH",
        token,
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setDone(true);
      window.setTimeout(onClose, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <form
        onSubmit={(event) => void submit(event)}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200"
      >
        <h2 className="text-lg font-semibold text-slate-900">Update password</h2>
        <p className="mt-1 text-sm text-slate-500">Enter your current password, then choose a new one.</p>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
            required
            autoComplete="current-password"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Confirm new password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {done ? <p className="mt-3 text-sm text-emerald-700">Password updated.</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
