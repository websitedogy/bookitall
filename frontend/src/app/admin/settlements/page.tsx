"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { inr } from "@/shared/lib/format";
import { AdminCard, AdminHeader } from "@/features/admin/admin-shell";
import { CompactPager, EmptyState, FilterDropdown, RowActions, StatusPill } from "@/features/admin/admin-ui";
import { qs, rowLimit, useAdminList } from "@/features/admin/use-admin-list";
import { SuperOnly } from "@/features/admin/super-only";
import type { AdminPayout } from "@/features/admin/types";

export default function AdminSettlementsPage() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [rowsKey, setRowsKey] = useState("50");
  const limit = rowLimit(rowsKey);
  const { rows, total, loading, error, reload, token } = useAdminList<AdminPayout>(
    `/admin/payouts${qs({ status: status === "all" ? undefined : status, page: String(page), limit: String(limit) })}`,
  );
  const [busy, setBusy] = useState("");

  useEffect(() => {
    setPage(1);
  }, [status, rowsKey]);

  async function act(id: string, approve: boolean) {
    if (!token) return;
    setBusy(id);
    try {
      await api(`/admin/payouts/${id}`, { method: "PATCH", token, body: JSON.stringify({ approve }) });
      await reload();
    } finally {
      setBusy("");
    }
  }

  return (
    <SuperOnly>
    <div>
      <AdminHeader
        title="Settlements"
        action={
          <FilterDropdown
            value={status}
            options={[
              { id: "PENDING", label: "Pending" },
              { id: "PAID", label: "Paid" },
              { id: "FAILED", label: "Rejected" },
              { id: "all", label: "All" },
            ]}
            onChange={setStatus}
          />
        }
      />
      <AdminCard className="overflow-hidden p-0">
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : error ? (
          <EmptyState>{error}</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>No settlements in this filter.</EmptyState>
        ) : (
          <div>
            <div className="overflow-x-auto">
            <ul className="min-w-[36rem] divide-y divide-slate-100">
              {rows.map((row, index) => (
                <li key={row.id} className="flex items-center gap-3 whitespace-nowrap px-3 py-2 md:px-4">
                  <span className="w-8 shrink-0 text-xs tabular-nums text-slate-500">{(page - 1) * limit + index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {row.user?.fullName ?? "Vendor"}
                      <StatusPill value={row.status} />
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {[row.user?.phone, row.reference, new Date(row.createdAt).toLocaleString("en-IN")].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{inr(row.amount)}</p>
                  <RowActions
                    items={
                      row.status === "PENDING"
                        ? [
                            { id: "settle", label: "Settle", disabled: busy === row.id, onClick: () => act(row.id, true), tone: "primary" },
                            { id: "reject", label: "Reject", disabled: busy === row.id, onClick: () => act(row.id, false), tone: "danger" },
                          ]
                        : []
                    }
                  />
                </li>
              ))}
            </ul>
            </div>
            <CompactPager page={page} total={total} limit={limit} rows={rowsKey} onPage={setPage} onRows={setRowsKey} />
          </div>
        )}
      </AdminCard>
    </div>
    </SuperOnly>
  );
}
