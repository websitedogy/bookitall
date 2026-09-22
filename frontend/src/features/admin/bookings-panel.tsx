"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/lib/api";
import { inr } from "@/shared/lib/format";
import { AdminCard } from "@/features/admin/admin-shell";
import { CompactPager, EmptyState, RowActions, StatusPill } from "@/features/admin/admin-ui";
import { qs, rowLimit, useAdminList } from "@/features/admin/use-admin-list";
import type { AdminBooking } from "@/features/admin/types";

const DONE = new Set(["COMPLETED", "CANCELLED", "REFUNDED"]);

function personFrom(row: AdminBooking, who: "customer" | "vendor") {
  const details = row.details ?? {};
  if (who === "customer") {
    const name = String(row.customer?.fullName || details.customerName || "").trim();
    const phone = String(row.customer?.phone || details.customerPhone || "").trim();
    return { name, phone };
  }
  const name = String(row.partner?.fullName || details.vendorName || row.title || "").trim();
  const phone = String(row.partner?.phone || details.vendorPhone || details.listedByPhone || "").trim();
  return { name, phone };
}

function customerLocation(row: AdminBooking) {
  const fromRow = String(row.customerLocation || row.address || "").trim();
  if (fromRow) return fromRow;
  const details = row.details ?? {};
  const address = String(details.address || details.pickupAddress || "").trim();
  const drop = String(details.dropAddress || "").trim();
  if (address && drop && drop !== address) return `${address} → ${drop}`;
  return address;
}

function vendorWindowOpen(row: AdminBooking) {
  if (row.status !== "PENDING") return false;
  if (row.escalatedToAdmin) return false;
  if (!row.vendorRespondBy) return true;
  return new Date(row.vendorRespondBy).getTime() > Date.now();
}

function nextActions(row: AdminBooking) {
  if (row.status === "PENDING") {
    if (vendorWindowOpen(row)) return [];
    return [
      { status: "CONFIRMED", label: "Accept", tone: "primary" as const },
      { status: "CANCELLED", label: "Reject", tone: "danger" as const },
    ];
  }
  if (row.status === "CONFIRMED" || row.status === "ASSIGNED") {
    return [{ status: "IN_PROGRESS", label: "Start work", tone: "primary" as const }];
  }
  if (row.status === "IN_PROGRESS") {
    return [{ status: "COMPLETED", label: "Mark worked", tone: "primary" as const }];
  }
  return [];
}

export function AdminBookingsPanel({
  bucket,
  category,
  listingId,
  empty,
}: {
  bucket?: string;
  category?: string;
  listingId?: string;
  empty: string;
}) {
  const [page, setPage] = useState(1);
  const [rowsKey, setRowsKey] = useState("50");
  const limit = rowLimit(rowsKey);
  const path = `/admin/bookings${qs({ bucket, category, listingId, page: String(page), limit: String(limit) })}`;
  const { rows, total, loading, error, reload, token } = useAdminList<AdminBooking>(path);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    setPage(1);
  }, [bucket, category, listingId, rowsKey]);

  async function setStatus(id: string, status: string) {
    if (!token) return;
    setBusy(id);
    try {
      await api(`/admin/bookings/${id}/status`, { method: "PATCH", token, body: JSON.stringify({ status }) });
      await reload(true);
    } finally {
      setBusy("");
    }
  }

  return (
    <AdminCard className="overflow-hidden p-0">
      {loading ? (
        <EmptyState>Loading…</EmptyState>
      ) : error ? (
        <EmptyState>{error}</EmptyState>
      ) : rows.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <ul className="min-w-[40rem] divide-y divide-slate-100">
            {rows.map((row, index) => {
              const customer = personFrom(row, "customer");
              const vendor = personFrom(row, "vendor");
              const sno = (page - 1) * limit + index + 1;
              const actions = [
                ...nextActions(row).map((action) => ({
                  id: action.status,
                  label: action.label,
                  disabled: busy === row.id,
                  onClick: () => setStatus(row.id, action.status),
                  tone: action.tone === "danger" ? ("danger" as const) : ("primary" as const),
                })),
                ...(!DONE.has(row.status) && row.status !== "PENDING"
                  ? [
                      {
                        id: "cancel",
                        label: "Cancel",
                        disabled: busy === row.id,
                        onClick: () => setStatus(row.id, "CANCELLED"),
                        tone: "danger" as const,
                      },
                    ]
                  : []),
              ];
              return (
                <li key={row.id} className="flex items-center gap-3 whitespace-nowrap px-3 py-2 md:px-4">
                  <span className="w-8 shrink-0 text-xs tabular-nums text-slate-500">{sno}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-medium text-slate-900">
                        {customer.name || "—"} <span className="text-xs font-normal text-slate-500">{customer.phone}</span>
                      </p>
                      <p className="text-sm text-slate-700">
                        {vendor.name || "—"} <span className="text-xs text-slate-500">{vendor.phone}</span>
                      </p>
                      <p className="text-sm font-semibold text-slate-900">{inr(row.total)}</p>
                      <StatusPill value={row.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {[
                        row.bookingNumber,
                        row.type.replaceAll("_", " "),
                        row.scheduledAt ? new Date(row.scheduledAt).toLocaleString("en-IN") : null,
                        customerLocation(row) || null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <RowActions items={actions} />
                  </div>
                </li>
              );
            })}
          </ul>
          <CompactPager page={page} total={total} limit={limit} rows={rowsKey} onPage={setPage} onRows={setRowsKey} />
        </div>
      )}
    </AdminCard>
  );
}
