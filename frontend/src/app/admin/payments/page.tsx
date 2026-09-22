"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { inr } from "@/shared/lib/format";
import { AdminCard, AdminHeader } from "@/features/admin/admin-shell";
import { CompactPager, EmptyState, RowActions, StatusPill } from "@/features/admin/admin-ui";
import { qs, rowLimit, useAdminList } from "@/features/admin/use-admin-list";
import { SuperOnly } from "@/features/admin/super-only";
import type { AdminPayment } from "@/features/admin/types";

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [rowsKey, setRowsKey] = useState("50");
  const limit = rowLimit(rowsKey);
  const { rows, total, loading, error, reload, token } = useAdminList<AdminPayment>(
    `/admin/payments${qs({ status: "PENDING", page: String(page), limit: String(limit) })}`,
  );
  const [busy, setBusy] = useState("");

  useEffect(() => {
    setPage(1);
  }, [rowsKey]);

  async function confirm(id: string) {
    if (!token) return;
    setBusy(id);
    try {
      await api(`/admin/payments/${id}/confirm`, { method: "PATCH", token });
      await reload();
    } finally {
      setBusy("");
    }
  }

  return (
    <SuperOnly>
    <div>
      <AdminHeader title="Pending payments" />
      <AdminCard className="overflow-hidden p-0">
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : error ? (
          <EmptyState>{error}</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>No pending payments.</EmptyState>
        ) : (
          <div>
            <div className="overflow-x-auto">
            <ul className="min-w-[36rem] divide-y divide-slate-100">
              {rows.map((row, index) => (
                <li key={row.id} className="flex items-center gap-3 whitespace-nowrap px-3 py-2 md:px-4">
                  <span className="w-8 shrink-0 text-xs tabular-nums text-slate-500">{(page - 1) * limit + index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {row.title}
                      <StatusPill value={row.status} />
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {[row.bookingNumber, row.method, row.customer ? `${row.customer.fullName} ${row.customer.phone}` : null, row.reference]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{inr(row.amount)}</p>
                  <RowActions
                    items={[{ id: "confirm", label: "Confirm", disabled: busy === row.id, onClick: () => confirm(row.id), tone: "primary" }]}
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
