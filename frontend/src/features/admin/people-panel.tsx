"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/shared/lib/api";
import { AdminCard } from "@/features/admin/admin-shell";
import { CompactPager, EmptyState, RowActions, StatusPill } from "@/features/admin/admin-ui";
import { VendorReportButton } from "@/features/admin/vendor-report-modal";
import { qs, rowLimit, useAdminList } from "@/features/admin/use-admin-list";
import type { AdminUser } from "@/features/admin/types";
import { publicEmail } from "@/shared/lib/email";
import { useAdminAuth, isSuperAdmin } from "@/features/auth/store";

type PeopleTab = { id: string; label: string; count?: number };

export function AdminPeoplePanel({
  title,
  role,
  status,
  bucket,
  empty,
  tabs,
}: {
  title: string;
  role?: string;
  status?: string;
  bucket?: string;
  empty: string;
  tabs?: { value: string; items: PeopleTab[]; onChange: (id: string) => void };
}) {
  const router = useRouter();
  const canManage = isSuperAdmin(useAdminAuth((s) => s.user?.role));
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsKey, setRowsKey] = useState("50");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const [sticky, setSticky] = useState<AdminUser[]>([]);
  const limit = rowLimit(rowsKey);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);
  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(timer);
  }, [role, status, bucket, rowsKey]);
  const path = `/admin/users${qs({ role, status, bucket, q: query || undefined, page: String(page), limit: String(limit) })}`;
  const { rows, total, loading, error, token } = useAdminList<AdminUser>(path);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalStatus({});
      setSticky([]);
      setNote("");
    }, 0);
    return () => clearTimeout(timer);
  }, [path]);

  const displayed = (() => {
    const byId = new Map<string, AdminUser>();
    for (const row of rows) {
      byId.set(row.id, localStatus[row.id] ? { ...row, status: localStatus[row.id] } : row);
    }
    for (const row of sticky) {
      if (!byId.has(row.id)) {
        byId.set(row.id, localStatus[row.id] ? { ...row, status: localStatus[row.id] } : row);
      }
    }
    return [...byId.values()];
  })();

  async function setStatus(id: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED", user: AdminUser) {
    if (!token) return;
    setBusy(id);
    try {
      await api(`/admin/users/${id}/status`, { method: "PATCH", token, body: JSON.stringify({ status }) });
      setLocalStatus((prev) => ({ ...prev, [id]: status }));
      setSticky((prev) => {
        const next = prev.filter((row) => row.id !== id);
        return [{ ...user, status }, ...next];
      });
      setNote(status === "ACTIVE" ? `${user.fullName} enabled.` : status === "INACTIVE" ? `${user.fullName} disabled.` : `${user.fullName} blocked.`);
    } finally {
      setBusy("");
    }
  }

  const customersOnly = role === "CUSTOMER";
  const registeredVendors = bucket === "registered";
  const showPosts = !customersOnly;
  const showReport = bucket === "active";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h1 className="shrink-0 text-sm font-semibold text-slate-900">{title}</h1>
        {tabs ? (
          <div className="inline-flex rounded-lg bg-emerald-50 p-0.5 ring-1 ring-emerald-100">
            {tabs.items.map((item) => {
              const active = tabs.value === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => tabs.onChange(item.id)}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition ${
                    active ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-emerald-800"
                  }`}
                >
                  {item.label}
                  <span className={`tabular-nums ${active ? "text-emerald-600" : "text-slate-400"}`}>
                    {item.count ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="ml-auto h-7 w-28 shrink-0 rounded-md border border-emerald-100 bg-white px-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-200 sm:w-[10.5rem]"
        />
      </div>
      {note ? <p className="mb-1.5 text-xs font-medium text-emerald-700">{note}</p> : null}
      <AdminCard className="overflow-hidden p-0">
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : error ? (
          <EmptyState>{error}</EmptyState>
        ) : displayed.length === 0 ? (
          <EmptyState>{empty}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[40rem] w-full text-left text-sm">
              <thead className="bg-emerald-50/60 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                <tr>
                  <th className="w-12 whitespace-nowrap px-3 py-2">S.no</th>
                  <th className="whitespace-nowrap px-3 py-2">Name</th>
                  <th className="whitespace-nowrap px-3 py-2">Contact</th>
                  <th className="whitespace-nowrap px-3 py-2">Role</th>
                  <th className="whitespace-nowrap px-3 py-2">Joined</th>
                  {showPosts ? <th className="whitespace-nowrap px-3 py-2">Posts</th> : null}
                  {showReport ? <th className="whitespace-nowrap px-3 py-2">Report</th> : null}
                  <th className="whitespace-nowrap px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((user, index) => {
                  const vendor = user.role !== "CUSTOMER" && user.role !== "SUPER_ADMIN";
                  const from = customersOnly ? "users-customers" : registeredVendors ? "users-vendors" : bucket;
                  const viewHref = `/admin/vendors/${user.id}${from ? `?from=${from}` : ""}`;
                  const sno = (page - 1) * limit + index + 1;
                  const joined = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";
                  return (
                    <tr key={user.id} className="bg-white hover:bg-emerald-50/40">
                      <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums text-slate-500">{sno}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => router.push(viewHref)}
                            className="text-sm font-medium text-slate-900 hover:text-emerald-700"
                          >
                            {user.fullName}
                          </button>
                          <StatusPill value={user.status} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                        <p>{user.phone || "—"}</p>
                        {publicEmail(user.email) ? (
                          <p className="text-[11px] text-slate-400">{publicEmail(user.email)}</p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                        <p>{user.role.replaceAll("_", " ")}</p>
                        {user.businessName ? <p className="text-[11px] text-slate-400">{user.businessName}</p> : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{joined}</td>
                      {showPosts ? (
                        <td className="whitespace-nowrap px-3 py-2">
                          <button
                            type="button"
                            onClick={() => router.push(viewHref)}
                            className="text-left text-sm font-medium text-slate-800 underline-offset-2 hover:underline"
                          >
                            <span>{user.listings ?? 0}</span>
                            {showReport ? (
                              <span className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] font-medium text-slate-400">
                                <span>{user.pendingPosts ?? 0} pending</span>
                                <span>{user.activePosts ?? 0} accepted</span>
                                <span>{user.rejectedPosts ?? 0} rejected</span>
                              </span>
                            ) : null}
                          </button>
                        </td>
                      ) : null}
                      {showReport ? (
                        <td className="whitespace-nowrap px-3 py-2">
                          <VendorReportButton userId={user.id} name={user.fullName} />
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <RowActions
                          items={[
                            ...(canManage && vendor
                              ? [
                                  {
                                    id: "enable",
                                    label: "Enable",
                                    disabled: busy === user.id || user.status === "ACTIVE",
                                    onClick: () => setStatus(user.id, "ACTIVE", user),
                                    tone: "primary" as const,
                                  },
                                  {
                                    id: "disable",
                                    label: "Disable",
                                    disabled: busy === user.id || user.status === "INACTIVE",
                                    onClick: () => setStatus(user.id, "INACTIVE", user),
                                  },
                                ]
                              : []),
                            ...(canManage && user.role !== "SUPER_ADMIN"
                              ? user.status !== "SUSPENDED"
                                ? [
                                    {
                                      id: "block",
                                      label: "Block",
                                      disabled: busy === user.id,
                                      onClick: () => setStatus(user.id, "SUSPENDED", user),
                                      tone: "danger" as const,
                                    },
                                  ]
                                : [
                                    {
                                      id: "unblock",
                                      label: "Unblock",
                                      disabled: busy === user.id,
                                      onClick: () => setStatus(user.id, "ACTIVE", user),
                                      tone: "primary" as const,
                                    },
                                  ]
                              : []),
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <CompactPager page={page} total={total} limit={limit} rows={rowsKey} onPage={setPage} onRows={setRowsKey} />
          </div>
        )}
      </AdminCard>
    </div>
  );
}
