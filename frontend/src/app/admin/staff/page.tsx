"use client";

import { FormEvent, useState } from "react";
import { api } from "@/shared/lib/api";
import { AdminCard, AdminHeader } from "@/features/admin/admin-shell";
import { CompactPager, EmptyState, RowActions, StatusPill } from "@/features/admin/admin-ui";
import { SuperOnly } from "@/features/admin/super-only";
import { rowLimit, useAdminList } from "@/features/admin/use-admin-list";
import type { AdminUser } from "@/features/admin/types";
import { publicEmail } from "@/shared/lib/email";

export default function AdminStaffPage() {
  return (
    <SuperOnly>
      <StaffPanel />
    </SuperOnly>
  );
}

function StaffPanel() {
  const { rows, loading, error, reload, token } = useAdminList<AdminUser>("/admin/staff");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [page, setPage] = useState(1);
  const [rowsKey, setRowsKey] = useState("50");
  const limit = rowLimit(rowsKey);
  const paged = rows.slice((page - 1) * limit, page * limit);

  async function createStaff(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setFormError("");
    setBusy("create");
    try {
      await api("/admin/staff", {
        method: "POST",
        token,
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setNote("Sub-editor added. They can sign in at /admin/login.");
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not add sub-editor");
    } finally {
      setBusy("");
    }
  }

  async function setStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
    if (!token) return;
    setBusy(id);
    try {
      await api(`/admin/staff/${id}/status`, { method: "PATCH", token, body: JSON.stringify({ status }) });
      setNote(status === "ACTIVE" ? "Sub-editor enabled." : "Sub-editor disabled. They cannot sign in.");
      await reload();
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <AdminHeader title="Sub editors" />

      <AdminCard className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Add a sub-editor</h2>
        <form onSubmit={createStaff} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Name
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
          <label className="text-sm">
            Email
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
          <label className="text-sm">
            Mobile
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
          <label className="text-sm">
            Password
            <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
          {formError ? <p className="sm:col-span-2 text-sm text-rose-700">{formError}</p> : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy === "create"}
              className="inline-flex h-10 items-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {busy === "create" ? "Adding…" : "Add sub-editor"}
            </button>
          </div>
        </form>
      </AdminCard>

      {note ? <p className="mb-2 text-xs font-medium text-emerald-700">{note}</p> : null}

      <AdminCard className="overflow-hidden p-0">
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : error ? (
          <EmptyState>{error}</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>No sub-editors yet.</EmptyState>
        ) : (
          <div>
          <div className="overflow-x-auto">
          <table className="min-w-[36rem] w-full text-left text-sm">
            <thead className="bg-emerald-50/60 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
              <tr>
                <th className="w-12 whitespace-nowrap px-3 py-2">S.no</th>
                <th className="whitespace-nowrap px-3 py-2">Name</th>
                <th className="whitespace-nowrap px-3 py-2">Contact</th>
                <th className="whitespace-nowrap px-3 py-2">Status</th>
                <th className="whitespace-nowrap px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((user, index) => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums text-slate-500">{(page - 1) * limit + index + 1}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-slate-900">{user.fullName}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                    <p>{user.phone || "—"}</p>
                    {publicEmail(user.email) ? <p className="text-[11px] text-slate-400">{publicEmail(user.email)}</p> : null}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <StatusPill value={user.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <RowActions
                      items={
                        user.status !== "SUSPENDED"
                          ? [{ id: "disable", label: "Disable", disabled: busy === user.id, onClick: () => setStatus(user.id, "SUSPENDED"), tone: "danger" }]
                          : [{ id: "enable", label: "Enable", disabled: busy === user.id, onClick: () => setStatus(user.id, "ACTIVE"), tone: "primary" }]
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <CompactPager
            page={page}
            total={rows.length}
            limit={limit}
            rows={rowsKey}
            onPage={setPage}
            onRows={(value) => {
              setRowsKey(value);
              setPage(1);
            }}
          />
          </div>
        )}
      </AdminCard>
    </div>
  );
}
